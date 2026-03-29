# Motor de Deformação Estrutural

> **Tier de Desenvolvimento:** Tier 2 — Alpha  
> **Subsistema:** `damage`  
> **Escopo:** GDExtension (C++) + Vertex Shader (GLSL) + Integração GDScript  
> **Última revisão:** 2026-03-10

---

## 1. Visão Geral da Arquitetura

O Motor de Deformação Estrutural é responsável por simular danos plásticos ao chassi e à carroceria do veículo em tempo real. O design prioriza três objetivos em conflito:

1. **Fidelidade física plausível** — deformação baseada em energia de impacto real.
2. **Performance em runtime** — nenhuma função transcendental no hot path; sem alocações no tick de física.
3. **Escalabilidade multiplayer** — autoridade de servidor, interpolação no cliente.

O sistema é composto por quatro camadas ortogonais:

```
┌─────────────────────────────────────────────────────────┐
│  CAMADA 4 — Integração Sistêmica                        │
│             Aerodinâmica (Drag/Downforce) · Áudio        │
├─────────────────────────────────────────────────────────┤
│  CAMADA 3 — Renderização do Dano                        │
│             Buffer de Deformação Quantizado · Vertex Shader│
├─────────────────────────────────────────────────────────┤
│  CAMADA 2 — Solver Estrutural (PBD)                     │
│             Fidelity Curve · Tick Rate Adaptativo        │
├─────────────────────────────────────────────────────────┤
│  CAMADA 1 — Coleta de Impulso                           │
│             SynaSoftBody3D · Jolt Physics · 60 Hz        │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Autoridade de Simulação

O sistema segue uma arquitetura **Server-Authoritative** estrita. A mesma lógica C++ é executada identicamente em singleplayer (autoridade local) e multiplayer (autoridade remota), eliminando código duplicado e garantindo reproducibilidade determinística.

```
Servidor (autoritativo)           Cliente (apresentação)
─────────────────────────         ──────────────────────
Coleta impulsos Jolt (60 Hz)  ──► Recebe buffer quantizado
Roda solver PBD                   Interpola via Vertex Shader
Atualiza LUT de materiais         Atualiza estado aero/áudio
Serializa deformation buffer  ──► Deserializa + aplica
```

**Implicação de design:** O cliente nunca calcula deformação. Roda apenas o decodificador de buffer e o shader de interpolação. Isso mantém a lógica de físicas em um único lugar e torna o sistema auditável para anti-cheat futuro (Tier 5).

---

## 3. Camada 1 — Coleta de Impulso (`SynaSoftBody3D`)

### 3.1 Conceito de Pseudo-Soft-Body

`SynaSoftBody3D` não é uma simulação de corpo mole tradicional (malha de molas). Em vez disso, é um **invólucro sobre a Jolt Physics** que:

1. Segmenta o mesh da carroceria em **regiões de dano** (*damage cells*) — polígonos convexos pré-computados na edição.
2. Associa cada região a um **RigidBody virtual** monitorado internamente.
3. Intercepta os **impulsos de colisão** reportados pela Jolt a 60 Hz via `PhysicsDirectBodyState3D::get_contact_impulse()`.

```cpp
// SynaSoftBody3D.cpp — coleta de impulso no tick de física
void SynaSoftBody3D::_integrate_forces(PhysicsDirectBodyState3D *p_state) {
    for (int i = 0; i < p_state->get_contact_count(); ++i) {
        const int cell_idx = _map_contact_to_cell(p_state->get_contact_collider_position(i));
        const real_t impulse_mag = p_state->get_contact_impulse(i).length();
        _accumulated_impulse[cell_idx] += impulse_mag;
    }
}
```

### 3.2 Impulso Acumulado

O impulso acumulado $J_{acc}$ por célula é integrado frame a frame e resetado após ser consumido pelo solver PBD:

$$J_{acc}^{(k)} = \sum_{t=0}^{T} j_t^{(k)}$$

onde $j_t^{(k)}$ é o impulso de colisão reportado pela Jolt para a célula $k$ no frame $t$, e $T$ é o número de frames desde o último tick do solver estrutural.

> **Nota de performance:** O array `_accumulated_impulse` é um `PackedFloat32Array` alocado uma única vez no `_ready()`. Zero alocações no hot path.

---

## 4. Camada 2 — Solver Estrutural (PBD)

### 4.1 Position-Based Dynamics no Contexto de Dano

O solver usa **PBD (Position-Based Dynamics)** para resolver as deformações das células. PBD é preferido sobre integração numérica explícita aqui porque:

- É incondicionalmente estável (crítico para tick rates variáveis).
- Suporta constraints de distância mínima/máxima sem resolução de sistemas lineares.
- Permite controle artístico direto sobre rigidez (parâmetro $k$ da constraint).

Cada constraint de distância entre vértices vizinhos $i$ e $j$ é resolvida como:

$$\Delta \mathbf{p}_i = -\frac{w_i}{w_i + w_j} \left( |\mathbf{p}_i - \mathbf{p}_j| - d_{rest} \right) \hat{\mathbf{n}}_{ij}$$

onde:
- $w_i = 1/m_i$ é a massa inversa do vértice (0 para vértices fixos).
- $d_{rest}$ é a distância de repouso definida pelo modelo sem dano.
- $\hat{\mathbf{n}}_{ij}$ é o vetor unitário de $j$ para $i$.

### 4.2 Energia Acumulada vs. Deformação Plástica

Esta é a peça central do modelo de dano. A deformação **plástica** (permanente) é distinta da **elástica** (recuperável).

#### Energia de Impacto

A energia cinética transferida ao chassi em uma colisão é proporional ao impulso acumulado e à velocidade relativa no ponto de contato:

$$E_{impact}^{(k)} = \frac{J_{acc}^{(k)^2}}{2 \, m_{eff}^{(k)}}$$

onde $m_{eff}^{(k)}$ é a massa efetiva da célula $k$ extraída da LUT de materiais (ver §5).

#### Limiar Elasto-Plástico

O material possui dois limiares definidos na LUT:

| Símbolo | Nome | Descrição |
|---|---|---|
| $E_{elastic}$ | Limite elástico | Abaixo deste valor, nenhuma deformação permanente ocorre. |
| $E_{plastic}$ | Limite plástico | Acima deste valor, o material fratura (deformação máxima atingida). |

A deformação plástica normalizada $\alpha \in [0, 1]$ é calculada como:

$$\alpha^{(k)} = \text{clamp}\!\left(\frac{E_{impact}^{(k)} - E_{elastic}}{E_{plastic} - E_{elastic}},\ 0,\ 1\right)$$

Esta fórmula é **puramente aritmética** — sem `pow()`, `sqrt()`, `sin()`, ou qualquer função transcendental. O `clamp` é uma operação de comparação, trivial em hardware.

#### Deslocamento dos Vértices

O deslocamento máximo de cada vértice $i$ dentro da célula $k$ é interpolado a partir de dois vetores pré-computados:

$$\mathbf{d}_i^{(k)} = \alpha^{(k)} \cdot \mathbf{d}_{max,i}^{(k)}$$

onde $\mathbf{d}_{max,i}^{(k)}$ é o vetor de deformação máxima do vértice $i$ na célula $k$, definido como Asset de Design no Godot Editor (posição do vértice em estado de dano total) e baked na estrutura de dados.

O solver PBD então aplica este deslocamento como um **target position constraint**, empurrando os vértices em direção a $\mathbf{p}_{rest,i} + \mathbf{d}_i^{(k)}$ ao longo de múltiplas iterações.

### 4.3 Fidelity Curve — Tick Rate Adaptativo

O solver PBD não roda a 60 Hz para todos os veículos. O custo computacional é reduzido via uma **Curve** customizada do Godot que mapeia distância da câmera → tick rate do solver.

```
Tick Rate (Hz)
    60 ──┐
         │
    20 ──┼─────────────┐
         │              \
     5 ──┼───────────────────────┐
         │
         └──────────────────────────────► Distância (m)
              0    50   150   300
```

A Curve é uma `Resource` exportada no `SynaSoftBody3D`:

```gdscript
# vehicle_damage_component.gd
@export var fidelity_curve: Curve  # amostragem: distância → [0.0, 1.0]

const MAX_SOLVER_HZ: float = 60.0
const MIN_SOLVER_HZ: float = 5.0

func _get_solver_tick_rate(camera_distance: float) -> float:
    var t: float = fidelity_curve.sample_baked(camera_distance / MAX_VISIBLE_DISTANCE)
    return lerpf(MIN_SOLVER_HZ, MAX_SOLVER_HZ, t)
```

**Trade-off:** Veículos distantes recebem solver a 5 Hz; o dano visual deles ainda é interpolado suavemente pelo Vertex Shader (§6). A física autoritativa no servidor sempre roda a 60 Hz para consistência de simulação; a fidelity curve afeta somente o cliente para presentação visual.

---

## 5. Data-Oriented Materials — LUTs

### 5.1 Motivação

Funções transcendentais como $\sigma = K \epsilon^n$ (equação de Hollomon para endurecimento por deformação) são custosas e não-determinísticas entre arquiteturas. A solução é **pré-computar** a curva tensão-deformação como uma LUT de ponto fixo.

### 5.2 Estrutura da LUT

```cpp
// material_lut.h
struct MaterialLUT {
    float elastic_energy_threshold;   // J — abaixo: recuperável
    float plastic_energy_threshold;   // J — acima: fratura
    float effective_mass;             // kg — massa efetiva da célula média
    float max_displacement;           // m — deslocamento máximo permitido
    float drag_coefficient_delta;     // fator multiplicativo sobre Cd para dano total
    float downforce_coefficient_delta;// fator multiplicativo sobre Cl para dano total
    float wind_noise_factor;          // amplitude normalizada para síntese de áudio
    // LUT de deformação: 256 entradas de energia → deslocamento normalizado
    uint16_t deformation_lut[256];    // ponto fixo Q8.8
};
```

### 5.3 Materiais Suportados (Tier 2)

| Material | $E_{elastic}$ | $E_{plastic}$ | $m_{eff}$ | $\Delta C_d$ máx |
|---|---|---|---|---|
| Aço (Steel) | 450 J | 2800 J | 8.5 kg | +0.18 |
| Alumínio | 220 J | 1100 J | 3.2 kg | +0.22 |
| Fibra de Carbono | 80 J | 350 J | 1.1 kg | +0.41 |

> A fibra de carbono fratura com pouca energia mas produz grandes alterações aerodinâmicas — comportamento realista de CFRP.

### 5.4 Amostragem da LUT sem Transcendentais

Para amostrar a deformação em runtime:

```cpp
// Converte energia → índice na LUT (0–255)
inline uint8_t energy_to_lut_index(float energy, const MaterialLUT &mat) {
    float t = (energy - mat.elastic_energy_threshold) /
              (mat.plastic_energy_threshold - mat.elastic_energy_threshold);
    // clamp em hardware — sem branch
    t = t < 0.0f ? 0.0f : (t > 1.0f ? 1.0f : t);
    return static_cast<uint8_t>(t * 255.0f);
}

inline float sample_deformation(float energy, const MaterialLUT &mat) {
    const uint8_t idx = energy_to_lut_index(energy, mat);
    // Ponto fixo Q8.8 → float
    return static_cast<float>(mat.deformation_lut[idx]) / 256.0f;
}
```

Custo: 2 divisões, 2 comparações, 1 cast. Cache-friendly: a LUT inteira de um material cabe em **512 bytes** (uma cache line L2).

---

## 6. Camada 3 — Renderização do Dano

### 6.1 Buffer de Deformação Quantizado

Após cada tick do solver, o servidor serializa o estado de deformação de cada vértice como um deslocamento quantizado de 16 bits por eixo:

```cpp
struct DeformationSample {
    int16_t dx, dy, dz;  // deslocamento em mm (±32.767 m de range)
};
// Para 256 vértices de dano: 256 × 6 bytes = 1.5 KB por veículo por tick
```

A quantização de 16 bits oferece precisão de 1 mm, suficiente para dano visual. O buffer é enviado via `MultiplayerSynchronizer` com compressão delta (apenas vértices que mudaram).

### 6.2 Vertex Shader — Interpolação Suave

O cliente recebe dois buffers: o estado anterior e o estado atual. O Vertex Shader interpola entre eles com base no `TIME` e no período de tick:

```glsl
// damage_deformation.gdshader (Forward+)
shader_type spatial;

uniform sampler2D deformation_buffer_prev;  // Texture2D: RG16S (dx,dy) + BA16S (dz,_)
uniform sampler2D deformation_buffer_curr;
uniform float interpolation_t;             // [0.0, 1.0] — posição no tick atual
uniform float deformation_scale = 0.001;   // mm → m

void vertex() {
    vec2 uv = VERTEX.xz * 0.5 + 0.5; // mapeamento UV planar simplificado

    vec4 prev = texture(deformation_buffer_prev, uv);
    vec4 curr = texture(deformation_buffer_curr, uv);

    // Decode ponto fixo signed 16-bit → float
    vec3 d_prev = vec3(prev.rg, prev.b) * 2.0 - 1.0;
    vec3 d_curr = vec3(curr.rg, curr.b) * 2.0 - 1.0;

    vec3 displacement = mix(d_prev, d_curr, interpolation_t) * deformation_scale;
    VERTEX += displacement;

    // Recalcula normais para iluminação correta
    NORMAL = normalize(NORMAL + cross(displacement, TANGENT.xyz));
}
```

> **Nota:** O mapeamento UV do buffer usa coordenadas de mundo locais do veículo — invariante a rotação do chassi. Isso evita artefatos quando o carro gira.

---

## 7. Camada 4 — Integração Sistêmica

### 7.1 Impacto na Aerodinâmica

O `AeroModel` C++ consulta a deformação acumulada do `SynaSoftBody3D` a cada tick de física para ajustar os coeficientes aerodinâmicos:

```cpp
// aero_model.cpp
void AeroModel::apply_deformation_delta(const SynaSoftBody3D *body) {
    float total_alpha = body->get_mean_cell_deformation();  // [0.0, 1.0]

    // Interpolação linear entre coeficientes nominais e danificados
    _current_cd = Math::lerp(_nominal_cd, _nominal_cd * (1.0f + _lut.drag_coefficient_delta), total_alpha);
    _current_cl = Math::lerp(_nominal_cl, _nominal_cl * (1.0f + _lut.downforce_coefficient_delta), total_alpha);
}
```

**Efeitos gameplay:** Um carro com fibra de carbono severa e danificada (+41% Cd) perde downforce e velocidade máxima significativamente, forçando strategy de pit stop ou condução mais conservadora.

### 7.2 Impacto no Áudio

O sistema de áudio lê o `wind_noise_factor` da LUT para modular a síntese de ruído de vento:

```gdscript
# audio_bus.gd — atualização do ruído de vento a cada física tick
func _on_damage_updated(cell_idx: int, alpha: float) -> void:
    var wind_factor: float = _damage_component.get_cell_wind_noise_factor(cell_idx)
    _wind_noise_player.pitch_scale = lerpf(1.0, 1.0 + wind_factor, alpha)
    _wind_noise_player.volume_db = lerpf(-30.0, 0.0, alpha)
```

A acústica do veículo também é afetada via o sistema de Raytracing de Áudio (C++ BVH): células danificadas alteram o volume interior da cabine, modificando os coeficientes de absorção e reflexão calculados pelo BVH.

---

## 8. Diagrama de Fluxo de Dados

```
[Colisão Jolt 60Hz]
        │
        ▼ impulso por célula
[SynaSoftBody3D — acumula J_acc]
        │
        ▼ a cada N Hz (Fidelity Curve)
[Solver PBD]
   ├─ calcula E_impact = J²/2m
   ├─ consulta LUT de material → α
   ├─ aplica constraint PBD → Δp
   └─ serializa buffer quantizado
        │
   ┌────┴──────────────────────────────┐
   │                                   │
   ▼                                   ▼
[AeroModel]                    [AudioBus]
 atualiza Cd, Cl               modula wind noise
                                        │
                                        ▼
                               [Cliente — Vertex Shader]
                                interpola deformation buffer
                                renderiza dano visual suave
```

---

## 9. Considerações de Performance

| Sistema | Custo por Frame (worst case) | Notas |
|---|---|---|
| Coleta de impulso Jolt | ~0.05 ms | Loop sobre contatos — O(n_contacts) |
| Solver PBD (60 Hz, full fidelity) | ~0.8 ms | 8 iterações, 512 vértices, 1 veículo |
| Serialização do buffer | ~0.02 ms | memcpy de 1.5 KB |
| Vertex Shader (GPU) | ~0.1 ms | Completamente paralelo em GPU |
| Atualização AeroModel | ~0.01 ms | 2 lerps e 1 consulta |
| Atualização AudioBus | ~0.01 ms | GDScript, não crítico |

**Total estimado no servidor (8 veículos):** ~7 ms → bem dentro do budget de 16.6 ms para 60 Hz.

**Estratégias de escalonamento:**
- LOD do solver via Fidelity Curve já implementado.
- Células "frozen" (α = 1.0 atingido) são excluídas das iterações PBD — sem custo residual.
- O buffer quantizado pode ser comprimido com RLE se poucas células mudarem por tick.

---

## 10. Referências e Links

- [[Vehicle Physics]] — Sistema de física do veículo (base sobre a qual o dano opera)
- [[Step 06 - AeroModel]] — Implementação do modelo aerodinâmico
- [[Synadrive MVP Vision]] — Roadmap e posicionamento de Tier
- [Jolt Physics — Collision Events](https://github.com/jrouwe/JoltPhysics)
- [Position-Based Dynamics — Müller et al. 2007](https://matthias-research.github.io/pages/publications/posBasedDyn.pdf)
- [Data-Oriented Design — Richard Fabian](https://www.dataorienteddesign.com/dodbook/)
- [Pacejka Magic Formula](https://en.wikipedia.org/wiki/Hans_B._Pacejka#Magic_formula_tyre_model) — referência de contexto para o estilo de LUT

---

*Documento gerado em 2026-03-10. Atualizar quando a implementação de Tier 2 for iniciada.*

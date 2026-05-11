> [!warning] Legacy — Pre-MJIP Architecture
> This note describes the old VehicleController + Pacejka GDExtension approach. **MJIP supersedes this architecture.** Preserved for historical reference only. Do not implement from these notes without first reading [[MJIP — Overview]] and [[MJIP-Trackside Integration]].

> [!danger] Synadrive-Era Draft
> Written in Portuguese. References `SynaSoftBody3D` which does not exist in the current codebase. This is an unupdated artefact from before the Trackside rename. Content has not been reviewed or reconciled with MJIP.

     1|# Motor de Deformação Estrutural
     2|
     3|> **Tier de Desenvolvimento:** Tier 2 — Alpha  
     4|> **Subsistema:** `damage`  
     5|> **Escopo:** GDExtension (C++) + Vertex Shader (GLSL) + Integração GDScript  
     6|> **Última revisão:** 2026-03-10
     7|
     8|---
     9|
    10|## 1. Visão Geral da Arquitetura
    11|
    12|O Motor de Deformação Estrutural é responsável por simular danos plásticos ao chassi e à carroceria do veículo em tempo real. O design prioriza três objetivos em conflito:
    13|
    14|1. **Fidelidade física plausível** — deformação baseada em energia de impacto real.
    15|2. **Performance em runtime** — nenhuma função transcendental no hot path; sem alocações no tick de física.
    16|3. **Escalabilidade multiplayer** — autoridade de servidor, interpolação no cliente.
    17|
    18|O sistema é composto por quatro camadas ortogonais:
    19|
    20|```
    21|┌─────────────────────────────────────────────────────────┐
    22|│  CAMADA 4 — Integração Sistêmica                        │
    23|│             Aerodinâmica (Drag/Downforce) · Áudio        │
    24|├─────────────────────────────────────────────────────────┤
    25|│  CAMADA 3 — Renderização do Dano                        │
    26|│             Buffer de Deformação Quantizado · Vertex Shader│
    27|├─────────────────────────────────────────────────────────┤
    28|│  CAMADA 2 — Solver Estrutural (PBD)                     │
    29|│             Fidelity Curve · Tick Rate Adaptativo        │
    30|├─────────────────────────────────────────────────────────┤
    31|│  CAMADA 1 — Coleta de Impulso                           │
    32|│             SynaSoftBody3D · Jolt Physics · 60 Hz        │
    33|└─────────────────────────────────────────────────────────┘
    34|```
    35|
    36|---
    37|
    38|## 2. Autoridade de Simulação
    39|
    40|O sistema segue uma arquitetura **Server-Authoritative** estrita. A mesma lógica C++ é executada identicamente em singleplayer (autoridade local) e multiplayer (autoridade remota), eliminando código duplicado e garantindo reproducibilidade determinística.
    41|
    42|```
    43|Servidor (autoritativo)           Cliente (apresentação)
    44|─────────────────────────         ──────────────────────
    45|Coleta impulsos Jolt (60 Hz)  ──► Recebe buffer quantizado
    46|Roda solver PBD                   Interpola via Vertex Shader
    47|Atualiza LUT de materiais         Atualiza estado aero/áudio
    48|Serializa deformation buffer  ──► Deserializa + aplica
    49|```
    50|
    51|**Implicação de design:** O cliente nunca calcula deformação. Roda apenas o decodificador de buffer e o shader de interpolação. Isso mantém a lógica de físicas em um único lugar e torna o sistema auditável para anti-cheat futuro (Tier 5).
    52|
    53|---
    54|
    55|## 3. Camada 1 — Coleta de Impulso (`SynaSoftBody3D`)
    56|
    57|### 3.1 Conceito de Pseudo-Soft-Body
    58|
    59|`SynaSoftBody3D` não é uma simulação de corpo mole tradicional (malha de molas). Em vez disso, é um **invólucro sobre a Jolt Physics** que:
    60|
    61|1. Segmenta o mesh da carroceria em **regiões de dano** (*damage cells*) — polígonos convexos pré-computados na edição.
    62|2. Associa cada região a um **RigidBody virtual** monitorado internamente.
    63|3. Intercepta os **impulsos de colisão** reportados pela Jolt a 60 Hz via `PhysicsDirectBodyState3D::get_contact_impulse()`.
    64|
    65|```cpp
    66|// SynaSoftBody3D.cpp — coleta de impulso no tick de física
    67|void SynaSoftBody3D::_integrate_forces(PhysicsDirectBodyState3D *p_state) {
    68|    for (int i = 0; i < p_state->get_contact_count(); ++i) {
    69|        const int cell_idx = _map_contact_to_cell(p_state->get_contact_collider_position(i));
    70|        const real_t impulse_mag = p_state->get_contact_impulse(i).length();
    71|        _accumulated_impulse[cell_idx] += impulse_mag;
    72|    }
    73|}
    74|```
    75|
    76|### 3.2 Impulso Acumulado
    77|
    78|O impulso acumulado $J_{acc}$ por célula é integrado frame a frame e resetado após ser consumido pelo solver PBD:
    79|
    80|$$J_{acc}^{(k)} = \sum_{t=0}^{T} j_t^{(k)}$$
    81|
    82|onde $j_t^{(k)}$ é o impulso de colisão reportado pela Jolt para a célula $k$ no frame $t$, e $T$ é o número de frames desde o último tick do solver estrutural.
    83|
    84|> **Nota de performance:** O array `_accumulated_impulse` é um `PackedFloat32Array` alocado uma única vez no `_ready()`. Zero alocações no hot path.
    85|
    86|---
    87|
    88|## 4. Camada 2 — Solver Estrutural (PBD)
    89|
    90|### 4.1 Position-Based Dynamics no Contexto de Dano
    91|
    92|O solver usa **PBD (Position-Based Dynamics)** para resolver as deformações das células. PBD é preferido sobre integração numérica explícita aqui porque:
    93|
    94|- É incondicionalmente estável (crítico para tick rates variáveis).
    95|- Suporta constraints de distância mínima/máxima sem resolução de sistemas lineares.
    96|- Permite controle artístico direto sobre rigidez (parâmetro $k$ da constraint).
    97|
    98|Cada constraint de distância entre vértices vizinhos $i$ e $j$ é resolvida como:
    99|
   100|$$\Delta \mathbf{p}_i = -\frac{w_i}{w_i + w_j} \left( |\mathbf{p}_i - \mathbf{p}_j| - d_{rest} \right) \hat{\mathbf{n}}_{ij}$$
   101|
   102|onde:
   103|- $w_i = 1/m_i$ é a massa inversa do vértice (0 para vértices fixos).
   104|- $d_{rest}$ é a distância de repouso definida pelo modelo sem dano.
   105|- $\hat{\mathbf{n}}_{ij}$ é o vetor unitário de $j$ para $i$.
   106|
   107|### 4.2 Energia Acumulada vs. Deformação Plástica
   108|
   109|Esta é a peça central do modelo de dano. A deformação **plástica** (permanente) é distinta da **elástica** (recuperável).
   110|
   111|#### Energia de Impacto
   112|
   113|A energia cinética transferida ao chassi em uma colisão é proporional ao impulso acumulado e à velocidade relativa no ponto de contato:
   114|
   115|$$E_{impact}^{(k)} = \frac{J_{acc}^{(k)^2}}{2 \, m_{eff}^{(k)}}$$
   116|
   117|onde $m_{eff}^{(k)}$ é a massa efetiva da célula $k$ extraída da LUT de materiais (ver §5).
   118|
   119|#### Limiar Elasto-Plástico
   120|
   121|O material possui dois limiares definidos na LUT:
   122|
   123|| Símbolo | Nome | Descrição |
   124||---|---|---|
   125|| $E_{elastic}$ | Limite elástico | Abaixo deste valor, nenhuma deformação permanente ocorre. |
   126|| $E_{plastic}$ | Limite plástico | Acima deste valor, o material fratura (deformação máxima atingida). |
   127|
   128|A deformação plástica normalizada $\alpha \in [0, 1]$ é calculada como:
   129|
   130|$$\alpha^{(k)} = \text{clamp}\!\left(\frac{E_{impact}^{(k)} - E_{elastic}}{E_{plastic} - E_{elastic}},\ 0,\ 1\right)$$
   131|
   132|Esta fórmula é **puramente aritmética** — sem `pow()`, `sqrt()`, `sin()`, ou qualquer função transcendental. O `clamp` é uma operação de comparação, trivial em hardware.
   133|
   134|#### Deslocamento dos Vértices
   135|
   136|O deslocamento máximo de cada vértice $i$ dentro da célula $k$ é interpolado a partir de dois vetores pré-computados:
   137|
   138|$$\mathbf{d}_i^{(k)} = \alpha^{(k)} \cdot \mathbf{d}_{max,i}^{(k)}$$
   139|
   140|onde $\mathbf{d}_{max,i}^{(k)}$ é o vetor de deformação máxima do vértice $i$ na célula $k$, definido como Asset de Design no Godot Editor (posição do vértice em estado de dano total) e baked na estrutura de dados.
   141|
   142|O solver PBD então aplica este deslocamento como um **target position constraint**, empurrando os vértices em direção a $\mathbf{p}_{rest,i} + \mathbf{d}_i^{(k)}$ ao longo de múltiplas iterações.
   143|
   144|### 4.3 Fidelity Curve — Tick Rate Adaptativo
   145|
   146|O solver PBD não roda a 60 Hz para todos os veículos. O custo computacional é reduzido via uma **Curve** customizada do Godot que mapeia distância da câmera → tick rate do solver.
   147|
   148|```
   149|Tick Rate (Hz)
   150|    60 ──┐
   151|         │
   152|    20 ──┼─────────────┐
   153|         │              \
   154|     5 ──┼───────────────────────┐
   155|         │
   156|         └──────────────────────────────► Distância (m)
   157|              0    50   150   300
   158|```
   159|
   160|A Curve é uma `Resource` exportada no `SynaSoftBody3D`:
   161|
   162|```gdscript
   163|# vehicle_damage_component.gd
   164|@export var fidelity_curve: Curve  # amostragem: distância → [0.0, 1.0]
   165|
   166|const MAX_SOLVER_HZ: float = 60.0
   167|const MIN_SOLVER_HZ: float = 5.0
   168|
   169|func _get_solver_tick_rate(camera_distance: float) -> float:
   170|    var t: float = fidelity_curve.sample_baked(camera_distance / MAX_VISIBLE_DISTANCE)
   171|    return lerpf(MIN_SOLVER_HZ, MAX_SOLVER_HZ, t)
   172|```
   173|
   174|**Trade-off:** Veículos distantes recebem solver a 5 Hz; o dano visual deles ainda é interpolado suavemente pelo Vertex Shader (§6). A física autoritativa no servidor sempre roda a 60 Hz para consistência de simulação; a fidelity curve afeta somente o cliente para presentação visual.
   175|
   176|---
   177|
   178|## 5. Data-Oriented Materials — LUTs
   179|
   180|### 5.1 Motivação
   181|
   182|Funções transcendentais como $\sigma = K \epsilon^n$ (equação de Hollomon para endurecimento por deformação) são custosas e não-determinísticas entre arquiteturas. A solução é **pré-computar** a curva tensão-deformação como uma LUT de ponto fixo.
   183|
   184|### 5.2 Estrutura da LUT
   185|
   186|```cpp
   187|// material_lut.h
   188|struct MaterialLUT {
   189|    float elastic_energy_threshold;   // J — abaixo: recuperável
   190|    float plastic_energy_threshold;   // J — acima: fratura
   191|    float effective_mass;             // kg — massa efetiva da célula média
   192|    float max_displacement;           // m — deslocamento máximo permitido
   193|    float drag_coefficient_delta;     // fator multiplicativo sobre Cd para dano total
   194|    float downforce_coefficient_delta;// fator multiplicativo sobre Cl para dano total
   195|    float wind_noise_factor;          // amplitude normalizada para síntese de áudio
   196|    // LUT de deformação: 256 entradas de energia → deslocamento normalizado
   197|    uint16_t deformation_lut[256];    // ponto fixo Q8.8
   198|};
   199|```
   200|
   201|### 5.3 Materiais Suportados (Tier 2)
   202|
   203|| Material | $E_{elastic}$ | $E_{plastic}$ | $m_{eff}$ | $\Delta C_d$ máx |
   204||---|---|---|---|---|
   205|| Aço (Steel) | 450 J | 2800 J | 8.5 kg | +0.18 |
   206|| Alumínio | 220 J | 1100 J | 3.2 kg | +0.22 |
   207|| Fibra de Carbono | 80 J | 350 J | 1.1 kg | +0.41 |
   208|
   209|> A fibra de carbono fratura com pouca energia mas produz grandes alterações aerodinâmicas — comportamento realista de CFRP.
   210|
   211|### 5.4 Amostragem da LUT sem Transcendentais
   212|
   213|Para amostrar a deformação em runtime:
   214|
   215|```cpp
   216|// Converte energia → índice na LUT (0–255)
   217|inline uint8_t energy_to_lut_index(float energy, const MaterialLUT &mat) {
   218|    float t = (energy - mat.elastic_energy_threshold) /
   219|              (mat.plastic_energy_threshold - mat.elastic_energy_threshold);
   220|    // clamp em hardware — sem branch
   221|    t = t < 0.0f ? 0.0f : (t > 1.0f ? 1.0f : t);
   222|    return static_cast<uint8_t>(t * 255.0f);
   223|}
   224|
   225|inline float sample_deformation(float energy, const MaterialLUT &mat) {
   226|    const uint8_t idx = energy_to_lut_index(energy, mat);
   227|    // Ponto fixo Q8.8 → float
   228|    return static_cast<float>(mat.deformation_lut[idx]) / 256.0f;
   229|}
   230|```
   231|
   232|Custo: 2 divisões, 2 comparações, 1 cast. Cache-friendly: a LUT inteira de um material cabe em **512 bytes** (uma cache line L2).
   233|
   234|---
   235|
   236|## 6. Camada 3 — Renderização do Dano
   237|
   238|### 6.1 Buffer de Deformação Quantizado
   239|
   240|Após cada tick do solver, o servidor serializa o estado de deformação de cada vértice como um deslocamento quantizado de 16 bits por eixo:
   241|
   242|```cpp
   243|struct DeformationSample {
   244|    int16_t dx, dy, dz;  // deslocamento em mm (±32.767 m de range)
   245|};
   246|// Para 256 vértices de dano: 256 × 6 bytes = 1.5 KB por veículo por tick
   247|```
   248|
   249|A quantização de 16 bits oferece precisão de 1 mm, suficiente para dano visual. O buffer é enviado via `MultiplayerSynchronizer` com compressão delta (apenas vértices que mudaram).
   250|
   251|### 6.2 Vertex Shader — Interpolação Suave
   252|
   253|O cliente recebe dois buffers: o estado anterior e o estado atual. O Vertex Shader interpola entre eles com base no `TIME` e no período de tick:
   254|
   255|```glsl
   256|// damage_deformation.gdshader (Forward+)
   257|shader_type spatial;
   258|
   259|uniform sampler2D deformation_buffer_prev;  // Texture2D: RG16S (dx,dy) + BA16S (dz,_)
   260|uniform sampler2D deformation_buffer_curr;
   261|uniform float interpolation_t;             // [0.0, 1.0] — posição no tick atual
   262|uniform float deformation_scale = 0.001;   // mm → m
   263|
   264|void vertex() {
   265|    vec2 uv = VERTEX.xz * 0.5 + 0.5; // mapeamento UV planar simplificado
   266|
   267|    vec4 prev = texture(deformation_buffer_prev, uv);
   268|    vec4 curr = texture(deformation_buffer_curr, uv);
   269|
   270|    // Decode ponto fixo signed 16-bit → float
   271|    vec3 d_prev = vec3(prev.rg, prev.b) * 2.0 - 1.0;
   272|    vec3 d_curr = vec3(curr.rg, curr.b) * 2.0 - 1.0;
   273|
   274|    vec3 displacement = mix(d_prev, d_curr, interpolation_t) * deformation_scale;
   275|    VERTEX += displacement;
   276|
   277|    // Recalcula normais para iluminação correta
   278|    NORMAL = normalize(NORMAL + cross(displacement, TANGENT.xyz));
   279|}
   280|```
   281|
   282|> **Nota:** O mapeamento UV do buffer usa coordenadas de mundo locais do veículo — invariante a rotação do chassi. Isso evita artefatos quando o carro gira.
   283|
   284|---
   285|
   286|## 7. Camada 4 — Integração Sistêmica
   287|
   288|### 7.1 Impacto na Aerodinâmica
   289|
   290|O `AeroModel` C++ consulta a deformação acumulada do `SynaSoftBody3D` a cada tick de física para ajustar os coeficientes aerodinâmicos:
   291|
   292|```cpp
   293|// aero_model.cpp
   294|void AeroModel::apply_deformation_delta(const SynaSoftBody3D *body) {
   295|    float total_alpha = body->get_mean_cell_deformation();  // [0.0, 1.0]
   296|
   297|    // Interpolação linear entre coeficientes nominais e danificados
   298|    _current_cd = Math::lerp(_nominal_cd, _nominal_cd * (1.0f + _lut.drag_coefficient_delta), total_alpha);
   299|    _current_cl = Math::lerp(_nominal_cl, _nominal_cl * (1.0f + _lut.downforce_coefficient_delta), total_alpha);
   300|}
   301|```
   302|
   303|**Efeitos gameplay:** Um carro com fibra de carbono severa e danificada (+41% Cd) perde downforce e velocidade máxima significativamente, forçando strategy de pit stop ou condução mais conservadora.
   304|
   305|### 7.2 Impacto no Áudio
   306|
   307|O sistema de áudio lê o `wind_noise_factor` da LUT para modular a síntese de ruído de vento:
   308|
   309|```gdscript
   310|# audio_bus.gd — atualização do ruído de vento a cada física tick
   311|func _on_damage_updated(cell_idx: int, alpha: float) -> void:
   312|    var wind_factor: float = _damage_component.get_cell_wind_noise_factor(cell_idx)
   313|    _wind_noise_player.pitch_scale = lerpf(1.0, 1.0 + wind_factor, alpha)
   314|    _wind_noise_player.volume_db = lerpf(-30.0, 0.0, alpha)
   315|```
   316|
   317|A acústica do veículo também é afetada via o sistema de Raytracing de Áudio (C++ BVH): células danificadas alteram o volume interior da cabine, modificando os coeficientes de absorção e reflexão calculados pelo BVH.
   318|
   319|---
   320|
   321|## 8. Diagrama de Fluxo de Dados
   322|
   323|```
   324|[Colisão Jolt 60Hz]
   325|        │
   326|        ▼ impulso por célula
   327|[SynaSoftBody3D — acumula J_acc]
   328|        │
   329|        ▼ a cada N Hz (Fidelity Curve)
   330|[Solver PBD]
   331|   ├─ calcula E_impact = J²/2m
   332|   ├─ consulta LUT de material → α
   333|   ├─ aplica constraint PBD → Δp
   334|   └─ serializa buffer quantizado
   335|        │
   336|   ┌────┴──────────────────────────────┐
   337|   │                                   │
   338|   ▼                                   ▼
   339|[AeroModel]                    [AudioBus]
   340| atualiza Cd, Cl               modula wind noise
   341|                                        │
   342|                                        ▼
   343|                               [Cliente — Vertex Shader]
   344|                                interpola deformation buffer
   345|                                renderiza dano visual suave
   346|```
   347|
   348|---
   349|
   350|## 9. Considerações de Performance
   351|
   352|| Sistema | Custo por Frame (worst case) | Notas |
   353||---|---|---|
   354|| Coleta de impulso Jolt | ~0.05 ms | Loop sobre contatos — O(n_contacts) |
   355|| Solver PBD (60 Hz, full fidelity) | ~0.8 ms | 8 iterações, 512 vértices, 1 veículo |
   356|| Serialização do buffer | ~0.02 ms | memcpy de 1.5 KB |
   357|| Vertex Shader (GPU) | ~0.1 ms | Completamente paralelo em GPU |
   358|| Atualização AeroModel | ~0.01 ms | 2 lerps e 1 consulta |
   359|| Atualização AudioBus | ~0.01 ms | GDScript, não crítico |
   360|
   361|**Total estimado no servidor (8 veículos):** ~7 ms → bem dentro do budget de 16.6 ms para 60 Hz.
   362|
   363|**Estratégias de escalonamento:**
   364|- LOD do solver via Fidelity Curve já implementado.
   365|- Células "frozen" (α = 1.0 atingido) são excluídas das iterações PBD — sem custo residual.
   366|- O buffer quantizado pode ser comprimido com RLE se poucas células mudarem por tick.
   367|
   368|---
   369|
   370|## 10. Referências e Links
   371|
   372|- [[Vehicle Physics]] — Sistema de física do veículo (base sobre a qual o dano opera)
   373|- [[Step 06 - AeroModel]] — Implementação do modelo aerodinâmico
   374|- [[Trackside MVP Vision]] — Roadmap e posicionamento de Tier
   375|- [Jolt Physics — Collision Events](https://github.com/jrouwe/JoltPhysics)
   376|- [Position-Based Dynamics — Müller et al. 2007](https://matthias-research.github.io/pages/publications/posBasedDyn.pdf)
   377|- [Data-Oriented Design — Richard Fabian](https://www.dataorienteddesign.com/dodbook/)
   378|- [Pacejka Magic Formula](https://en.wikipedia.org/wiki/Hans_B._Pacejka#Magic_formula_tyre_model) — referência de contexto para o estilo de LUT
   379|
   380|---
   381|
   382|*Documento gerado em 2026-03-10. Atualizar quando a implementação de Tier 2 for iniciada.*
   383|
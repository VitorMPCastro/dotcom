---
banner: "![[synadrive-banner.png]]"
tags:
  - Synadrive
  - vision
  - roadmap
cover: "![[synadrive-cover.png]]"
type: vision
status: active
created: 2026-02-25
updated: 2026-02-25
version: 0.2.0
title: Synadrive — MVP Vision Document
aliases: [Synadrive — MVP Vision Document]
linter-yaml-title-alias: Synadrive — MVP Vision Document
---

# Synadrive — MVP Vision Document

> **Canonical source of truth** for Synadrive's feature scope, system designs, and development tiers.<br>
> Referenced by all `.github/copilot-instructions.md` AI instruction files in the codebase.

**Related:** [[What Is Synadrive]] · [[The Godot Game Engine]] · [[Synadrive MVP Vision.canvas]]

---

## Tier Definitions

Synadrive follows a **5-tier development roadmap**. Each tier is a complete, playable milestone — not a partial state.

### Tier 1 — MVP (Minimum Viable Product)

**Goal:** A single car on a single track with working sim-level physics, a trainable AI agent, and developer tooling.

- **Target audience:** Developer (you) — prove the core loop works.
- **Success criteria:** Player can drive a car with realistic Pacejka tire physics, train an AI agent that completes a lap, and view telemetry. Basic weather affects track grip.
- **Estimated systems:** ~15 core components.

### Tier 2 — Alpha

**Goal:** Multiple tracks and car classes, richer AI, driver identity, and the foundations of race management.

- **Target audience:** Internal playtesting, close friends.
- **Success criteria:** 3-5 tracks, 4+ car classes, AI with distinct personalities, ghost racing, engine sound synthesis, force feedback, tire/fuel strategy basics, save/load.
- **Estimated systems:** ~12 new components + expansion of Tier 1 systems.

### Tier 3 — Beta

**Goal:** Full race experience with career mode, pit stops, replays, dialogue, and custom editors.

- **Target audience:** Closed beta testers.
- **Success criteria:** Complete race weekends (practice → qualifying → race), career progression, AI dialogue via ONNX, world editor, replay system, accessibility options.
- **Estimated systems:** ~12 new components + expansion of Tier 1-2 systems.

### Tier 4 — Early Access

**Goal:** Community features and social play.

- **Target audience:** Steam Early Access players.
- **Success criteria:** Multiplayer, mod support, leaderboards, photo mode, full track roster, Steam integration.
- **Estimated systems:** ~8 new components + polish of existing systems.

### Tier 5 — 1.0 Release

**Goal:** Launch-quality polish, completeness, and community infrastructure.

- **Target audience:** General public.
- **Success criteria:** Full localization, anti-cheat, community tools, day/night cycle, model marketplace, full accessibility compliance.
- **Estimated systems:** ~7 new components + final polish pass.

---

## Feature Registry

> Master table of all planned features. **Status key:** 🔴 Not started · 🟡 In progress · 🟢 Complete · ⚪ Deferred.

| #   | Feature                      | Category              | Tier | Status | Language       | Dependencies              |
| --- | ---------------------------- | --------------------- | ---- | ------ | -------------- | ------------------------- |
| 1   | Core Vehicle Physics         | Physics & Vehicle     | T1   | 🔴     | GDScript + C++ | Jolt Physics 3D           |
| 2   | Pacejka Tire Model           | Physics & Vehicle     | T1   | 🔴     | C++ (GDExt)    | Core Physics              |
| 3   | Suspension System            | Physics & Vehicle     | T1   | 🔴     | C++ (GDExt)    | Core Physics              |
| 4   | Aerodynamics                 | Physics & Vehicle     | T1   | 🔴     | GDScript       | Core Physics              |
| 5   | Drivetrain                   | Physics & Vehicle     | T1   | 🔴     | GDScript       | Core Physics              |
| 6   | AI Driving Agent             | AI & Training         | T1   | 🔴     | GDScript + C++ | ONNX Infra, Core Physics  |
| 7   | ONNX Inference Engine        | AI & Training         | T1   | 🔴     | C++ (GDExt)    | godot-cpp                 |
| 8   | Behavior Tree Fallback       | AI & Training         | T1   | 🔴     | GDScript       | AI Agent                  |
| 9   | Raytracing — Audio RT        | Infrastructure        | T1   | 🔴     | C++ (GDExt)    | Custom BVH                |
| 10  | Raytracing — AI RT           | Infrastructure        | T1   | 🔴     | C++ (GDExt)    | Custom BVH                |
| 11  | Weather System (basic)       | Weather & Environment | T1   | 🔴     | GDScript       | —                         |
| 12  | Track Conditions (basic)     | Weather & Environment | T1   | 🔴     | GDScript       | Weather                   |
| 13  | Camera System                | Camera                | T1   | 🔴     | GDScript       | —                         |
| 14  | Basic Audio & Mixing         | Audio                 | T1   | 🔴     | GDScript       | AudioBus autoload         |
| 15  | HUD & Menus                  | UI/UX                 | T1   | 🔴     | GDScript       | GUIDE input               |
| 16  | Settings System              | UI/UX                 | T1   | 🔴     | GDScript       | SettingsManager autoload  |
| 17  | Driving Assists              | UI/UX                 | T1   | 🔴     | GDScript       | Core Physics              |
| 18  | Telemetry Recording          | Telemetry & Data      | T1   | 🔴     | GDScript       | Core Physics              |
| 19  | Debug Tools                  | Infrastructure        | T1   | 🔴     | GDScript       | —                         |
| 20  | Build & Deployment           | Infrastructure        | T1   | 🔴     | CI/SCons       | GitHub Actions            |
| 21  | Multiple Tracks (3-5)        | Content               | T2   | 🔴     | Scenes         | Track system              |
| 22  | More Car Classes             | Content               | T2   | 🔴     | Resources      | CarSpec                   |
| 23  | AI Personalities             | AI & Training         | T2   | 🔴     | GDScript       | AI Agent                  |
| 24  | Training Visualization       | AI & Training         | T2   | 🔴     | GDScript       | Telemetry                 |
| 25  | Character Builder            | Character & Dialogue  | T2   | 🔴     | GDScript       | —                         |
| 26  | Basic NPC System             | Character & Dialogue  | T2   | 🔴     | GDScript       | Character Builder         |
| 27  | Engine Sound Synthesis       | Audio                 | T2   | 🔴     | C++ (GDExt)    | Audio RT                  |
| 28  | Basic Tire Audio             | Audio                 | T1   | 🔴     | GDScript       | Core Physics              |
| 28b | Surface-Dependent Tire Audio | Audio                 | T2   | 🔴     | GDScript       | Basic Tire Audio          |
| 29  | Tire Thermal Model           | Physics & Vehicle     | T2   | 🔴     | C++ (GDExt)    | Tire Model                |
| 30  | Fuel System                  | Physics & Vehicle     | T2   | 🔴     | GDScript       | Drivetrain                |
| 31  | Damage Model (wear)          | Physics & Vehicle     | T2   | 🔴     | GDScript       | Core Physics              |
| 32  | Force Feedback               | Input                 | T2   | 🔴     | C++ (GDExt)    | Core Physics              |
| 33  | Ghost Racing                 | Telemetry & Data      | T2   | 🔴     | GDScript       | Telemetry Recording       |
| 34  | Session Management           | Race Management       | T2   | 🔴     | GDScript       | GameManager               |
| 35  | Starting Procedure           | Race Management       | T2   | 🔴     | GDScript       | Session Management        |
| 36  | Save/Load System             | Infrastructure        | T2   | 🔴     | GDScript       | —                         |
| 37  | Localization Foundation      | Infrastructure        | T2   | 🔴     | GDScript       | —                         |
| 38  | Dialogue System (ONNX)       | Character & Dialogue  | T3   | 🔴     | GDScript + C++ | ONNX Infra, Character     |
| 39  | TTS Integration              | Character & Dialogue  | T3   | 🔴     | C++ (GDExt)    | ONNX Infra                |
| 40  | Career Mode                  | Career & Progression  | T3   | 🔴     | GDScript       | Session Mgmt, Save        |
| 41  | Championship System          | Career & Progression  | T3   | 🔴     | GDScript       | Career Mode               |
| 42  | Pit Stop System              | Race Management       | T3   | 🔴     | GDScript       | Tire/Fuel, Damage         |
| 43  | Race Director & Flags        | Race Management       | T3   | 🔴     | GDScript       | Session Management        |
| 44  | Replay System                | Telemetry & Data      | T3   | 🔴     | GDScript       | Telemetry Recording       |
| 45  | Replay Cameras               | Camera                | T3   | 🔴     | GDScript       | Replay System, Camera     |
| 46  | World Editor                 | Editor Tools          | T3   | 🔴     | GDScript       | Track system              |
| 47  | AI Behavior Node Editor      | Editor Tools          | T3   | 🔴     | GDScript       | AI Agent                  |
| 48  | Championship Rules Editor    | Editor Tools          | T3   | 🔴     | GDScript       | Championship              |
| 49  | Spotter / Engineer Voice     | Audio                 | T3   | 🔴     | GDScript       | TTS, Race state           |
| 50  | Full Damage Model            | Physics & Vehicle     | T3   | 🔴     | GDScript + C++ | Damage (wear)             |
| 51  | Accessibility                | Accessibility & QoL   | T3   | 🔴     | GDScript       | Settings                  |
| 52  | Multiplayer                  | Multiplayer & Social  | T4   | 🔴     | GDScript + C++ | Session Mgmt              |
| 53  | Mod Support                  | Multiplayer & Social  | T4   | 🔴     | GDScript       | Save/Load                 |
| 54a | Local Leaderboards           | Multiplayer & Social  | T2   | 🔴     | GDScript       | Telemetry                 |
| 54b | Online Leaderboards          | Multiplayer & Social  | T4   | 🔴     | GDScript       | Telemetry, Multiplayer    |
| 55  | Photo Mode                   | Multiplayer & Social  | T4   | 🔴     | GDScript       | Camera, Post-processing   |
| 56  | Full Track Roster            | Content               | T4   | 🔴     | Scenes         | Track system              |
| 57  | Polished NPCs                | Character & Dialogue  | T4   | 🔴     | GDScript       | Dialogue, Character       |
| 58  | Cloud Saves                  | Infrastructure        | T4   | 🔴     | GDScript       | Save/Load, Steam SDK      |
| 59  | Steam Integration            | Infrastructure        | T4   | 🔴     | C++ (GDExt)    | —                         |
| 60  | Day/Night Cycle              | Weather & Environment | T5   | 🔴     | GDScript       | Weather, Lighting         |
| 61  | Full Localization            | Infrastructure        | T5   | 🔴     | GDScript       | Localization Foundation   |
| 62  | Anti-Cheat                   | Infrastructure        | T5   | 🔴     | C++ (GDExt)    | Multiplayer               |
| 63  | Community Tools              | Multiplayer & Social  | T5   | 🔴     | GDScript       | Mod Support               |
| 64  | Model Marketplace            | Multiplayer & Social  | T5   | 🔴     | GDScript       | Mod Support, Steam        |
| 65  | Full Accessibility           | Accessibility & QoL   | T5   | 🔴     | GDScript       | Accessibility (T3)        |
| 66  | Curriculum Learning          | AI & Training         | T2   | 🔴     | GDScript       | AI Agent, Multiple Tracks |

---

## System Deep-Dives

### 1. Core Physics & Vehicle Handling

**Tier:** 1 (MVP) | **Language:** GDScript + C++ GDExtension | **Owner:** `game-architect`

**Description:** The foundation of everything. Realistic sim-level vehicle dynamics built on Jolt Physics 3D. Uses a composition-based architecture where each physics aspect (tires, suspension, aero, drivetrain) is a separate node attached to a `RigidBody3D` vehicle root.

**Architecture:**

```
VehicleRoot (RigidBody3D)
├── TireFL/FR/RL/RR (TireModel)     — Pacejka Magic Formula
├── SuspensionFL/FR/RL/RR            — Spring-damper model
├── AeroModel                         — Drag + downforce
├── Drivetrain                        — Engine → gearbox → diff → wheels
├── VehicleController                 — Orchestrator
└── TelemetryRecorder                 — Data logging
```

**Sub-features:**

| Sub-feature | Tier | Notes |
|---|---|---|
| Pacejka tire model (lateral + longitudinal) | T1 | `F = D·sin(C·arctan(B·slip - E·(B·slip - arctan(B·slip))))`. C++ GDExtension for hot path. |
| Combined slip (lateral + longitudinal interaction) | T1 | Friction circle model coupling both forces. |
| Spring-damper suspension | T1 | Per-wheel with configurable stiffness, bump/rebound damping, travel limits. |
| Anti-roll bars | T2 | Couples left/right suspension to resist body roll. |
| Weight transfer (longitudinal + lateral) | T1 | Redistributes load to each wheel based on acceleration and cornering. |
| Aerodynamic drag & downforce | T1 | `F_drag = 0.5·Cd·A·ρ·v²`. Speed-dependent. |
| Engine torque curve + rev limiter | T1 | Data-driven via `CarSpec` Resource. |
| Gearbox (manual + sequential + automatic) | T1 | Configurable ratios, shift times, gear count. |
| Differential (open, limited-slip, locked) | T2 | Torque distribution strategy. |
| Tire thermal model | T2 | Surface/carcass/core temperature layers. Affects grip. |
| Tire wear degradation | T2 | Performance drops over stint length. Compound-dependent. |
| Fuel consumption + weight change | T2 | Lighter car as fuel burns. Strategy implications. |
| Mechanical damage (engine, gearbox, suspension) | T2 | Wear from abuse → performance loss. |
| Visual damage (deformation, parts detachment) | T3 | Mesh deformation, LOD-aware. |
| CarSpec Resource | T1 | All static vehicle properties as exportable data. |

**Challenges:**
- Pacejka coefficients must be tunable per car class while remaining physically plausible.
- Hot path (tire force × 4 wheels × 60 Hz) must stay under ~0.5 ms. C++ migration likely.
- Weight transfer needs stable integration — Euler vs. semi-implicit vs. RK4 tradeoff.

**References:**
- Pacejka, H.B. "Tire and Vehicle Dynamics" (3rd edition).
- Marco Monster, "Car Physics for Games" (classic reference).
- Godot `PhysicsServer3D` API for Jolt integration.

---

### 2. Raytracing (Audio + AI)

**Tier:** 1 (MVP) | **Language:** C++ GDExtension | **Owner:** `cpp-specialist`

**Description:** Custom C++ BVH (Bounding Volume Hierarchy) raytracing system used exclusively for **audio** and **AI** — NOT for graphics rendering. Audio rays compute sound reflections, occlusion, and material absorption. AI rays provide the driving agent with environmental sensing (track edges, obstacles, surface type).

> **Graphics RT decision:** Synadrive rides Godot's upstream Vulkan RT integration (see "Vulkanised 2026: Integrating Vulkan Ray Tracing into the Godot Engine" by Khronos). No custom graphics RT pipeline. Forward Plus is the baseline renderer. Tracked as an open research item.

**Architecture:**

```
RTCore (C++ GDExtension)
├── BVHBuilder          — Constructs acceleration structure from scene geometry
├── RayBatcher          — Batches and dispatches rays efficiently
├── AudioRTModule       — Sound propagation, reflection, absorption
│   ├── MaterialDB      — Per-surface absorption/reflection coefficients
│   └── ListenerModel   — Binaural / HRTF integration
└── AIRTModule          — Environment sensing for AI agents
    ├── TrackEdgeProbe   — Distance to track boundaries
    ├── SurfaceProbe     — Current surface material under each wheel
    └── ObstacleProbe    — Nearest obstacles ahead
```

**Sub-features:**

| Sub-feature | Tier | Notes |
|---|---|---|
| BVH construction from scene meshes | T1 | Rebuild on track load, incremental for dynamic objects. |
| Audio ray casting (reflection paths) | T1 | N rays per frame from engine/tire sources. |
| Material absorption coefficients | T1 | Asphalt, gravel, grass, concrete, metal barriers. |
| AI track edge probing | T1 | Fan of rays ahead of vehicle → distance to edges. |
| AI surface type detection | T1 | Ray down to detect surface material for grip changes. |
| Binaural / HRTF integration | T2 | Spatial audio with head-related transfer function. |
| Dynamic object RT (other cars) | T2 | Moving obstacles in BVH. |
| Reverb zone estimation | T3 | Estimate enclosed vs. open space for reverb tuning. |

**Challenges:**
- BVH must be fast enough to run at physics tick rate (60 Hz) with ~100-500 rays.
- Audio RT can afford lower fidelity (fewer bounces) than visual RT.
- Must not interfere with the main render thread — run on a separate thread or in `_physics_process`.

**References:**
- "Real-Time Collision Detection" by Christer Ericson (BVH algorithms).
- Vulkanised 2026 talk (Khronos, Feb 9-11 2026) — upstream RT tracking reference.

---

### 3. Graphics & Rendering

**Tier:** Research | **Language:** N/A (upstream) | **Owner:** `game-architect`

**Description:** Synadrive uses Godot's **Forward Plus** renderer (D3D12 or Vulkan) as the baseline. Graphics-level ray tracing is **not** custom-built — instead, we track Godot's native Vulkan RT integration (`VK_KHR_ray_tracing_pipeline`) as a research item.

**Current approach:** Forward Plus with traditional rasterization, shadow maps, SSAO, SSR, and post-processing. This is production-quality for the foreseeable future.

**When upstream RT lands in Godot:**
- Evaluate for reflections, global illumination, and ambient occlusion.
- Car paint materials and wet track surfaces would benefit most.
- Hybrid approach: rasterize primary visibility, ray trace secondary effects.

> **This is a tracking/research section only.** No implementation work until Godot ships native RT support.

---

### 4. Audio System

**Tier:** 1-3 | **Language:** GDScript + C++ GDExtension | **Owner:** `audio-engineer` (primary), `cpp-specialist` (synthesis)

**Description:** Multi-layered audio system: engine sound synthesis (combustion simulation), tire/surface audio, environment audio, spatial mixing, and audio raytracing integration. Engine sound uses an **AngeTheGreat-style combustion cycle simulation** — per-cylinder synthesis driven by engine RPM, load, and throttle position.

**Architecture:**

```
AudioBus (autoload singleton)
├── EngineAudioSynth (C++)    — Per-cylinder combustion synthesis
│   ├── CylinderModel[]       — Intake, compression, combustion, exhaust per cylinder
│   ├── ExhaustModel           — Resonance, backpressure simulation
│   └── IntakeModel            — Air filter, turbo/supercharger whine
├── TireAudioModule            — Slip-based tire squeal, rumble strips, surface
├── EnvironmentAudio           — Wind, crowd, ambient (distance-based)
├── CollisionAudio             — Impact sounds with velocity-based intensity
├── MixingBus                  — Dynamic mixing, ducking, priority system
└── AudioRTBridge              — Applies RT-computed reverb/occlusion/absorption
```

**Sub-features:**

| Sub-feature | Tier | Notes |
|---|---|---|
| Basic audio bus routing | T1 | Engine, tires, environment, UI, music buses. |
| Placeholder engine audio (samples) | T1 | Looped samples pitch-shifted by RPM. Replaced in T2. |
| Tire audio (slip → squeal intensity) | T1 | Driven by tire model slip ratio/angle. |
| Environment ambience | T1 | Distance-based crowd, wind. |
| Combustion cycle synthesis (C++) | T2 | Per-cylinder, throttle-responsive, exhaust resonance. |
| Intake/turbo audio model | T2 | Air rush, compressor whine. |
| Surface-dependent tire sounds | T2 | Gravel, grass, curbs, rumble strips. |
| Spatial audio (3D positioning) | T2 | Audio RT-driven reflections and occlusion. |
| Spotter / race engineer voice | T3 | Pre-recorded or TTS-driven contextual callouts. |
| Dynamic music system | T3 | Intensity-driven music that responds to race state. |

**Challenges:**
- Combustion synthesis is CPU-intensive — must run in C++ with real-time audio thread priority.
- Audio RT integration requires careful latching (compute reflections at physics rate, apply at audio rate).
- Engine sound must feel responsive to throttle changes with <50ms perceived latency.

**References:**
- AngeTheGreat, "Engine Simulator" (open source combustion synthesis reference).
- Godot `AudioServer`, `AudioStreamGenerator`, `AudioEffectReverb`.

---

### 5. AI Agent System

**Tier:** 1-3 | **Language:** GDScript + C++ GDExtension | **Owner:** `game-architect` (agent), `game-designer` (training)

**Description:** Hybrid AI combining neural networks (ONNX inference) with traditional game AI (behavior trees, state machines). The system has two layers: a **per-agent tree** (inside the vehicle scene) and a **training pipeline** (an orchestrator scene). ONNX inference is shared infrastructure used by both driving AI and dialogue AI.

**Per-Agent Architecture (inside vehicle):**

```
AIAgentRoot
├── ObservationBuilder       — Vehicle telemetry + track data → observation vector
├── AgentController          — Selects action via NN or behavior tree fallback
│   ├── NeuralPolicy         — ONNX model inference (C++)
│   └── BehaviorTreeFallback — Traditional AI when NN is uncertain
├── RewardFunction           — Computes reward signal for training
└── ActionApplier            — Agent outputs → vehicle inputs
```

**Training Pipeline Architecture:**

```
AITrainer (Node)
├── Environment (Node3D) → Track + Vehicle (with AIAgentRoot)
├── TrainingLoop             — Episode orchestration, transition collection
├── TrainingLogger           — Training metrics (separate from TelemetryRecorder)
└── TrainingConfig (Resource) — Hyperparameters, reward weights
```

**Sub-features:**

| Sub-feature | Tier | Notes |
|---|---|---|
| Observation builder (speed, slip, track pos, curvature) | T1 | Normalized vector for NN input. |
| Action space (throttle, brake, steer, gear) | T1 | Continuous + discrete hybrid. |
| ONNX inference via GDExtension | T1 | Shared C++ runtime for all ONNX models. |
| Behavior tree fallback | T1 | Rule-based AI for when NN is loading or uncertain. |
| Reward function (lap time, off-track, smoothness) | T1 | Composable, weight-adjustable reward terms. |
| Headless training (`godot --headless`) | T1 | Accelerated physics stepping. |
| AI personalities (aggressive, conservative, etc.) | T2 | Different reward weight presets + behavior modifiers. |
| Training visualization (live metrics overlay) | T2 | Reward curves, action distributions, episode stats. |
| Curriculum learning (simple → complex tracks) | T2 | Progressive difficulty during training. |
| Dialogue AI (ONNX fine-tuned model) | T3 | Racing-context NPC dialogue. Shares ONNX infra. |
| TTS integration (ONNX TTS model) | T3 | Text-to-speech for spotter/engineer. |

**Challenges:**
- Observation normalization is critical — inconsistent ranges break NN training.
- Reward function design is the hardest part — bad rewards → bad driving behavior.
- ONNX inference must be fast enough for real-time (<2ms per agent per frame).
- Dialogue AI needs racing-specific fine-tuning data (driver radio transcripts, race commentary).

---

### 6. Weather & Track Conditions

**Tier:** 1-2 | **Language:** GDScript | **Owner:** `game-architect`

**Description:** Weather and track conditions are **coupled systems** — weather drives track state, track state drives grip. Separating them into different tiers would create a cosmetic-only weather system, so both are Tier 1 at a basic level.

**Architecture:**

```
WeatherManager
├── PrecipitationModel    — Rain intensity, type (drizzle, heavy, dry)
├── TemperatureModel      — Ambient + track surface temperature
├── WindModel             — Speed + direction (affects aero)
└── VisualEffects         — Particles, skybox, lighting adjustments

TrackConditionManager
├── SurfaceGripMap        — Per-sector grip multiplier
├── RubberLineModel       — Racing line builds grip over session
├── WaterAccumulation     — Puddles, standing water, drying
└── MarbleAccumulation    — Off-line tire debris reduces grip
```

**Sub-features:**

| Sub-feature | Tier | Notes |
|---|---|---|
| Weather state machine (dry, damp, wet, heavy rain) | T1 | Discrete states with transition probabilities. |
| Track surface temperature | T1 | Affects base grip level. |
| Grip multiplier per surface state | T1 | Wet = 0.7×, damp = 0.85×, etc. |
| Visual rain particles | T1 | Basic rain effect on camera and environment. |
| Rubber line buildup over session | T2 | Racing line gets grippier with laps. |
| Water accumulation and drying | T2 | Standing water in low points, progressive drying. |
| Wind affecting aerodynamics | T2 | Headwind/tailwind → drag/speed changes. |
| Dynamic weather transitions mid-session | T2 | Rain starts, stops, intensity changes. |
| Marble/debris off-line | T2 | Off-racing-line grip penalty. |
| Day/night cycle | T5 | Lighting, temperature, and visibility changes. |

**Challenges:**
- Grip map must be efficient — sampled per-wheel per-frame.
- Weather transitions must feel gradual, not sudden state jumps.
- Water accumulation needs track topology data (elevation, camber).

---

### 7. Camera System

**Tier:** 1-3 | **Language:** GDScript | **Owner:** `game-architect`

**Description:** Multi-view camera system supporting cockpit, chase, hood, bumper, and free cam modes. Speed-sensitive FOV, camera shake from suspension/impacts, and smooth transitions between views.

**Sub-features:**

| Sub-feature | Tier | Notes |
|---|---|---|
| Chase camera (configurable distance, height, lag) | T1 | Default game camera. |
| Cockpit/hood/bumper cameras | T1 | Fixed relative to vehicle body. |
| Speed-sensitive FOV | T1 | Wider FOV at higher speed for sense of speed. |
| Camera shake (suspension, impacts) | T1 | Driven by suspension travel and collision events. |
| Free camera (developer/spectator) | T1 | WASD + mouse for debug. |
| Smooth transition between camera modes | T2 | Interpolated transitions. |
| TV-style replay cameras | T3 | Track-mounted cameras with smooth cuts and tracking. |
| Photo mode camera (free positioning, DOF, filters) | T4 | Post-processing controls for screenshots. |

---

### 8. Telemetry, Replay & Ghost Racing

**Tier:** 1-3 | **Language:** GDScript | **Owner:** `game-architect`

**Description:** Telemetry recording is the foundation for ghost racing and replays. All vehicle state is recorded at physics tick rate and can be played back as a ghost car or full replay.

**Architecture:**

```
TelemetryRecorder (per vehicle)
├── FrameBuffer[]    — Ring buffer of vehicle states
├── LapSnapshots[]   — Completed lap telemetry
└── ExportFormat     — Binary format for disk persistence

GhostPlayback
├── GhostVehicle     — Visual-only vehicle driven by recorded data
└── DeltaDisplay     — Real-time time delta to ghost

ReplaySystem
├── ReplayTimeline   — Scrubbing, speed control, pause
├── CameraDirector   — Automated camera cuts from TV cameras
└── ReplayExporter   — Video capture or data export
```

**Sub-features:**

| Sub-feature | Tier | Notes |
|---|---|---|
| Per-frame telemetry recording (position, inputs, forces) | T1 | Ring buffer, binary format. |
| Telemetry display overlay (speed, G-force, tire temps) | T1 | HUD layer with real-time data. |
| Lap telemetry persistence (save to disk) | T1 | Best lap, comparison data. |
| Ghost car playback | T2 | Semi-transparent ghost driven by recorded data. |
| Time delta display (vs. ghost / vs. best lap) | T2 | Real-time split comparison. |
| Full session replay | T3 | All vehicles, full camera control. |
| Replay timeline (scrub, speed, pause, rewind) | T3 | VCR-style controls. |
| TV-style camera director (automated cuts) | T3 | Replay cameras with intelligent switching. |
| Replay export (video or data) | T3 | Capture to file. |

---

### 9. Character Builder & NPC System

**Tier:** 2-4 | **Language:** GDScript | **Owner:** `game-designer`

**Description:** Players create driver characters with appearance and personality. NPCs are AI-driven characters with distinct identities that persist across a career. Character builder and NPC systems are in the same tier because NPCs need the builder infrastructure.

**Sub-features:**

| Sub-feature | Tier | Notes |
|---|---|---|
| Character appearance editor (face, suit, helmet) | T2 | Modular mesh + material system. |
| Driver stats / attributes | T2 | Aggression, tire care, wet skill, consistency. |
| NPC identity persistence | T2 | Name, team, stats, rivalry tracking. |
| NPC rivalry / relationship system | T3 | Relationships change based on race incidents. |
| Full NPC roster with backstories | T4 | Hand-crafted + procedural personalities. |

---

### 10. Dialogue System (ONNX)

**Tier:** 3 | **Language:** GDScript + C++ GDExtension | **Owner:** `cpp-specialist` (primary), `game-designer` (design)

**Description:** NPC dialogue powered by a **fine-tuned small ONNX language model** running locally. Shares the ONNX inference GDExtension with the driving AI. No cloud dependency. Racing-specific training data (driver radio transcripts, press conferences, team radio).

The dialogue system handles conversation flow, personality influence on responses, and context awareness (race state, standings, incident history). UI layer could optionally use Dialogic for presentation, but the generation is ONNX-native.

**Architecture:**

```
DialogueManager
├── ConversationContext   — Current race state, relationship, history
├── PersonalityProfile   — Per-NPC response style + vocabulary
├── ONNXDialogueModel    — Fine-tuned language model (shared infra)
├── ResponseFilter       — Safety, coherence, and relevance filtering
└── DialogueUI           — Conversation presentation (radio-style)
```

**Sub-features:**

| Sub-feature | Tier | Notes |
|---|---|---|
| ONNX dialogue model integration | T3 | Reuses AI driving ONNX GDExtension. |
| Conversation context injection | T3 | Race state, standings, incidents → prompt. |
| Personality-influenced responses | T3 | Different NPCs speak differently. |
| TTS voice synthesis | T3 | ONNX TTS model for spoken dialogue. |
| Spotter / race engineer callouts | T3 | Contextual: "Car left!", "Box this lap", "P3". |
| Radio-style dialogue UI | T3 | Audio + text overlay. |
| Polished NPC dialogue variety | T4 | Expanded vocab, more situations, emotional range. |

**Challenges:**
- Model size must be small enough for real-time inference (<100MB, <50ms response).
- Training data for racing context is limited — may need synthetic data generation.
- TTS quality at small model sizes is a research question.
- Response filtering must prevent nonsensical or OOC outputs.

---

### 11. Career & Championship Mode

**Tier:** 3 | **Language:** GDScript | **Owner:** `game-designer`

**Description:** Structured progression through race weekends, championships, and seasons. The career is the long-term engagement loop that ties together all systems — AI training, vehicle upgrades, driver development, and rivalry narratives.

**Sub-features:**

| Sub-feature | Tier | Notes |
|---|---|---|
| Race weekend structure (practice → quali → race) | T3 | Session types with rules. |
| Championship calendar (track sequence, points system) | T3 | Configurable via Championship Resource. |
| Points system (configurable scoring tables) | T3 | F1-style, endurance-style, custom. |
| Driver standings & statistics | T3 | Persistent across sessions. |
| Team/constructor standings | T3 | Multi-driver teams. |
| Championship rules editor | T3 | UI for creating custom scoring/rules. |
| Season progression | T3 | Unlock tracks, car classes, features. |

---

### 12. Race Management

**Tier:** 2-3 | **Language:** GDScript | **Owner:** `game-architect`

**Description:** Everything that manages a race session: session types, starting procedures, flags, penalties, position tracking, and pit stop logic.

**Sub-features:**

| Sub-feature | Tier | Notes |
|---|---|---|
| Session types (practice, qualifying, race, time trial) | T2 | Different rules and objectives per type. |
| Starting procedure (formation lap, lights, standing/rolling start) | T2 | Configurable per championship. |
| Position tracking (on-track, overall) | T2 | Real-time P1-PN with gap calculation. |
| Flag system (yellow, blue, black, checkered) | T3 | AI respects flags. Visual + audio alert. |
| Penalty system (time, drive-through, disqualification) | T3 | Triggered by incidents, track limits. |
| Race director AI (automated flag decisions) | T3 | Virtual safety car, red flag. |
| Pit stop system (tire change, fuel, repairs) | T3 | Time-based pit stop with animated sequence. |
| Pit strategy (undercut/overcut, tire compound choice) | T3 | AI and player strategic decisions. |

---

### 13. World Editor & Node Editors

**Tier:** 3 | **Language:** GDScript | **Owner:** `game-architect`

**Description:** Two distinct editor subsystems:
1. **World Editor** — Visual tool for placing and configuring track elements, scenery, and environment objects.
2. **Node Editors** — Graph-based editors for two separate concerns:
   - **AI Behavior Editor** — Wire together observation → decision → action logic for custom AI agents.
   - **Championship Rules Editor** — Configure scoring, penalty rules, session formats visually.

**Sub-features:**

| Sub-feature | Tier | Notes |
|---|---|---|
| World editor (place track segments, scenery) | T3 | Drag-and-drop scene editing. |
| Track validation (connectivity, sector markers) | T3 | Ensure track is driveable. |
| AI behavior node editor | T3 | Visual graph for custom AI logic. |
| Championship rules editor | T3 | Visual config for scoring/penalties. |
| User content export/import | T4 | Integration with mod support. |

---

### 14. Damage Model

**Tier:** 2-3 | **Language:** GDScript + C++ | **Owner:** `game-architect`

**Description:** Two-phase damage system. Tier 2 introduces **mechanical wear** (engine strain, gearbox wear, suspension fatigue from impacts). Tier 3 adds **visual damage** (mesh deformation, parts detachment, cosmetic damage). Damage feeds back into physics — a damaged suspension changes handling.

**Sub-features:**

| Sub-feature | Tier | Notes |
|---|---|---|
| Engine wear from over-revving | T2 | Performance degradation over time. |
| Gearbox wear from missed shifts | T2 | Increased shift times, risk of failure. |
| Suspension damage from impacts | T2 | Alignment changes, reduced travel. |
| Tire puncture / blowout | T2 | Sudden grip loss, mandatory pit stop. |
| Visual mesh deformation | T3 | Vertex displacement from impact vectors. |
| Parts detachment (bumper, wing, mirror) | T3 | Physics-driven debris. |
| Damage repair in pit stops | T3 | Time cost for repairs. |

---

### 15. Force Feedback & Haptics

**Tier:** 2 | **Language:** C++ GDExtension | **Owner:** `cpp-specialist`

**Description:** Direct-to-device force feedback for steering wheels. Communicates tire forces, road surface texture, impacts, and understeer/oversteer through the wheel motor. Must bypass Godot's input layer and talk directly to the device API (DirectInput on Windows, evdev on Linux).

**Sub-features:**

| Sub-feature | Tier | Notes |
|---|---|---|
| Tire self-aligning torque → wheel force | T2 | Primary FFB signal from Pacejka. |
| Road surface texture vibration | T2 | Curbs, rumble strips, surface changes. |
| Impact/collision forces | T2 | Sudden jolt on contact. |
| Understeer / oversteer signal | T2 | Lightening or heavying of wheel feel. |
| Damper effect (artificial resistance) | T2 | Configurable FFB feel profiles. |
| Per-device calibration / profiles | T2 | Support multiple wheel brands. |

---

### 16. Multiplayer

**Tier:** 4 | **Language:** GDScript + C++ | **Owner:** `game-architect`

**Description:** Online multiplayer racing. Architecture TBD — needs research into client-server vs. P2P, and Godot's `MultiplayerAPI`. Key challenges: physics determinism, latency compensation for racing (even small desync = unfair), and anti-cheat.

**Sub-features:**

| Sub-feature | Tier | Notes |
|---|---|---|
| Network architecture (client-server vs. P2P) | T4 | Research needed. |
| Lobby system | T4 | Host, join, settings, ready check. |
| State synchronization | T4 | Vehicle positions, inputs, race state. |
| Latency compensation | T4 | Interpolation, prediction, rollback. |
| Voice chat | T4 | Push-to-talk, spatial optional. |
| Anti-cheat (basic) | T4 | Server authority, input validation. |
| Full anti-cheat | T5 | Client-side integrity, replay verification. |

---

### 17. Mod Support

**Tier:** 4 | **Language:** GDScript | **Owner:** `game-architect`

**Description:** Resource pack system allowing community-created content: cars, tracks, AI models, skins, and configurations. Mods are self-contained directories with a manifest file, loaded at runtime.

**Sub-features:**

| Sub-feature | Tier | Notes |
|---|---|---|
| Mod manifest format (metadata, dependencies) | T4 | JSON or Resource-based. |
| Runtime resource pack loading | T4 | Load scenes, scripts, resources from user dirs. |
| Mod validation & sandboxing | T4 | Prevent malicious mods from native access. |
| Workshop / marketplace integration | T5 | Steam Workshop or custom. |
| Model marketplace (share AI agents) | T5 | Community-trained ONNX models. |

---

### 18. Photo Mode

**Tier:** 4 | **Language:** GDScript | **Owner:** `game-architect` (primary), `game-designer` (secondary)

**Description:** Pause the game and position a free camera with post-processing controls for screenshots. Adjustable DOF, exposure, color grading, vignette, and time-of-day.

**Sub-features:**

| Sub-feature | Tier | Notes |
|---|---|---|
| Free camera with 6DOF movement | T4 | Detached from vehicle. |
| Depth of field control | T4 | Aperture, focal distance. |
| Exposure & color grading | T4 | Brightness, contrast, saturation, LUTs. |
| Vignette, film grain, chromatic aberration | T4 | Optional artistic effects. |
| Screenshot capture (high-res) | T4 | Super-resolution capture option. |

---

### 19. Leaderboards & Statistics

**Tier:** 2-4 | **Language:** GDScript | **Owner:** `game-designer` (primary), `devops-engineer` (online infra)

**Description:** Online and local leaderboards for time trials and race results. Statistics tracking for personal bests, AI performance history, and skill progression.

**Sub-features:**

| Sub-feature | Tier | Notes |
|---|---|---|
| Local lap time leaderboards | T2 | Per-track, per-car-class. |
| Online leaderboards | T4 | Steam integration or custom backend. |
| Personal statistics dashboard | T3 | Total laps, best times, win rate, AI stats. |
| Replay validation for leaderboard entries | T4 | Prevent cheating via replay verification. |

---

### 20. Debug Tools

**Tier:** 1 | **Language:** GDScript | **Owner:** `game-architect`

**Description:** Developer tooling for debugging physics, AI, performance, and game state. Essential from Day 1.

**Sub-features:**

| Sub-feature | Tier | Notes |
|---|---|---|
| Debug draw overlay (tire forces, suspension, aero) | T1 | Visual vectors and values in 3D. |
| Performance overlay (FPS, physics time, memory) | T1 | On-screen stats. |
| Developer console (command input) | T1 | Cheat commands, state inspection. |
| AI decision visualization | T2 | Show observation vector, chosen action, reward. |
| Telemetry graph overlay | T2 | Real-time scrolling graphs. |
| Physics state inspector | T2 | Drill into per-wheel data. |

---

### 21. UI/UX Infrastructure

**Tier:** 1-2 | **Language:** GDScript | **Owner:** `game-architect`

**Description:** HUD, menus, overlays, and the GUIDE input integration layer. All UI uses Godot's Control node system with GUIDE for input mapping.

**Sub-features:**

| Sub-feature | Tier | Notes |
|---|---|---|
| In-race HUD (speed, gear, RPM, position, lap) | T1 | Minimal, configurable layout. |
| Main menu | T1 | Play, settings, quit. |
| Settings menu (graphics, audio, controls) | T1 | Reads/writes SettingsManager. |
| Pause menu | T1 | Resume, restart, settings, quit. |
| GUIDE input context switching | T1 | Menu vs. driving vs. replay vs. editor contexts. |
| Garage / car selection UI | T2 | Browse, compare, select vehicles. |
| Track selection UI | T2 | Preview, weather, best times. |
| Race results screen | T2 | Standings, lap times, analysis. |

---

### 22. Save/Load & Persistence

**Tier:** 2 | **Language:** GDScript | **Owner:** `game-architect`

**Description:** Persistence layer for user data: car setups, AI models, career progress, settings, keybinds, and telemetry data. Local file system first; cloud saves in Tier 4.

**Sub-features:**

| Sub-feature | Tier | Notes |
|---|---|---|
| Settings persistence (audio, graphics, controls) | T1 | Via SettingsManager autoload. |
| Car setup save/load | T2 | Suspension, aero, gearing presets. |
| AI model export/import (ONNX files) | T2 | Save trained models, share with others. |
| Career progress persistence | T3 | Championships, standings, unlocks. |
| Cloud saves (Steam Cloud) | T4 | Sync across machines. |

---

### 23. Settings & Accessibility

**Tier:** 1-5 | **Language:** GDScript | **Owner:** `game-architect` (settings), `game-designer` (accessibility)

**Sub-features:**

| Sub-feature | Tier | Notes |
|---|---|---|
| Graphics settings (resolution, quality presets) | T1 | Low/Medium/High/Ultra + custom. |
| Audio settings (volume per bus) | T1 | Master, engine, environment, UI, music. |
| Control remapping | T1 | Via GUIDE remapping system. |
| Driving assists (ABS, TCS, stability, auto-gear) | T1 | Configurable per-vehicle. |
| Colorblind modes | T3 | Protanopia, deuteranopia, tritanopia filters. |
| Screen reader support | T3 | Menu narration. |
| Subtitle / caption system | T3 | For dialogue and spotter calls. |
| Input sensitivity profiles | T2 | Per-device curves. |
| Full WCAG 2.1 AA compliance | T5 | Comprehensive accessibility. |

---

### 24. Localization

**Tier:** 2-5 | **Language:** GDScript | **Owner:** `docs-writer`

**Description:** String externalization from Tier 2 to avoid costly retrofit. Uses Godot's built-in `TranslationServer` with CSV or PO files.

**Sub-features:**

| Sub-feature | Tier | Notes |
|---|---|---|
| String externalization (all UI text) | T2 | `tr()` calls everywhere. |
| English base translation file | T2 | Canonical reference. |
| Translation file format (CSV or PO) | T2 | Contributor-friendly format. |
| Additional languages (PT-BR, ES, DE, FR, JA) | T4 | Community contributions welcome. |
| Full localization (all content, images, audio) | T5 | Includes localized VO if applicable. |

---

### 25. Build & Deployment

**Tier:** 1 | **Language:** CI/SCons | **Owner:** `devops-engineer`

**Sub-features:**

| Sub-feature | Tier | Notes |
|---|---|---|
| GitHub Actions CI (lint + test) | T1 | On every PR to develop/main. |
| GDExtension cross-compilation (Win + Linux) | T1 | SCons matrix build. |
| Godot export templates | T2 | Automated build artifacts. |
| Astro docs deployment | T2 | Auto-deploy on merge to docs branch. |
| Steam SDK integration | T4 | Achievements, overlay, cloud saves. |
| Release pipeline (versioned builds) | T4 | Tag → build → deploy → release notes. |

---

## Track & Car Roster

### Tracks

> All tracks are **fictional** but inspired by real-world circuit characteristics. Licensing research is an open task — real-world track licensing (FIA, circuit owners) is tracked separately.

| Track Name | Inspired By | Configuration | Tier | Notes |
|---|---|---|---|---|
| Pinheiro Circuit | Interlagos (counter-clockwise, elevation) | 4.3 km, 15 turns | T1 | MVP track. Mixed slow/fast. |
| Silverdale | Silverstone (fast, flowing) | 5.8 km, 18 turns | T2 | High-speed aero track. |
| Monte Sereno | Monaco (street, tight) | 3.3 km, 19 turns | T2 | Low-speed, precision. |
| Kaskade Ring | Nürburgring Nordschleife (long, elevation) | 8.5 km, 33 turns | T3 | Challenge track. |
| Red Sands Speedway | Bahrain (night, technical) | 5.4 km, 15 turns | T3 | Desert environment. |
| Additional tracks | Various | Various | T4-T5 | Community + dev created. |

### Car Classes

| Class | Examples Inspired By | Tier | Characteristics |
|---|---|---|---|
| GT | Porsche 911 GT3, BMW M4 GT3 | T1 | Balanced, accessible. |
| Touring | BTCC-style tin-tops | T1 | Close racing, less aero. |
| Open Wheeler | Formula car (generic) | T1 | High downforce, fragile aero. |
| Prototype | LMP2-style | T2 | Maximum performance. |
| Rally | Group B / WRC inspired | T2 | Gravel/tarmac multi-surface. |
| Vintage | Classic 60s-70s racers | T3 | No assists, mechanical feel. |
| Hypercar | LMH/LMDh-style | T4 | Hybrid powertrain. |

### Licensing Research (Open Task)

- **Track licensing:** Research FIA licensing requirements for real-world track reproductions. Current approach is "inspired by" fictional tracks to avoid legal issues.
- **Car licensing:** Research manufacturer licensing. Current approach is generic car classes without specific brand names.
- **Community modding:** If mod support allows user-created content, licensing responsibility shifts to mod creators — document this clearly.

---

## Open Research Items

These are tracked decisions or investigations that don't have a final answer yet:

| Item | Status | Context |
|---|---|---|
| **Track Godot upstream Vulkan RT** | 🔍 Active | Khronos Vulkanised 2026 talk confirmed active development. Monitor Godot PRs and release notes. When it ships, evaluate for reflections, GI, and wet surfaces. |
| **TTS model selection** | 🔍 Active | Evaluate small ONNX TTS models (Piper, VITS, Coqui). Must run real-time (<200ms per utterance). |
| **Multiplayer architecture** | 🔍 Not started | Client-server vs. P2P. Godot `MultiplayerAPI` capabilities. Latency compensation for sim racing. |
| **Engine sound synthesis depth** | 🔍 Active | AngeTheGreat's approach is the reference. How many cylinders to simulate in real-time? 4/6/8? benchmark needed. |
| **Dialogic as UI layer** | 🔍 Not started | Could Dialogic addon serve as the UI/UX layer for dialogue while ONNX generates the text? Or is a custom UI simpler? |
| **AI training data pipeline** | 🔍 Not started | How to collect racing-context training data for the dialogue model? Synthetic generation? Real radio transcripts? |

---

## Dataview Queries

> [!info] Obsidian-Only Section<br>
> The Dataview queries below are **Obsidian-only** — they require the [Dataview plugin](https://github.com/blacksmithgu/obsidian-dataview) and will render as raw code blocks in any other Markdown viewer (including the Astro docs site). This is expected and harmless.

> These queries work with the frontmatter of this page. As the project grows and features get their own sub-pages, these queries will automatically aggregate data.

### Features by Tier (this page)

```dataview
TABLE WITHOUT ID
  file.name AS "Document",
  type AS "Type",
  status AS "Status",
  version AS "Version"
WHERE contains(tags, "Synadrive") AND type = "vision"
```

### All Synadrive Documents

```dataview
TABLE WITHOUT ID
  file.link AS "Document",
  file.mtime AS "Last Modified"
FROM "Gamedev/Synadrive"
SORT file.mtime DESC
```

> **Future:** When features get individual pages (e.g., `Feature - Pacejka Tire Model.md`) with `tier`, `status`, and `category` frontmatter, add:
> ```dataview
> TABLE tier, status, category
> FROM "Gamedev/Synadrive/Features"
> SORT tier ASC, category ASC
> ```

---

## Revision History

| Date | Version | Changes |
|---|---|---|
| 2026-02-25 | 0.1.0 | Initial vision document. All features at 🔴 status. |
| 2026-02-25 | 0.2.0 | Bulk consistency fixes from first cross-document audit. |

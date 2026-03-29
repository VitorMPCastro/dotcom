---
title: ONNX Infrastructure — Synadrive
aliases: [ONNX Infrastructure — Synadrive]
linter-yaml-title-alias: ONNX Infrastructure — Synadrive
tags:
  - Synadrive
  - ai
  - onnx
  - architecture
  - gdextension
type: architecture-decision
created: 2026-03-11
updated: 2026-03-11
---

# ONNX Infrastructure — Synadrive

**Decision record** for how ML inference is used in Synadrive and how the shared C++ runtime is structured.

---

## Overview

Three systems in Synadrive require ML inference. Rather than shipping three separate runtimes, all three share one C++ GDExtension that wraps the ONNX Runtime. This note records what each workload needs, why the shared architecture makes sense, and the hardware budget for each.

---

## The Three Workloads

### 1 — Driving Policy (Tier 1)

| Property | Value |
|---|---|
| Model size | ~100–500 KB |
| Inference cost | ~0.2–0.5 ms / agent / frame |
| Fire rate | Every physics tick (60 Hz) |
| Input | Observation vector: speed, RPM, slip angles, track position, upcoming curvature |
| Output | Action vector: throttle [0,1], brake [0,1], steer [−1,1], gear shift |

This is the smallest and cheapest of the three workloads. A well-designed observation space fits in 30–60 floats. The policy network is intentionally tiny — 2–4 hidden layers, 64–256 nodes — because inference latency matters and the task is well-bounded. A vanilla MLP is sufficient; no recurrence needed if track curvature lookahead is in the observation.

**Hardware concern: none.** Even a mid-range CPU handles 4–8 agents at 60 Hz with margin to spare.

---

### 2 — Dialogue / Personality Model (Tier 3)

| Property | Value |
|---|---|
| Model size | 600 MB (standard) → ~2 GB (high quality) |
| Inference cost | ~50–150 ms / response |
| Fire rate | On demand (player interaction or race event triggers) |
| Input | Compressed race context + recent history + NPC personality profile |
| Output | Next-token sequence (text) |

This is the heavy workload. It fires rarely but takes real time. Key architectural choices:

**Async background thread** — inference never blocks the game thread. The dialogue system queues a request and gets a callback when the response is ready. The NPC plays a thinking animation / radio crackle in the meantime.

**Quality tiers** — exposed as a SettingsManager option:
- *Off* → Fully scripted behaviour tree responses, no model loaded.
- *Standard* → Small fine-tuned model (600 MB, quantized to int8). Runs fast on CPU.
- *High* → Full precision model (~2 GB). Requires a GPU with enough VRAM.

**Fine-tuning beats model size.** A 600 MB model fine-tuned on racing-context data (driver radio transcripts, press conferences, race commentary, incident debriefs) will produce more believable, contextually correct responses than a 7B general-purpose model. This is the implementation strategy: take a small open-weights base (e.g. Phi-3 Mini, Gemma 2B) and fine-tune it on a curated racing corpus.

---

### 3 — TTS / Speech Synthesis (Tier 3)

| Property | Value |
|---|---|
| Model size | ~40–100 MB (Piper / VITS-class) |
| Inference cost | ~150–250 ms / utterance |
| Fire rate | On demand (after each dialogue response) |
| Input | Text string + speaker ID |
| Output | Raw audio samples (16 kHz mono) |

TTS fires after the dialogue model completes — the pipeline is serial: event → dialogue model → TTS → playback. Total latency is ~300–400 ms, which is imperceptible in a racing context where the gap between voice lines is measured in seconds.

VITS / Piper-class models are small enough that they load once at session start and stay resident. Per-NPC voices are achieved via speaker embeddings, not separate model files.

---

## Shared Runtime Architecture

```
              GDScript game layer
                    │
        ┌───────────┼───────────┐
        │           │           │
  AIAgent.gd   Dialogue.gd   TTS.gd
        │           │           │
        └───────────┴───────────┘
                    │
           OnnxRuntime (C++ GDExtension)
                    │
            ONNX Runtime C++ API
                    │
         ┌──────────┼──────────┐
         │          │          │
  policy.onnx  dialogue.onnx  tts.onnx
```

The GDExtension exposes:
- `OnnxModel.load(path: String) -> OnnxModel`
- `OnnxModel.run(inputs: Dictionary) -> Dictionary`
- `OnnxModel.run_async(inputs: Dictionary, callback: Callable) -> void`

Sessions are managed internally. Each model gets one session created at load time and reused across calls. Batch inference is supported for the driving AI (multiple agents in one forward pass).

---

## Personality Architecture — Why GDScript, Not the Model

A common mistake is to expect the model to "be" the personality. The model generates plausible racing-context text — it does not simulate emotional state or remember race history on its own.

**Personality lives in a GDScript state machine.** The model is the voice; the state machine is the character.

The state machine tracks:
- `aggression: float` — scales with race position, being lapped, car damage
- `rivalry: Dictionary[driver_id, float]` — built up from incident history
- `emotional_tone: Enum { Neutral, Frustrated, Elated, Tense, Resigned }`
- `incident_memory: Array[IncidentRecord]` — last N incidents, decays over time

Each turn, the state machine assembles a context string injected into the model prompt:

```
[Driver: Kai "The Brick" Santos]
[Current state: Frustrated, rivalry with player HIGH]
[Race status: P3, 5 laps remaining, player behind by 1.2s]
[Last incident: contact at Turn 7 two laps ago, caused aero damage]

Player just overtook on the straight. Respond in character (2 sentences max):
```

The model fills in the rest. GDScript controls the *what*; the model controls the *how it sounds*.

---

## Scripted Fallback

On hardware that cannot run even the quantized model, all NPC dialogue falls back to a curated hand-written response tree (behaviour tree + selection weights). This fallback is also the authoring reference — every scripted line represents an intended response that the fine-tuned model should reproduce naturally.

---

## Hardware Budget Summary

| Workload | RAM | VRAM | Latency | Blocking? |
|---|---|---|---|---|
| Driving policy (×8 agents) | < 50 MB | 0 | < 5 ms total | No (hot path) |
| Dialogue (Standard) | ~600 MB | 0 | ~150 ms | No (async) |
| Dialogue (High) | ~2 GB | ~2 GB | ~50 ms | No (async) |
| TTS | ~100 MB | 0 | ~200 ms | No (after dialogue callback) |

Minimum spec target: 8 GB system RAM, no GPU requirement. Standard quality mode runs on CPU only.

---

## References

- [[Synadrive MVP Vision]] — §AI approach
- [[VehicleExtension — Architecture Decisions]] — shared context for extension split decisions
- Phi-3 Mini (Microsoft) — candidate base model for fine-tuning
- Piper TTS — candidate TTS model (VITS-based, Apache 2.0)
- ONNX Runtime C++ API docs — https://onnxruntime.ai/docs/api/c/

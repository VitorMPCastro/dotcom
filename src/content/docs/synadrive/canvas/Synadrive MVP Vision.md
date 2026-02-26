---
title: "Synadrive MVP Vision"
description: "Auto-generated from Obsidian canvas — visual overview of Synadrive MVP Vision."
---

:::note
This page is auto-generated from an Obsidian canvas file. Edit the source `.canvas` in Obsidian to update this page.
:::

## Tier 1 — MVP

- **Core Vehicle Physics** — Pacejka tires, suspension, aero, drivetrain
- **AI Driving Agent** — ONNX inference + BT fallback
- **ONNX Inference Engine *(shared)*** — Driving AI, Dialogue AI, TTS
- **Raytracing (C++ BVH)** — Audio RT + AI RT modules
- **Weather + Track Conditions** — Coupled: weather → grip
- **Camera System** — Chase, cockpit, hood, free cam
- **Basic Audio & Mixing** — Bus routing, placeholder engine, tire sounds
- **Telemetry Recording** — Per-frame data, HUD overlay
- **HUD, Menus & Settings** — GUIDE input, SettingsManager
- **Debug & Dev Tools** — Overlay, console, draw
- **Driving Assists** — ABS, TCS, stability, auto-gear

## Tier 2 — Alpha

- **Multiple Tracks (3-5)** — Silverdale, Monte Sereno, +
- **More Car Classes** — Prototype, Rally
- **AI Personalities** — Aggressive, conservative, etc.
- **Character Builder + NPCs** — Appearance, stats, identity
- **Engine Sound Synthesis (C++)** — Per-cylinder combustion sim
- **Tire/Fuel Strategy** — Thermal model, wear, consumption
- **Damage Model (wear)** — Engine, gearbox, suspension
- **Force Feedback (C++)** — Self-aligning torque, surface
- **Ghost Racing** — Playback from telemetry data
- **Session & Race Management** — Types, starts, positions
- **Save/Load System** — Setups, AI models, settings
- **Localization Foundation** — String externalization, tr()
- **Training Visualization** — Live metrics, reward curves

## Tier 3 — Beta

- **Dialogue System (ONNX)** — Fine-tuned racing LM + TTS
- **Career & Championship** — Weekends, standings, seasons
- **World Editor** — Track elements, scenery
- **Node Editors** — AI behavior + championship rules
- **Replay System & Cameras** — Timeline, TV cams, export
- **Race Director & Flags** — Yellow, blue, penalties, VSC
- **Pit Stop System** — Tire change, fuel, repairs
- **Spotter / Engineer Voice** — Contextual TTS callouts
- **Accessibility** — Colorblind, subtitles, narration
- **Full Damage Model** — Visual deformation, detachment

## Tier 4 — Early Access

- **Multiplayer** — Lobby, sync, latency comp
- **Mod Support** — Resource packs, loading, validation
- **Leaderboards** — Online times, replay validation
- **Photo Mode** — Free cam, DOF, color grading
- **Full Track Roster** — Community + dev tracks
- **Polished NPCs** — Backstories, emotional range
- **Steam Integration** — SDK, achievements, cloud saves

## Tier 5 — 1.0 Release

- **Day/Night Cycle** — Lighting, temperature, visibility
- **Full Localization** — All languages, all content
- **Anti-Cheat** — Client integrity, replay verify
- **Community Tools** — Workshop, shared content
- **Model Marketplace** — Share AI agents, mods
- **Full Accessibility** — WCAG 2.1 AA compliance

## Feature Dependencies

| From | Relationship | To |
|---|---|---|
| ONNX Inference Engine *(shared)* | inference | AI Driving Agent |
| Raytracing (C++ BVH) | audio RT | Engine Sound Synthesis (C++) |
| Telemetry Recording | playback data | Ghost Racing |
| Core Vehicle Physics | wear feedback | Damage Model (wear) |
| AI Driving Agent | reward presets | AI Personalities |
| Ghost Racing | extends | Replay System & Cameras |
| Character Builder + NPCs | personality | Dialogue System (ONNX) |
| Damage Model (wear) | repair need | Pit Stop System |
| Tire/Fuel Strategy | tire/fuel state | Pit Stop System |
| Session & Race Management | race structure | Career & Championship |
| Save/Load System | persistence | Career & Championship |
| Damage Model (wear) | visual | Full Damage Model |
| Character Builder + NPCs | polished | Polished NPCs |
| Session & Race Management | net sessions | Multiplayer |
| Localization Foundation | all languages | Full Localization |
| ONNX Inference Engine *(shared)* | shared infra | Dialogue System (ONNX) |
| Dialogue System (ONNX) | TTS | Spotter / Engineer Voice |
| Accessibility | WCAG 2.1 | Full Accessibility |
| Mod Support | extends | Community Tools |
| Mod Support | distribution | Model Marketplace |
| Multiplayer | integrity | Anti-Cheat |


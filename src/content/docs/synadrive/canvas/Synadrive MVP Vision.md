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


## Tier 3 — Beta


## Tier 4 — Early Access


## Tier 5 — 1.0 Release


## Feature Dependencies

| From | Relationship | To |
|---|---|---|
| ONNX Inference Engine *(shared)* | inference | AI Driving Agent |


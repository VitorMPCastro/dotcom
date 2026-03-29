---
title: Vehicle Physics — Tier 1 Implementation Plan
aliases: [Vehicle Physics — Tier 1 Implementation Plan]
linter-yaml-title-alias: Vehicle Physics — Tier 1 Implementation Plan
tags:
  - Synadrive
  - vehicle-physics
  - tier-1
  - implementation-plan
type: implementation-plan
status: pending
created: 2026-02-26
updated: 2026-02-26
version: 0.1.0
---

# Vehicle Physics — Tier 1 Implementation Plan

Full implementation plan for the Tier 1 vehicle physics stack. Target: a driveable FWD hatchback on the debug plane with realistic sim-level physics at 240 Hz.

See also: [[Vehicle Node Tree]] for the full scene node hierarchy diagram.

---

## Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| C++ timing | C++ from day one | At 240 Hz, the Pacejka hot path (~960 tire evaluations/sec) is far too slow in GDScript. |
| Physics tick rate | 240 Hz | Simracing accuracy. ACC and AMS2 run at 333–400 Hz; 240 Hz is a strong first step. |
| First car | FWD hatchback | Eliminates rear differential torque distribution complexity. Same architecture scales to GT3. |
| Architecture | C++ leaves, GDScript orchestrator | `VehicleController` stays in GDScript for fast iteration. Pacejka + spring-damper are C++. |
| Suspension raycast | GDScript `RayCast3D` | Simpler than calling `PhysicsServer3D` from C++. 4 ray casts per tick is acceptable cost. |

---

## Progress Dashboard

```dataview
TABLE step AS "Step", status AS "Status", language AS "Language", files-to-create AS "Files"
FROM "Gamedev/Synadrive/Vehicle Physics"
WHERE type = "impl-step"
SORT step ASC
```

---

## Steps at a Glance

| # | Step | Language | Status |
|---|---|---|---|
| 1 | [[Step 01 - Physics Tick Rate]] | Config | 🔴 Pending |
| 2 | [[Step 02 - GDExtension Scaffold]] | C++ | 🔴 Pending |
| 3 | [[Step 03 - TireModel (C++)]] | C++ | 🔴 Pending |
| 4 | [[Step 04 - Suspension (C++)]] | C++ | 🔴 Pending |
| 5 | [[Step 05 - CarSpec Resource]] | GDScript | 🔴 Pending |
| 6 | [[Step 06 - AeroModel]] | GDScript | 🔴 Pending |
| 7 | [[Step 07 - Drivetrain]] | GDScript | 🔴 Pending |
| 8 | [[Step 08 - VehicleController]] | GDScript | 🔴 Pending |
| 9 | [[Step 09 - GUIDE Input Resources]] | Resources | 🔴 Pending |
| 10 | [[Step 10 - Scene Assembly]] | Scene | 🔴 Pending |
| 11 | [[Step 11 - GUT Tests]] | GDScript | 🔴 Pending |
| 12 | [[Step 12 - Debug Integration]] | Config | 🔴 Pending |

---

## Learning Resources

See [[Learning Resources]] for the full reading list before and during implementation.

**Minimum reading before writing a single line of code:**

1. Marco Monster — *Car Physics for Games* (gamedev.net) — start here.
2. Brian Beckman — *Physics of Racing* parts 1–6 (free PDF) — understand slip angles before touching Pacejka.
3. Edy's Vehicle Physics Docs (vehiclephysics.com) — force application order, solver stability.

---

## Scope Boundaries (Tier 1 Only)

**In scope:**

- Pacejka tire model (lateral + longitudinal) + combined slip (friction circle)
- Spring-damper suspension (per corner, ray-cast compression)
- Weight transfer (longitudinal + lateral)
- Aerodynamic drag + downforce (constant air density)
- Engine torque curve, rev limiter, sequential gearbox
- FWD torque delivery
- Driving assists: ABS + TCS (simple threshold-based)
- `CarSpec` Resource + hatchback `.tres`
- GDExtension scaffold + SCons build

**Out of scope (Tier 2+):**

- Anti-roll bars, limited-slip differential
- Tire thermal model, tire wear, fuel consumption
- Damage model, force feedback
- Engine sound synthesis

---

## Related

- [[Synadrive MVP Vision]] — canonical feature registry and system deep-dives
- [[Vehicle Node Tree]] — Excalidraw node hierarchy diagram
- [[Vehicle Physics]] (canvas) — implementation flow diagram

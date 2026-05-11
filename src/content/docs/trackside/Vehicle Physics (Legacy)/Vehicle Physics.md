> [!warning] Legacy — Pre-MJIP Architecture
> This note describes the old VehicleController + Pacejka GDExtension approach. **MJIP supersedes this architecture.** Preserved for historical reference only. Do not implement from these notes without first reading [[MJIP — Overview]] and [[MJIP-Trackside Integration]].

     1|---
     2|title: Vehicle Physics — Tier 1 Implementation Plan
     3|aliases: [Vehicle Physics — Tier 1 Implementation Plan]
     4|linter-yaml-title-alias: Vehicle Physics — Tier 1 Implementation Plan
     5|tags:
     6|  - Trackside
     7|  - vehicle-physics
     8|  - tier-1
     9|  - implementation-plan
    10|type: implementation-plan
    11|status: pending
    12|created: 2026-02-26
    13|updated: 2026-02-26
    14|version: 0.1.0
    15|---
    16|
    17|# Vehicle Physics — Tier 1 Implementation Plan
    18|
    19|Full implementation plan for the Tier 1 vehicle physics stack. Target: a driveable FWD hatchback on the debug plane with realistic sim-level physics at 240 Hz.
    20|
    21|See also: [[Vehicle Node Tree]] for the full scene node hierarchy diagram.
    22|
    23|---
    24|
    25|## Key Decisions
    26|
    27|| Decision | Choice | Rationale |
    28||---|---|---|
    29|| C++ timing | C++ from day one | At 240 Hz, the Pacejka hot path (~960 tire evaluations/sec) is far too slow in GDScript. |
    30|| Physics tick rate | 240 Hz | Simracing accuracy. ACC and AMS2 run at 333–400 Hz; 240 Hz is a strong first step. |
    31|| First car | FWD hatchback | Eliminates rear differential torque distribution complexity. Same architecture scales to GT3. |
    32|| Architecture | C++ leaves, GDScript orchestrator | `VehicleController` stays in GDScript for fast iteration. Pacejka + spring-damper are C++. |
    33|| Suspension raycast | GDScript `RayCast3D` | Simpler than calling `PhysicsServer3D` from C++. 4 ray casts per tick is acceptable cost. |
    34|
    35|---
    36|
    37|## Progress Dashboard
    38|
    39|```dataview
    40|TABLE step AS "Step", status AS "Status", language AS "Language", files-to-create AS "Files"
    41|FROM "Gamedev/Trackside/Vehicle Physics"
    42|WHERE type = "impl-step"
    43|SORT step ASC
    44|```
    45|
    46|---
    47|
    48|## Steps at a Glance
    49|
    50|| # | Step | Language | Status |
    51||---|---|---|---|
    52|| 1 | [[Step 01 - Physics Tick Rate]] | Config | 🔴 Pending |
    53|| 2 | [[Step 02 - GDExtension Scaffold]] | C++ | 🔴 Pending |
    54|| 3 | [[Step 03 - TireModel (C++)]] | C++ | 🔴 Pending |
    55|| 4 | [[Step 04 - Suspension (C++)]] | C++ | 🔴 Pending |
    56|| 5 | [[Step 05 - CarSpec Resource]] | GDScript | 🔴 Pending |
    57|| 6 | [[Step 06 - AeroModel]] | GDScript | 🔴 Pending |
    58|| 7 | [[Step 07 - Drivetrain]] | GDScript | 🔴 Pending |
    59|| 8 | [[Step 08 - VehicleController]] | GDScript | 🔴 Pending |
    60|| 9 | [[Step 09 - GUIDE Input Resources]] | Resources | 🔴 Pending |
    61|| 10 | [[Step 10 - Scene Assembly]] | Scene | 🔴 Pending |
    62|| 11 | [[Step 11 - GUT Tests]] | GDScript | 🔴 Pending |
    63|| 12 | [[Step 12 - Debug Integration]] | Config | 🔴 Pending |
    64|
    65|---
    66|
    67|## Learning Resources
    68|
    69|See [[Learning Resources]] for the full reading list before and during implementation.
    70|
    71|**Minimum reading before writing a single line of code:**
    72|
    73|1. Marco Monster — *Car Physics for Games* (gamedev.net) — start here.
    74|2. Brian Beckman — *Physics of Racing* parts 1–6 (free PDF) — understand slip angles before touching Pacejka.
    75|3. Edy's Vehicle Physics Docs (vehiclephysics.com) — force application order, solver stability.
    76|
    77|---
    78|
    79|## Scope Boundaries (Tier 1 Only)
    80|
    81|**In scope:**
    82|
    83|- Pacejka tire model (lateral + longitudinal) + combined slip (friction circle)
    84|- Spring-damper suspension (per corner, ray-cast compression)
    85|- Weight transfer (longitudinal + lateral)
    86|- Aerodynamic drag + downforce (constant air density)
    87|- Engine torque curve, rev limiter, sequential gearbox
    88|- FWD torque delivery
    89|- Driving assists: ABS + TCS (simple threshold-based)
    90|- `CarSpec` Resource + hatchback `.tres`
    91|- GDExtension scaffold + SCons build
    92|
    93|**Out of scope (Tier 2+):**
    94|
    95|- Anti-roll bars, limited-slip differential
    96|- Tire thermal model, tire wear, fuel consumption
    97|- Damage model, force feedback
    98|- Engine sound synthesis
    99|
   100|---
   101|
   102|## Related
   103|
   104|- [[Trackside MVP Vision]] — canonical feature registry and system deep-dives
   105|- [[Vehicle Node Tree]] — Excalidraw node hierarchy diagram
   106|- [[Vehicle Physics]] (canvas) — implementation flow diagram
   107|
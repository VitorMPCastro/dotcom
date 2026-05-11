> [!warning] Legacy — Pre-MJIP Architecture
> This note describes the old VehicleController + Pacejka GDExtension approach. **MJIP supersedes this architecture.** Preserved for historical reference only. Do not implement from these notes without first reading [[MJIP — Overview]] and [[MJIP-Trackside Integration]].

     1|---
     2|title: Vehicle Physics — Index
     3|aliases: [Vehicle Physics — Index]
     4|linter-yaml-title-alias: Vehicle Physics — Index
     5|tags:
     6|  - Trackside
     7|  - vehicle-physics
     8|  - index
     9|type: index
    10|status: active
    11|created: 2026-05-03
    12|updated: 2026-05-03
    13|---
    14|
    15|# Vehicle Physics — Index
    16|
    17|Navigation hub for all Vehicle Physics notes. For the full project map see [[Trackside — Index]].
    18|
    19|---
    20|
    21|## Implementation Plan
    22|
    23|[[Vehicle Physics]] — Tier 1 master plan. Start here. Links to all 12 steps with full rationale.
    24|
    25|---
    26|
    27|## Step Map
    28|
    29|| Step | Title | Status | Language | Key Output |
    30||------|-------|--------|----------|------------|
    31|| [[Step 01 - Physics Tick Rate\|01]] | Physics Tick Rate | 🔴 Pending | Config | `project.godot` physics settings |
    32|| [[Step 02 - GDExtension Scaffold\|02]] | GDExtension Scaffold | 🔴 Pending | C++ | SConstruct, `.gdextension`, `register_types` |
    33|| [[Step 03 - TireModel (C++)\|03]] | TireModel (C++) | 🔴 Pending | C++ | `tire_model.h/cpp` — Pacejka MF6.2 |
    34|| [[Step 04 - Suspension (C++)\|04]] | Suspension (C++) | 🔴 Pending | C++ | `suspension.h/cpp` — spring-damper |
    35|| [[Step 05 - CarSpec Resource\|05]] | CarSpec Resource | 🔴 Pending | GDScript | `car_spec.gd`, first `.tres` |
    36|| [[Step 06 - AeroModel\|06]] | AeroModel | 🔴 Pending | GDScript | `aero_model.gd` |
    37|| [[Step 07 - Drivetrain\|07]] | Drivetrain | 🔴 Pending | GDScript | `drivetrain.gd` |
    38|| [[Step 08 - VehicleController\|08]] | VehicleController | 🔴 Pending | GDScript | `vehicle_controller.gd` — orchestrator |
    39|| [[Step 09 - GUIDE Input Resources\|09]] | GUIDE Input Resources | 🔴 Pending | Resources | Input action `.tres` files |
    40|| [[Step 10 - Scene Assembly\|10]] | Scene Assembly | 🔴 Pending | Scene | `vehicle_hatchback.tscn` |
    41|| [[Step 11 - GUT Tests\|11]] | GUT Tests | 🔴 Pending | GDScript | Unit tests for all physics components |
    42|| [[Step 12 - Debug Integration\|12]] | Debug Integration | 🔴 Pending | Config | `infinite_plane.tscn` debug scene |
    43|
    44|> Update status here and in the individual step note when a step completes.
    45|
    46|---
    47|
    48|## Architecture Notes
    49|
    50|| Note | What it covers |
    51||------|----------------|
    52|| [[VehicleExtension — Architecture Decisions]] | All major C++ GDExtension decisions (canonical) |
    53|| [[VehicleExtension]] | Redirect stub → points to above |
    54|| [[Part Primitive System — Architecture]] | Composable part design replacing VehicleSolver |
    55|| [[PartPrimitiveSystem]] | Redirect stub → points to above |
    56|| [[Vehicle Node Tree]] | Node hierarchy diagram (Excalidraw) |
    57|
    58|---
    59|
    60|## Reference & Learning
    61|
    62|| Note | What it covers |
    63||------|----------------|
    64|| [[Learning Resources]] | Books and articles: Pacejka, Edy, Gregor Veble, Jolt, Godot physics |
    65|| [[Simulation Tools]] | FOSS offline tools for LUT generation and validation |
    66|| [[Godot Integration — Learning Roadmap]] | 9-phase learning path for GDExtension editor tooling |
    67|
    68|---
    69|
    70|## Deferred Work
    71|
    72|[[To-do]] — Custom ODE and XPBD items with rationale.
    73|
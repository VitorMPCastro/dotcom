> [!warning] Legacy — Pre-MJIP Architecture
> This note describes the old VehicleController + Pacejka GDExtension approach. **MJIP supersedes this architecture.** Preserved for historical reference only. Do not implement from these notes without first reading [[MJIP — Overview]] and [[MJIP-Trackside Integration]].

     1|---
     2|title: "Step 01 - Physics Tick Rate"
     3|aliases: ["Step 01 - Physics Tick Rate"]
     4|linter-yaml-title-alias: "Step 01 - Physics Tick Rate"
     5|tags:
     6|  - Trackside
     7|  - vehicle-physics
     8|  - tier-1
     9|type: impl-step
    10|step: 1
    11|status: pending
    12|language: Config
    13|files-to-create:
    14|  - src/project.godot (modify)
    15|created: 2026-02-26
    16|updated: 2026-02-26
    17|---
    18|
    19|# Step 01 - Physics Tick Rate
    20|
    21|**Prerequisites:** None. Do this first before touching any code.
    22|**Estimated Complexity:** S (10 minutes)
    23|
    24|---
    25|
    26|## What
    27|
    28|Raise Godot's physics tick rate from the default 60 Hz to **240 Hz** and add a spiral-of-death guard.
    29|
    30|Edit `project.godot` — add two lines under the existing `[physics]` section:
    31|
    32|```ini
    33|[physics]
    34|
    35|3d/physics_engine="Jolt Physics"
    36|common/physics_ticks_per_second=240
    37|common/max_physics_steps_per_frame=8
    38|```
    39|
    40|---
    41|
    42|## Why 240 Hz
    43|
    44|Godot runs `_physics_process` and all `PhysicsServer3D` integration at the physics tick rate. The tire force evaluations, suspension spring forces, and weight transfer all happen here.
    45|
    46|At **60 Hz**, one physics step = 16.7 ms of simulation time. At **240 Hz**, one step = 4.2 ms. The narrower window means:
    47|
    48|- Faster detection of tire slip transitions (less numerical smearing of the contact patch model)
    49|- Suspension integration is numerically stabler at higher rates (spring-damper systems benefit from smaller `delta`)
    50|- Pacejka curves sample more finely during transient manoeuvres (steering inputs, braking)
    51|
    52|Commercial simracing titles:
    53|| Title | Physics Hz |
    54||---|---|
    55|| iRacing | ~180 Hz |
    56|| Assetto Corsa Competizione | 333 Hz |
    57|| Automobilista 2 | 400 Hz |
    58|| rFactor 2 | 400 Hz |
    59|
    60|240 Hz is a solid, conservative starting point. Can be raised to 360+ Hz later if profiling shows headroom.
    61|
    62|---
    63|
    64|## Why `max_physics_steps_per_frame = 8`
    65|
    66|Without this guard, if rendering stalls (a shader compile, a disk read, a system hiccup), Godot will try to "catch up" by running many physics steps in a single frame. At 240 Hz a 500 ms lag would trigger 120 catch-up steps — almost certainly causing numerical explosion in the vehicle physics.
    67|
    68|Setting `max_physics_steps_per_frame = 8` caps catch-up at 8 steps (33 ms of simulation). The simulation may lag momentarily but won't blow up.
    69|
    70|---
    71|
    72|## Verification
    73|
    74|After the edit, open the Godot editor, run the debug scene, and check the **Debugger → Monitors** tab. The `physics_frame` counter should increment at approximately 240× per second (visible as a higher heartbeat vs. the render FPS counter).
    75|
    76|---
    77|
    78|## Notes
    79|
    80|- This setting affects *all* physics in the project, not just vehicle physics — including the debug test plane's collision and the camera rig.
    81|- The camera rig uses `_process` (render-rate), not `_physics_process`, so it is unaffected.
    82|- GUT tests that use `simulate()` will also run at 240 Hz — account for this when writing time-based assertions (e.g., "after 1 second of simulation, N steps have elapsed" should use 240, not 60).
    83|
    84|---
    85|
    86|## Related
    87|
    88|- [[Step 02 - GDExtension Scaffold]] — next step
    89|- [[Vehicle Physics]] — back to hub
    90|
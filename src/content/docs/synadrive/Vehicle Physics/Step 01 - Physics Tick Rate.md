---
title: "Step 01 - Physics Tick Rate"
aliases: ["Step 01 - Physics Tick Rate"]
linter-yaml-title-alias: "Step 01 - Physics Tick Rate"
tags:
  - Synadrive
  - vehicle-physics
  - tier-1
type: impl-step
step: 1
status: pending
language: Config
files-to-create:
  - src/project.godot (modify)
created: 2026-02-26
updated: 2026-02-26
---

# Step 01 - Physics Tick Rate

**Prerequisites:** None. Do this first before touching any code.
**Estimated Complexity:** S (10 minutes)

---

## What

Raise Godot's physics tick rate from the default 60 Hz to **240 Hz** and add a spiral-of-death guard.

Edit `project.godot` — add two lines under the existing `[physics]` section:

```ini
[physics]

3d/physics_engine="Jolt Physics"
common/physics_ticks_per_second=240
common/max_physics_steps_per_frame=8
```

---

## Why 240 Hz

Godot runs `_physics_process` and all `PhysicsServer3D` integration at the physics tick rate. The tire force evaluations, suspension spring forces, and weight transfer all happen here.

At **60 Hz**, one physics step = 16.7 ms of simulation time. At **240 Hz**, one step = 4.2 ms. The narrower window means:

- Faster detection of tire slip transitions (less numerical smearing of the contact patch model)
- Suspension integration is numerically stabler at higher rates (spring-damper systems benefit from smaller `delta`)
- Pacejka curves sample more finely during transient manoeuvres (steering inputs, braking)

Commercial simracing titles:
| Title | Physics Hz |
|---|---|
| iRacing | ~180 Hz |
| Assetto Corsa Competizione | 333 Hz |
| Automobilista 2 | 400 Hz |
| rFactor 2 | 400 Hz |

240 Hz is a solid, conservative starting point. Can be raised to 360+ Hz later if profiling shows headroom.

---

## Why `max_physics_steps_per_frame = 8`

Without this guard, if rendering stalls (a shader compile, a disk read, a system hiccup), Godot will try to "catch up" by running many physics steps in a single frame. At 240 Hz a 500 ms lag would trigger 120 catch-up steps — almost certainly causing numerical explosion in the vehicle physics.

Setting `max_physics_steps_per_frame = 8` caps catch-up at 8 steps (33 ms of simulation). The simulation may lag momentarily but won't blow up.

---

## Verification

After the edit, open the Godot editor, run the debug scene, and check the **Debugger → Monitors** tab. The `physics_frame` counter should increment at approximately 240× per second (visible as a higher heartbeat vs. the render FPS counter).

---

## Notes

- This setting affects *all* physics in the project, not just vehicle physics — including the debug test plane's collision and the camera rig.
- The camera rig uses `_process` (render-rate), not `_physics_process`, so it is unaffected.
- GUT tests that use `simulate()` will also run at 240 Hz — account for this when writing time-based assertions (e.g., "after 1 second of simulation, N steps have elapsed" should use 240, not 60).

---

## Related

- [[Step 02 - GDExtension Scaffold]] — next step
- [[Vehicle Physics]] — back to hub

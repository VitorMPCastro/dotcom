---
title: "Step 10 - Scene Assembly"
aliases: ["Step 10 - Scene Assembly"]
linter-yaml-title-alias: "Step 10 - Scene Assembly"
tags:
  - Synadrive
  - vehicle-physics
  - tier-1
  - scene
type: impl-step
step: 10
status: pending
language: Scene
files-to-create:
  - src/scenes/vehicles/vehicle_hatchback.tscn
created: 2026-02-26
updated: 2026-02-26
---

# Step 10 - Scene Assembly

**Prerequisites:** [[Step 03 - TireModel (C++)]], [[Step 04 - Suspension (C++)]], [[Step 08 - VehicleController]], [[Step 09 - GUIDE Input Resources]]
**Estimated Complexity:** S (assembly, not logic)

---

## What

Assemble all implemented systems into a single `vehicle_hatchback.tscn` scene. Per the [scenes/.instructions.md](src/scenes/.instructions.md) convention: static structure belongs in `.tscn`, runtime logic in scripts. No code goes into the scene directly — it just wires nodes together and sets inspector values.

---

## Node Tree

Build this structure in the Godot editor:

```
VehicleHatchback (RigidBody3D) ← vehicle_controller.gd
├── CollisionShape3D            ← BoxShape3D, size ~(1.7, 1.4, 3.9) m
├── MeshInstance3D              ← placeholder box mesh (same dims, white material)
│
├── SuspensionFL (Suspension)   ← position: (-0.76, 0, 1.29) local space
├── SuspensionFR (Suspension)   ← position: ( 0.76, 0, 1.29)
├── SuspensionRL (Suspension)   ← position: (-0.74, 0, -1.29)
├── SuspensionRR (Suspension)   ← position: ( 0.74, 0, -1.29)
│
├── TireFL (TireModel)          ← same position as SuspensionFL
├── TireFR (TireModel)          ← same position as SuspensionFR
├── TireRL (TireModel)          ← same position as SuspensionRL
├── TireRR (TireModel)          ← same position as SuspensionRR
│
├── AeroModel                   ← Node, no position needed
├── Drivetrain                  ← Node, no position needed
│
└── CameraRig                   ← existing camera_rig.tscn (Ctrl+drag to embed)
```

**Suspension node positions** are the wheel anchor points — the origin from which the ray cast downward probes for ground. X = half track width, Z = half wheelbase.

---

## Inspector Values to Set

On the **VehicleHatchback (RigidBody3D)** root:

| Property | Value |
|---|---|
| `spec` | `res://resources/vehicles/hatchback_spec.tres` |
| `driving_context` | `res://resources/input/contexts/vehicle_driving_context.tres` |
| `action_throttle` | `res://resources/input/actions/vehicle/throttle.tres` |
| `action_brake` | `res://resources/input/actions/vehicle/brake.tres` |
| `action_steer` | `res://resources/input/actions/vehicle/steer.tres` |
| `action_gear_up` | `res://resources/input/actions/vehicle/gear_up.tres` |
| `action_gear_down` | `res://resources/input/actions/vehicle/gear_down.tres` |
| `action_handbrake` | `res://resources/input/actions/vehicle/handbrake.tres` |
| `mass` | Let `_ready()` set this from `spec.mass_kg` |
| `gravity_scale` | `1.0` |
| `linear_damp` | `0.01` (very light air resistance — not the aero model, just numerical stability) |
| `angular_damp` | `0.2` (prevents spin divergence on first run) |
| `can_sleep` | `false` |

---

## Suspension Node Values (All Four)

Set in each `Suspension` node inspector (these override the C++ defaults at startup; OR let `_apply_spec_to_nodes()` set them at runtime from `CarSpec`):

| Property | Value |
|---|---|
| `spring_stiffness` | 25000 |
| `damper_coefficient` | 2500 |
| `rest_length` | 0.35 |
| `max_travel` | 0.12 |

---

## Notes

- **Placeholder mesh is intentional** — a white box is fine for physics development. Visual model comes with artist assets.
- **CollisionShape3D is a box** — not capsule or convex hull. Tier 1 only needs a simple shape. The collision shape does NOT match the wheel positions — Jolt handles the vehicle body collision; the wheel-ground contact is modelled via ray casts in the suspension system (not via Jolt wheel colliders).
- **`CameraRig` as child** — the camera rig moves with the vehicle. `CameraRig.gd` should use `get_parent()` or a `@export` to track the vehicle body. This is already handled by the existing camera system.
- **No `VehicleBody3D`** — Godot has a built-in `VehicleBody3D` node. We are **not** using it. We use a raw `RigidBody3D` + custom physics to achieve sim-level accuracy.

---

## Verification

1. Open `infinite_plane.tscn` (debug scene).
2. In `DebugTestPlane`, set `vehicle_scene` export to `vehicle_hatchback.tscn`.
3. Run. The car should spawn resting on the plane without falling through.
4. Apply throttle — car moves forward.
5. Steer — car turns.
6. Check Output log — no errors, `speed_changed` signal emitting.

---

## Related

- [[Step 11 - GUT Tests]] — test systems before driver testing
- [[Step 12 - Debug Integration]] — wire to existing debug harness
- [[Vehicle Physics]] — back to hub

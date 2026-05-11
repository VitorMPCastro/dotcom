> [!warning] Legacy — Pre-MJIP Architecture
> This note describes the old VehicleController + Pacejka GDExtension approach. **MJIP supersedes this architecture.** Preserved for historical reference only. Do not implement from these notes without first reading [[MJIP — Overview]] and [[MJIP-Trackside Integration]].

     1|---
     2|title: "Step 10 - Scene Assembly"
     3|aliases: ["Step 10 - Scene Assembly"]
     4|linter-yaml-title-alias: "Step 10 - Scene Assembly"
     5|tags:
     6|  - Trackside
     7|  - vehicle-physics
     8|  - tier-1
     9|  - scene
    10|type: impl-step
    11|step: 10
    12|status: pending
    13|language: Scene
    14|files-to-create:
    15|  - src/scenes/vehicles/vehicle_hatchback.tscn
    16|created: 2026-02-26
    17|updated: 2026-02-26
    18|---
    19|
    20|# Step 10 - Scene Assembly
    21|
    22|**Prerequisites:** [[Step 03 - TireModel (C++)]], [[Step 04 - Suspension (C++)]], [[Step 08 - VehicleController]], [[Step 09 - GUIDE Input Resources]]
    23|**Estimated Complexity:** S (assembly, not logic)
    24|
    25|---
    26|
    27|## What
    28|
    29|Assemble all implemented systems into a single `vehicle_hatchback.tscn` scene. Per the [scenes/.instructions.md](src/scenes/.instructions.md) convention: static structure belongs in `.tscn`, runtime logic in scripts. No code goes into the scene directly — it just wires nodes together and sets inspector values.
    30|
    31|---
    32|
    33|## Node Tree
    34|
    35|Build this structure in the Godot editor:
    36|
    37|```
    38|VehicleHatchback (RigidBody3D) ← vehicle_controller.gd
    39|├── CollisionShape3D            ← BoxShape3D, size ~(1.7, 1.4, 3.9) m
    40|├── MeshInstance3D              ← placeholder box mesh (same dims, white material)
    41|│
    42|├── SuspensionFL (Suspension)   ← position: (-0.76, 0, 1.29) local space
    43|├── SuspensionFR (Suspension)   ← position: ( 0.76, 0, 1.29)
    44|├── SuspensionRL (Suspension)   ← position: (-0.74, 0, -1.29)
    45|├── SuspensionRR (Suspension)   ← position: ( 0.74, 0, -1.29)
    46|│
    47|├── TireFL (TireModel)          ← same position as SuspensionFL
    48|├── TireFR (TireModel)          ← same position as SuspensionFR
    49|├── TireRL (TireModel)          ← same position as SuspensionRL
    50|├── TireRR (TireModel)          ← same position as SuspensionRR
    51|│
    52|├── AeroModel                   ← Node, no position needed
    53|├── Drivetrain                  ← Node, no position needed
    54|│
    55|└── CameraRig                   ← existing camera_rig.tscn (Ctrl+drag to embed)
    56|```
    57|
    58|**Suspension node positions** are the wheel anchor points — the origin from which the ray cast downward probes for ground. X = half track width, Z = half wheelbase.
    59|
    60|---
    61|
    62|## Inspector Values to Set
    63|
    64|On the **VehicleHatchback (RigidBody3D)** root:
    65|
    66|| Property | Value |
    67||---|---|
    68|| `spec` | `res://resources/vehicles/hatchback_spec.tres` |
    69|| `driving_context` | `res://resources/input/contexts/vehicle_driving_context.tres` |
    70|| `action_throttle` | `res://resources/input/actions/vehicle/throttle.tres` |
    71|| `action_brake` | `res://resources/input/actions/vehicle/brake.tres` |
    72|| `action_steer` | `res://resources/input/actions/vehicle/steer.tres` |
    73|| `action_gear_up` | `res://resources/input/actions/vehicle/gear_up.tres` |
    74|| `action_gear_down` | `res://resources/input/actions/vehicle/gear_down.tres` |
    75|| `action_handbrake` | `res://resources/input/actions/vehicle/handbrake.tres` |
    76|| `mass` | Let `_ready()` set this from `spec.mass_kg` |
    77|| `gravity_scale` | `1.0` |
    78|| `linear_damp` | `0.01` (very light air resistance — not the aero model, just numerical stability) |
    79|| `angular_damp` | `0.2` (prevents spin divergence on first run) |
    80|| `can_sleep` | `false` |
    81|
    82|---
    83|
    84|## Suspension Node Values (All Four)
    85|
    86|Set in each `Suspension` node inspector (these override the C++ defaults at startup; OR let `_apply_spec_to_nodes()` set them at runtime from `CarSpec`):
    87|
    88|| Property | Value |
    89||---|---|
    90|| `spring_stiffness` | 25000 |
    91|| `damper_coefficient` | 2500 |
    92|| `rest_length` | 0.35 |
    93|| `max_travel` | 0.12 |
    94|
    95|---
    96|
    97|## Notes
    98|
    99|- **Placeholder mesh is intentional** — a white box is fine for physics development. Visual model comes with artist assets.
   100|- **CollisionShape3D is a box** — not capsule or convex hull. Tier 1 only needs a simple shape. The collision shape does NOT match the wheel positions — Jolt handles the vehicle body collision; the wheel-ground contact is modelled via ray casts in the suspension system (not via Jolt wheel colliders).
   101|- **`CameraRig` as child** — the camera rig moves with the vehicle. `CameraRig.gd` should use `get_parent()` or a `@export` to track the vehicle body. This is already handled by the existing camera system.
   102|- **No `VehicleBody3D`** — Godot has a built-in `VehicleBody3D` node. We are **not** using it. We use a raw `RigidBody3D` + custom physics to achieve sim-level accuracy.
   103|
   104|---
   105|
   106|## Verification
   107|
   108|1. Open `infinite_plane.tscn` (debug scene).
   109|2. In `DebugTestPlane`, set `vehicle_scene` export to `vehicle_hatchback.tscn`.
   110|3. Run. The car should spawn resting on the plane without falling through.
   111|4. Apply throttle — car moves forward.
   112|5. Steer — car turns.
   113|6. Check Output log — no errors, `speed_changed` signal emitting.
   114|
   115|---
   116|
   117|## Related
   118|
   119|- [[Step 11 - GUT Tests]] — test systems before driver testing
   120|- [[Step 12 - Debug Integration]] — wire to existing debug harness
   121|- [[Vehicle Physics]] — back to hub
   122|
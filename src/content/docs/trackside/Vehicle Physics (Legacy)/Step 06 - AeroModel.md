> [!warning] Legacy — Pre-MJIP Architecture
> This note describes the old VehicleController + Pacejka GDExtension approach. **MJIP supersedes this architecture.** Preserved for historical reference only. Do not implement from these notes without first reading [[MJIP — Overview]] and [[MJIP-Trackside Integration]].

     1|---
     2|title: "Step 06 - AeroModel"
     3|aliases: ["Step 06 - AeroModel"]
     4|linter-yaml-title-alias: "Step 06 - AeroModel"
     5|tags:
     6|  - Trackside
     7|  - vehicle-physics
     8|  - tier-1
     9|  - gdscript
    10|  - aerodynamics
    11|type: impl-step
    12|step: 6
    13|status: pending
    14|language: GDScript
    15|files-to-create:
    16|  - src/scripts/vehicle/aero_model.gd
    17|created: 2026-02-26
    18|updated: 2026-02-26
    19|---
    20|
    21|# Step 06 - AeroModel
    22|
    23|**Prerequisites:** [[Step 05 - CarSpec Resource]]
    24|**Estimated Complexity:** S
    25|
    26|---
    27|
    28|## What
    29|
    30|Implement aerodynamic drag and downforce as a light GDScript `Node`. Reads air speed from the parent vehicle, outputs a drag force vector and per-axle downforce scalars for `VehicleController` to apply.
    31|
    32|---
    33|
    34|## aero_model.gd
    35|
    36|```gdscript
    37|class_name AeroModel
    38|extends Node
    39|## Aerodynamic drag and downforce model.
    40|## Reads CarSpec constants. Outputs forces every physics tick.
    41|## Air density is held constant at sea level (1.225 kg/m³) for Tier 1.
    42|
    43|const AIR_DENSITY: float = 1.225  ## kg/m³ at sea level, 15°C
    44|
    45|@export var spec: CarSpec
    46|
    47|# --- State ---
    48|var _last_drag_N: float = 0.0
    49|var _last_downforce_N: float = 0.0
    50|
    51|# --- Public API ---
    52|
    53|## Compute aerodynamic drag force in world space.
    54|## @param velocity  Vehicle world-space velocity vector (m/s).
    55|## @return  Drag force vector opposing velocity direction (Newtons).
    56|func compute_drag(velocity: Vector3) -> Vector3:
    57|    var speed_sq: float = velocity.length_squared()
    58|    if speed_sq < 0.01:
    59|        _last_drag_N = 0.0
    60|        return Vector3.ZERO
    61|
    62|    # F_drag = 0.5 · Cd · A · ρ · v²
    63|    _last_drag_N = 0.5 * spec.drag_coefficient * spec.frontal_area_m2 * AIR_DENSITY * speed_sq
    64|    return -velocity.normalized() * _last_drag_N
    65|
    66|
    67|## Compute total downforce (Newtons). Split by aero_balance_front.
    68|## @param speed_ms  Scalar speed in m/s.
    69|## @return  Total downforce in Newtons (always positive).
    70|func compute_downforce(speed_ms: float) -> float:
    71|    # F_downforce = 0.5 · Cl · A · ρ · v²
    72|    _last_downforce_N = 0.5 * spec.downforce_coefficient * spec.frontal_area_m2 * AIR_DENSITY * speed_ms * speed_ms
    73|    return _last_downforce_N
    74|
    75|
    76|## Downforce applied to the front axle (Newtons).
    77|func get_front_downforce() -> float:
    78|    return _last_downforce_N * spec.aero_balance_front
    79|
    80|
    81|## Downforce applied to the rear axle (Newtons).
    82|func get_rear_downforce() -> float:
    83|    return _last_downforce_N * (1.0 - spec.aero_balance_front)
    84|
    85|
    86|## Last computed drag magnitude (Newtons). For telemetry HUD.
    87|func get_drag_force() -> float:
    88|    return _last_drag_N
    89|
    90|
    91|## Last computed total downforce (Newtons). For telemetry HUD.
    92|func get_downforce() -> float:
    93|    return _last_downforce_N
    94|```
    95|
    96|---
    97|
    98|## Notes
    99|
   100|- **This node is a logic component** — it extends `Node`, not `Node3D`. It has no physical presence in the scene; it's a pure computation service owned by `VehicleController`.
   101|- **Air density is constant** for Tier 1. Tier 2 will vary it by weather temperature once the weather system is implemented (from the coupled weather/track conditions system).
   102|- **Downforce on a FWD hatchback is tiny** — `downforce_coefficient = 0.05` produces about 30 N at 100 km/h. This is realistic (street car, no bodykit). The model exists now so GT3-class cars with `Cl = 3.0+` are trivially supported later.
   103|- **`compute_drag` receives world-space velocity** — the drag force correctly opposes the actual direction of travel (including sideways drift drag), not just the forward direction.
   104|
   105|---
   106|
   107|## Usage in VehicleController (Preview)
   108|
   109|```gdscript
   110|# In VehicleController._physics_process():
   111|var vel: Vector3 = linear_velocity
   112|var drag: Vector3 = _aero.compute_drag(vel)
   113|var downforce: float = _aero.compute_downforce(vel.length())
   114|
   115|# Apply drag at centre of mass
   116|apply_central_force(drag)
   117|
   118|# Add downforce to normal load before tire force calculation
   119|var front_df: float = _aero.get_front_downforce()
   120|var rear_df: float = _aero.get_rear_downforce()
   121|```
   122|
   123|---
   124|
   125|## Related
   126|
   127|- [[Step 05 - CarSpec Resource]] — provides `Cd`, `Cl`, `A`, `aero_balance_front`
   128|- [[Step 08 - VehicleController]] — calls `compute_drag` and `compute_downforce` each tick
   129|- [[Vehicle Physics]] — back to hub
   130|
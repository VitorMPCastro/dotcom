> [!warning] Legacy — Pre-MJIP Architecture
> This note describes the old VehicleController + Pacejka GDExtension approach. **MJIP supersedes this architecture.** Preserved for historical reference only. Do not implement from these notes without first reading [[MJIP — Overview]] and [[MJIP-Trackside Integration]].

     1|---
     2|title: "Step 08 - VehicleController"
     3|aliases: ["Step 08 - VehicleController"]
     4|linter-yaml-title-alias: "Step 08 - VehicleController"
     5|tags:
     6|  - Trackside
     7|  - vehicle-physics
     8|  - tier-1
     9|  - gdscript
    10|  - controller
    11|type: impl-step
    12|step: 8
    13|status: pending
    14|language: GDScript
    15|files-to-create:
    16|  - src/scripts/vehicle/vehicle_controller.gd
    17|created: 2026-02-26
    18|updated: 2026-02-26
    19|---
    20|
    21|# Step 08 - VehicleController
    22|
    23|**Prerequisites:** [[Step 03 - TireModel (C++)]], [[Step 04 - Suspension (C++)]], [[Step 05 - CarSpec Resource]], [[Step 06 - AeroModel]], [[Step 07 - Drivetrain]]
    24|**Estimated Complexity:** L — this is the most complex script in the project
    25|
    26|---
    27|
    28|## What
    29|
    30|The orchestrator. Runs every physics tick, queries all sub-systems in the *correct force application order*, and applies summed forces to the `RigidBody3D` body via `PhysicsServer3D`. Getting the **order** wrong causes violent solver instability — see [[Learning Resources]] (Edy's VP + Veble).
    31|
    32|---
    33|
    34|## Force Application Order
    35|
    36|This order is mandatory. Do not reorder.
    37|
    38|```
    39|1. Cast suspension rays → compute compression per corner
    40|2. Call Suspension.compute_force() per corner
    41|3. Compute weight from static axle loads + aero downforce
    42|4. Compute normal load per tire (static + dynamic transfer + downforce for that corner)
    43|5. Compute wheel angular speed from vehicle velocity + slip geometry
    44|6. Compute slip ratio (longitudinal) and slip angle (lateral) per wheel
    45|7. Apply driving assists (ABS / TCS) — modify slip before Pacejka call
    46|8. Call TireModel.compute_force() per corner
    47|9. Rotate tire forces from wheel-local to world space
    48|10. Compute and apply AeroModel.compute_drag() (world space, on centre of mass)
    49|11. Call Drivetrain.update() → get wheel torque → add to front tire Fx
    50|12. Apply all contact patch forces at their positions using apply_force()
    51|13. Apply suspension forces upward at wheel anchors
    52|14. Emit signals (speed_changed, gear_changed, slip detected)
    53|```
    54|
    55|---
    56|
    57|## vehicle_controller.gd (Structure)
    58|
    59|The full implementation is too long for this note — it will be built iteratively. This is the **skeleton** to start from:
    60|
    61|```gdscript
    62|class_name VehicleController
    63|extends RigidBody3D
    64|## Vehicle physics orchestrator. Runs the full force application loop each physics tick.
    65|## All sub-systems (TireModel, Suspension, AeroModel, Drivetrain) are children of this node.
    66|
    67|# --- Signals ---
    68|signal speed_changed(speed_mps: float)
    69|signal gear_changed(gear: int)
    70|signal wheel_slip_detected(corner: int, slip_ratio: float, slip_angle: float)
    71|
    72|# --- Enums ---
    73|enum Corner { FL = 0, FR = 1, RL = 2, RR = 3 }
    74|
    75|# --- Exports ---
    76|@export var spec: CarSpec
    77|
    78|# --- Node References ---
    79|@onready var _suspension: Array[Suspension] = [
    80|    $SuspensionFL, $SuspensionFR, $SuspensionRL, $SuspensionRR
    81|]
    82|@onready var _tires: Array[TireModel] = [
    83|    $TireFL, $TireFR, $TireRL, $TireRR
    84|]
    85|@onready var _aero: AeroModel = $AeroModel
    86|@onready var _drivetrain: Drivetrain = $Drivetrain
    87|
    88|# --- Input State ---
    89|var _throttle: float = 0.0
    90|var _brake: float = 0.0
    91|var _steer: float = 0.0
    92|var _gear_up_pressed: bool = false
    93|var _gear_down_pressed: bool = false
    94|
    95|# --- Internal Physics State ---
    96|var _prev_compression: Array[float] = [0.0, 0.0, 0.0, 0.0]
    97|var _steer_angle_rad: float = 0.0
    98|
    99|# --- Constants ---
   100|const MAX_STEER_ANGLE_RAD: float = deg_to_rad(28.0)  ## FWD hatchback max steer
   101|const GRAVITY: float = 9.81
   102|
   103|# --- Built-In Virtual Methods ---
   104|
   105|func _ready() -> void:
   106|    mass = spec.mass_kg
   107|    _drivetrain.gear_changed.connect(_on_gear_changed)
   108|    # Configure C++ nodes from spec
   109|    _apply_spec_to_nodes()
   110|
   111|
   112|func _physics_process(delta: float) -> void:
   113|    _steer_angle_rad = _steer * MAX_STEER_ANGLE_RAD
   114|
   115|    # --- Step 1–2: Suspension ray casts + forces ---
   116|    var suspension_forces: Array[float] = _compute_suspension_forces(delta)
   117|
   118|    # --- Step 3–4: Normal loads (static weight + transfer + downforce) ---
   119|    var speed: float = linear_velocity.length()
   120|    var downforce: float = _aero.compute_downforce(speed)
   121|    var normal_loads: Array[float] = _compute_normal_loads(suspension_forces, downforce)
   122|
   123|    # --- Step 5–7: Slip calculations + assists ---
   124|    var slip_ratios: Array[float] = _compute_slip_ratios()
   125|    var slip_angles: Array[float] = _compute_slip_angles()
   126|    _apply_abs(_brake, slip_ratios)
   127|    _apply_tcs(_throttle, slip_ratios)
   128|
   129|    # --- Step 8–9: Tire forces (world space) ---
   130|    var tire_forces: Array[Vector3] = _compute_tire_forces(slip_ratios, slip_angles, normal_loads)
   131|
   132|    # --- Step 10: Aerodynamic drag ---
   133|    var drag: Vector3 = _aero.compute_drag(linear_velocity)
   134|    apply_central_force(drag)
   135|
   136|    # --- Step 11: Drivetrain torque → front tire longitudinal boost ---
   137|    var drive_torque: float = _drivetrain.update(delta, _get_front_wheel_speed(), _throttle)
   138|    var drive_force: float = drive_torque / spec.tire_radius_m
   139|    tire_forces[Corner.FL] += global_transform.basis.z * (drive_force * 0.5)
   140|    tire_forces[Corner.FR] += global_transform.basis.z * (drive_force * 0.5)
   141|
   142|    # --- Step 12: Apply tire forces at contact patches ---
   143|    for i: int in 4:
   144|        var contact_pos: Vector3 = _get_contact_patch_world(i)
   145|        apply_force(tire_forces[i], contact_pos - global_position)
   146|
   147|    # --- Step 13: Apply suspension forces ---
   148|    for i: int in 4:
   149|        var anchor: Vector3 = _get_wheel_anchor_world(i)
   150|        apply_force(Vector3.UP * suspension_forces[i], anchor - global_position)
   151|
   152|    # --- Step 14: Signals ---
   153|    speed_changed.emit(speed)
   154|
   155|
   156|# --- Private (stubs — fill in during implementation) ---
   157|
   158|func _apply_spec_to_nodes() -> void:
   159|    for s: Suspension in _suspension:
   160|        s.set_spring_stiffness(spec.spring_stiffness_N_m)
   161|        s.set_damper_coefficient(spec.damper_N_s_m)
   162|        s.set_rest_length(spec.suspension_rest_length_m)
   163|        s.set_max_travel(spec.suspension_max_travel_m)
   164|    for t: TireModel in _tires:
   165|        t.set_lateral_coefficients(spec.pacejka_lat_B, spec.pacejka_lat_C, spec.pacejka_lat_D, spec.pacejka_lat_E)
   166|        t.set_longitudinal_coefficients(spec.pacejka_lon_B, spec.pacejka_lon_C, spec.pacejka_lon_D, spec.pacejka_lon_E)
   167|
   168|
   169|func _compute_suspension_forces(_delta: float) -> Array[float]:
   170|    # TODO: implement ray casts per corner, call suspension[i].compute_force()
   171|    return [0.0, 0.0, 0.0, 0.0]
   172|
   173|
   174|func _compute_normal_loads(_suspension_forces: Array[float], _downforce: float) -> Array[float]:
   175|    # TODO: static weight + longitudinal/lateral transfer + per-axle downforce
   176|    var static_load: float = spec.mass_kg * GRAVITY
   177|    var per_corner: float = static_load / 4.0
   178|    return [per_corner, per_corner, per_corner, per_corner]
   179|
   180|
   181|func _compute_slip_ratios() -> Array[float]:
   182|    # TODO: (wheel_speed - vehicle_speed) / max(wheel_speed, vehicle_speed)
   183|    return [0.0, 0.0, 0.0, 0.0]
   184|
   185|
   186|func _compute_slip_angles() -> Array[float]:
   187|    # TODO: atan2(lateral_vel, longitudinal_vel) per wheel, accounting for steer angle on fronts
   188|    return [0.0, 0.0, 0.0, 0.0]
   189|
   190|
   191|func _compute_tire_forces(
   192|    _slip_ratios: Array[float],
   193|    _slip_angles: Array[float],
   194|    _normal_loads: Array[float]
   195|) -> Array[Vector3]:
   196|    var forces: Array[Vector3] = [Vector3.ZERO, Vector3.ZERO, Vector3.ZERO, Vector3.ZERO]
   197|    for i: int in 4:
   198|        var local_force: Vector3 = _tires[i].compute_force(
   199|            _slip_ratios[i], _slip_angles[i], _normal_loads[i], spec.grip_mu
   200|        )
   201|        # Rotate local → world. Front wheels rotated by steer angle.
   202|        var wheel_basis: Basis = _get_wheel_basis(i)
   203|        forces[i] = wheel_basis * local_force
   204|    return forces
   205|
   206|
   207|func _apply_abs(_brake_input: float, slip_ratios: Array[float]) -> void:
   208|    if not spec.abs_enabled:
   209|        return
   210|    # TODO: detect lockup (|slip_ratio| > threshold) and reduce effective brake pressure
   211|
   212|
   213|func _apply_tcs(_throttle_input: float, slip_ratios: Array[float]) -> void:
   214|    if not spec.tcs_enabled:
   215|        return
   216|    # TODO: detect driven wheel spin and cut throttle
   217|
   218|
   219|func _get_wheel_anchor_world(_corner: int) -> Vector3:
   220|    return _suspension[_corner].global_position
   221|
   222|
   223|func _get_contact_patch_world(_corner: int) -> Vector3:
   224|    return _get_wheel_anchor_world(_corner) + Vector3.DOWN * spec.suspension_rest_length_m
   225|
   226|
   227|func _get_wheel_basis(_corner: int) -> Basis:
   228|    var b: Basis = global_transform.basis
   229|    if _corner == Corner.FL or _corner == Corner.FR:
   230|        return b.rotated(b.y, _steer_angle_rad)
   231|    return b
   232|
   233|
   234|func _get_front_wheel_speed() -> float:
   235|    return linear_velocity.length() / spec.tire_radius_m
   236|
   237|
   238|func _on_gear_changed(gear: int) -> void:
   239|    gear_changed.emit(gear)
   240|```
   241|
   242|---
   243|
   244|## Implementation Priority
   245|
   246|Build the `TODO` sections in this order to get the car progressively more realistic:
   247|
   248|1. `_compute_suspension_forces` — ray casts. Without this the car falls through the floor.
   249|2. `_compute_slip_ratios` + `_compute_slip_angles` — basic values. Start with simplified approximations.
   250|3. `_compute_normal_loads` — weight transfer. Adds realism to cornering feel.
   251|4. `_apply_abs` / `_apply_tcs` — assists. Add these after the car is driveable.
   252|
   253|---
   254|
   255|## Notes
   256|
   257|- **`apply_force(force, offset)`** — offset is relative to the body's origin (centre of mass). Use `contact_pos - global_position` so forces create the correct torques.
   258|- **Steer angle** — front wheel basis is rotated by steer angle. Rear wheels have zero steer. The steer angle is applied uniformly to both front wheels (Ackermann geometry is Tier 2).
   259|- **Drive torque split** — 50/50 between FL and FR. No torque vectoring or LSD for Tier 1.
   260|
   261|---
   262|
   263|## Related
   264|
   265|- [[Step 09 - GUIDE Input Resources]] — feeds `_throttle`, `_brake`, `_steer` input
   266|- [[Step 10 - Scene Assembly]] — assembles all these nodes into a `.tscn`
   267|- [[Vehicle Physics]] — back to hub
   268|
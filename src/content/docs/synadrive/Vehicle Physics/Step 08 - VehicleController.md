---
title: "Step 08 - VehicleController"
aliases: ["Step 08 - VehicleController"]
linter-yaml-title-alias: "Step 08 - VehicleController"
tags:
  - Synadrive
  - vehicle-physics
  - tier-1
  - gdscript
  - controller
type: impl-step
step: 8
status: pending
language: GDScript
files-to-create:
  - src/scripts/vehicle/vehicle_controller.gd
created: 2026-02-26
updated: 2026-02-26
---

# Step 08 - VehicleController

**Prerequisites:** [[Step 03 - TireModel (C++)]], [[Step 04 - Suspension (C++)]], [[Step 05 - CarSpec Resource]], [[Step 06 - AeroModel]], [[Step 07 - Drivetrain]]
**Estimated Complexity:** L — this is the most complex script in the project

---

## What

The orchestrator. Runs every physics tick, queries all sub-systems in the *correct force application order*, and applies summed forces to the `RigidBody3D` body via `PhysicsServer3D`. Getting the **order** wrong causes violent solver instability — see [[Learning Resources]] (Edy's VP + Veble).

---

## Force Application Order

This order is mandatory. Do not reorder.

```
1. Cast suspension rays → compute compression per corner
2. Call Suspension.compute_force() per corner
3. Compute weight from static axle loads + aero downforce
4. Compute normal load per tire (static + dynamic transfer + downforce for that corner)
5. Compute wheel angular speed from vehicle velocity + slip geometry
6. Compute slip ratio (longitudinal) and slip angle (lateral) per wheel
7. Apply driving assists (ABS / TCS) — modify slip before Pacejka call
8. Call TireModel.compute_force() per corner
9. Rotate tire forces from wheel-local to world space
10. Compute and apply AeroModel.compute_drag() (world space, on centre of mass)
11. Call Drivetrain.update() → get wheel torque → add to front tire Fx
12. Apply all contact patch forces at their positions using apply_force()
13. Apply suspension forces upward at wheel anchors
14. Emit signals (speed_changed, gear_changed, slip detected)
```

---

## vehicle_controller.gd (Structure)

The full implementation is too long for this note — it will be built iteratively. This is the **skeleton** to start from:

```gdscript
class_name VehicleController
extends RigidBody3D
## Vehicle physics orchestrator. Runs the full force application loop each physics tick.
## All sub-systems (TireModel, Suspension, AeroModel, Drivetrain) are children of this node.

# --- Signals ---
signal speed_changed(speed_mps: float)
signal gear_changed(gear: int)
signal wheel_slip_detected(corner: int, slip_ratio: float, slip_angle: float)

# --- Enums ---
enum Corner { FL = 0, FR = 1, RL = 2, RR = 3 }

# --- Exports ---
@export var spec: CarSpec

# --- Node References ---
@onready var _suspension: Array[Suspension] = [
    $SuspensionFL, $SuspensionFR, $SuspensionRL, $SuspensionRR
]
@onready var _tires: Array[TireModel] = [
    $TireFL, $TireFR, $TireRL, $TireRR
]
@onready var _aero: AeroModel = $AeroModel
@onready var _drivetrain: Drivetrain = $Drivetrain

# --- Input State ---
var _throttle: float = 0.0
var _brake: float = 0.0
var _steer: float = 0.0
var _gear_up_pressed: bool = false
var _gear_down_pressed: bool = false

# --- Internal Physics State ---
var _prev_compression: Array[float] = [0.0, 0.0, 0.0, 0.0]
var _steer_angle_rad: float = 0.0

# --- Constants ---
const MAX_STEER_ANGLE_RAD: float = deg_to_rad(28.0)  ## FWD hatchback max steer
const GRAVITY: float = 9.81

# --- Built-In Virtual Methods ---

func _ready() -> void:
    mass = spec.mass_kg
    _drivetrain.gear_changed.connect(_on_gear_changed)
    # Configure C++ nodes from spec
    _apply_spec_to_nodes()


func _physics_process(delta: float) -> void:
    _steer_angle_rad = _steer * MAX_STEER_ANGLE_RAD

    # --- Step 1–2: Suspension ray casts + forces ---
    var suspension_forces: Array[float] = _compute_suspension_forces(delta)

    # --- Step 3–4: Normal loads (static weight + transfer + downforce) ---
    var speed: float = linear_velocity.length()
    var downforce: float = _aero.compute_downforce(speed)
    var normal_loads: Array[float] = _compute_normal_loads(suspension_forces, downforce)

    # --- Step 5–7: Slip calculations + assists ---
    var slip_ratios: Array[float] = _compute_slip_ratios()
    var slip_angles: Array[float] = _compute_slip_angles()
    _apply_abs(_brake, slip_ratios)
    _apply_tcs(_throttle, slip_ratios)

    # --- Step 8–9: Tire forces (world space) ---
    var tire_forces: Array[Vector3] = _compute_tire_forces(slip_ratios, slip_angles, normal_loads)

    # --- Step 10: Aerodynamic drag ---
    var drag: Vector3 = _aero.compute_drag(linear_velocity)
    apply_central_force(drag)

    # --- Step 11: Drivetrain torque → front tire longitudinal boost ---
    var drive_torque: float = _drivetrain.update(delta, _get_front_wheel_speed(), _throttle)
    var drive_force: float = drive_torque / spec.tire_radius_m
    tire_forces[Corner.FL] += global_transform.basis.z * (drive_force * 0.5)
    tire_forces[Corner.FR] += global_transform.basis.z * (drive_force * 0.5)

    # --- Step 12: Apply tire forces at contact patches ---
    for i: int in 4:
        var contact_pos: Vector3 = _get_contact_patch_world(i)
        apply_force(tire_forces[i], contact_pos - global_position)

    # --- Step 13: Apply suspension forces ---
    for i: int in 4:
        var anchor: Vector3 = _get_wheel_anchor_world(i)
        apply_force(Vector3.UP * suspension_forces[i], anchor - global_position)

    # --- Step 14: Signals ---
    speed_changed.emit(speed)


# --- Private (stubs — fill in during implementation) ---

func _apply_spec_to_nodes() -> void:
    for s: Suspension in _suspension:
        s.set_spring_stiffness(spec.spring_stiffness_N_m)
        s.set_damper_coefficient(spec.damper_N_s_m)
        s.set_rest_length(spec.suspension_rest_length_m)
        s.set_max_travel(spec.suspension_max_travel_m)
    for t: TireModel in _tires:
        t.set_lateral_coefficients(spec.pacejka_lat_B, spec.pacejka_lat_C, spec.pacejka_lat_D, spec.pacejka_lat_E)
        t.set_longitudinal_coefficients(spec.pacejka_lon_B, spec.pacejka_lon_C, spec.pacejka_lon_D, spec.pacejka_lon_E)


func _compute_suspension_forces(_delta: float) -> Array[float]:
    # TODO: implement ray casts per corner, call suspension[i].compute_force()
    return [0.0, 0.0, 0.0, 0.0]


func _compute_normal_loads(_suspension_forces: Array[float], _downforce: float) -> Array[float]:
    # TODO: static weight + longitudinal/lateral transfer + per-axle downforce
    var static_load: float = spec.mass_kg * GRAVITY
    var per_corner: float = static_load / 4.0
    return [per_corner, per_corner, per_corner, per_corner]


func _compute_slip_ratios() -> Array[float]:
    # TODO: (wheel_speed - vehicle_speed) / max(wheel_speed, vehicle_speed)
    return [0.0, 0.0, 0.0, 0.0]


func _compute_slip_angles() -> Array[float]:
    # TODO: atan2(lateral_vel, longitudinal_vel) per wheel, accounting for steer angle on fronts
    return [0.0, 0.0, 0.0, 0.0]


func _compute_tire_forces(
    _slip_ratios: Array[float],
    _slip_angles: Array[float],
    _normal_loads: Array[float]
) -> Array[Vector3]:
    var forces: Array[Vector3] = [Vector3.ZERO, Vector3.ZERO, Vector3.ZERO, Vector3.ZERO]
    for i: int in 4:
        var local_force: Vector3 = _tires[i].compute_force(
            _slip_ratios[i], _slip_angles[i], _normal_loads[i], spec.grip_mu
        )
        # Rotate local → world. Front wheels rotated by steer angle.
        var wheel_basis: Basis = _get_wheel_basis(i)
        forces[i] = wheel_basis * local_force
    return forces


func _apply_abs(_brake_input: float, slip_ratios: Array[float]) -> void:
    if not spec.abs_enabled:
        return
    # TODO: detect lockup (|slip_ratio| > threshold) and reduce effective brake pressure


func _apply_tcs(_throttle_input: float, slip_ratios: Array[float]) -> void:
    if not spec.tcs_enabled:
        return
    # TODO: detect driven wheel spin and cut throttle


func _get_wheel_anchor_world(_corner: int) -> Vector3:
    return _suspension[_corner].global_position


func _get_contact_patch_world(_corner: int) -> Vector3:
    return _get_wheel_anchor_world(_corner) + Vector3.DOWN * spec.suspension_rest_length_m


func _get_wheel_basis(_corner: int) -> Basis:
    var b: Basis = global_transform.basis
    if _corner == Corner.FL or _corner == Corner.FR:
        return b.rotated(b.y, _steer_angle_rad)
    return b


func _get_front_wheel_speed() -> float:
    return linear_velocity.length() / spec.tire_radius_m


func _on_gear_changed(gear: int) -> void:
    gear_changed.emit(gear)
```

---

## Implementation Priority

Build the `TODO` sections in this order to get the car progressively more realistic:

1. `_compute_suspension_forces` — ray casts. Without this the car falls through the floor.
2. `_compute_slip_ratios` + `_compute_slip_angles` — basic values. Start with simplified approximations.
3. `_compute_normal_loads` — weight transfer. Adds realism to cornering feel.
4. `_apply_abs` / `_apply_tcs` — assists. Add these after the car is driveable.

---

## Notes

- **`apply_force(force, offset)`** — offset is relative to the body's origin (centre of mass). Use `contact_pos - global_position` so forces create the correct torques.
- **Steer angle** — front wheel basis is rotated by steer angle. Rear wheels have zero steer. The steer angle is applied uniformly to both front wheels (Ackermann geometry is Tier 2).
- **Drive torque split** — 50/50 between FL and FR. No torque vectoring or LSD for Tier 1.

---

## Related

- [[Step 09 - GUIDE Input Resources]] — feeds `_throttle`, `_brake`, `_steer` input
- [[Step 10 - Scene Assembly]] — assembles all these nodes into a `.tscn`
- [[Vehicle Physics]] — back to hub

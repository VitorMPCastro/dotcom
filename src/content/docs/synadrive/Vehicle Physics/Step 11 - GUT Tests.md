---
title: "Step 11 - GUT Tests"
aliases: ["Step 11 - GUT Tests"]
linter-yaml-title-alias: "Step 11 - GUT Tests"
tags:
  - Synadrive
  - vehicle-physics
  - tier-1
  - testing
  - gut
type: impl-step
step: 11
status: pending
language: GDScript
files-to-create:
  - src/test/unit/test_tire_model.gd
  - src/test/unit/test_suspension.gd
  - src/test/unit/test_car_spec.gd
  - src/test/unit/test_drivetrain.gd
  - src/test/unit/test_aero_model.gd
created: 2026-02-26
updated: 2026-02-26
---

# Step 11 - GUT Tests

**Prerequisites:** [[Step 03 - TireModel (C++)]], [[Step 04 - Suspension (C++)]], [[Step 05 - CarSpec Resource]], [[Step 06 - AeroModel]], [[Step 07 - Drivetrain]]
**Estimated Complexity:** M

---

## What

Write GUT unit tests for all vehicle physics systems. Tests verify:

1. Mathematical correctness of formulas at known input values.
2. Edge cases (zero load, zero slip, full saturation).
3. Default `CarSpec` values are sane.

---

## test_tire_model.gd

```gdscript
extends GutTest

var _tire: TireModel

func before_each() -> void:
    _tire = TireModel.new()
    add_child_autofree(_tire)
    _tire.set_lateral_coefficients(10.0, 1.3, 1.0, -1.0)
    _tire.set_longitudinal_coefficients(11.0, 1.65, 1.0, 0.0)


func test_zero_slip_produces_no_force() -> void:
    var force: Vector3 = _tire.compute_force(0.0, 0.0, 3000.0, 0.9)
    assert_almost_eq(force.length(), 0.0, 1.0, "No force at zero slip")


func test_lateral_force_increases_with_slip_angle() -> void:
    var f1: Vector3 = _tire.compute_force(0.0, 0.05, 3000.0, 0.9)
    var f2: Vector3 = _tire.compute_force(0.0, 0.15, 3000.0, 0.9)
    # Lateral force (Z component) should be larger at higher slip angle (before peak)
    assert_gt(absf(f2.z), absf(f1.z), "Lateral force increases with slip angle")


func test_zero_normal_load_produces_no_force() -> void:
    var force: Vector3 = _tire.compute_force(0.1, 0.2, 0.0, 0.9)
    assert_almost_eq(force.length(), 0.0, 0.1, "No force at zero normal load")


func test_friction_circle_clamps_combined_force() -> void:
    var mu: float = 0.9
    var fz: float = 3000.0
    var limit: float = mu * fz

    # High slip in both axes — should be clamped
    var force: Vector3 = _tire.compute_force(0.8, 1.0, fz, mu)
    var resultant: float = sqrt(force.x * force.x + force.z * force.z)
    assert_lt(resultant, limit + 50.0, "Combined force within friction circle (with tolerance)")


func test_force_scales_with_normal_load() -> void:
    var f1: Vector3 = _tire.compute_force(0.0, 0.15, 1500.0, 0.9)
    var f2: Vector3 = _tire.compute_force(0.0, 0.15, 3000.0, 0.9)
    # Double the load, roughly double the peak force
    assert_gt(absf(f2.z), absf(f1.z), "Force scales with normal load")
```

---

## test_suspension.gd

```gdscript
extends GutTest

var _susp: Suspension

func before_each() -> void:
    _susp = Suspension.new()
    add_child_autofree(_susp)
    _susp.set_spring_stiffness(25000.0)
    _susp.set_damper_coefficient(2500.0)
    _susp.set_rest_length(0.35)
    _susp.set_max_travel(0.12)


func test_zero_compression_produces_no_spring_force() -> void:
    var force: float = _susp.compute_force(0.0, 0.0)
    assert_almost_eq(force, 0.0, 1.0, "No force at zero compression")


func test_spring_force_proportional_to_compression() -> void:
    var force: float = _susp.compute_force(0.05, 0.0)
    assert_almost_eq(force, 25000.0 * 0.05, 50.0, "Spring force = k * compression")


func test_damper_resists_compression_velocity() -> void:
    var force_static: float = _susp.compute_force(0.05, 0.0)
    var force_compressing: float = _susp.compute_force(0.05, 0.5)
    assert_gt(force_compressing, force_static, "Compressing damper adds positive force")


func test_no_tension_at_full_extension() -> void:
    # At zero compression with negative velocity (extending), force must be >= 0
    var force: float = _susp.compute_force(0.0, -1.0)
    assert_gte(force, 0.0, "Suspension cannot pull down")


func test_compression_clamped_to_max_travel() -> void:
    _susp.compute_force(0.5, 0.0)  # Way beyond max_travel of 0.12
    assert_almost_eq(_susp.get_compression(), 0.12, 0.001, "Compression clamped to max_travel")
```

---

## test_car_spec.gd

```gdscript
extends GutTest

var _spec: CarSpec

func before_each() -> void:
    _spec = CarSpec.new()


func test_mass_is_positive() -> void:
    assert_gt(_spec.mass_kg, 0.0, "mass_kg must be positive")


func test_gear_ratios_descend() -> void:
    for i: int in range(_spec.gear_ratios.size() - 1):
        assert_gt(_spec.gear_ratios[i], _spec.gear_ratios[i + 1],
            "Each gear ratio should be lower than the previous")


func test_redline_above_idle() -> void:
    assert_gt(_spec.redline_rpm, _spec.idle_rpm, "Redline must be above idle")


func test_weight_distribution_is_normalized() -> void:
    assert_between(_spec.weight_distribution_front, 0.0, 1.0,
        "Weight distribution must be in [0, 1]")


func test_grip_mu_is_positive() -> void:
    assert_gt(_spec.grip_mu, 0.0, "Grip mu must be positive")
    assert_lte(_spec.grip_mu, 1.5, "Grip mu should be physically plausible (<= 1.5 for street tires)")
```

---

## test_drivetrain.gd

```gdscript
extends GutTest

var _dt: Drivetrain

func before_each() -> void:
    _dt = Drivetrain.new()
    add_child_autofree(_dt)
    _dt.spec = CarSpec.new()


func test_rpm_stays_above_idle_at_rest() -> void:
    _dt.update(1.0 / 240.0, 0.0, 0.0)
    assert_gte(_dt.get_rpm(), _dt.spec.idle_rpm, "RPM never drops below idle")


func test_upshift_increments_gear() -> void:
    var initial_gear: int = _dt.get_gear()
    _dt.request_upshift()
    assert_eq(_dt.get_gear(), initial_gear + 1, "Upshift increments gear")


func test_no_upshift_above_top_gear() -> void:
    # Shift to top gear
    for _i: int in _dt.spec.gear_ratios.size():
        _dt.request_upshift()
        _dt.update(1.0, 0.0, 0.0)  # Simulate shift time passing
    var top_gear: int = _dt.get_gear()
    _dt.request_upshift()
    assert_eq(_dt.get_gear(), top_gear, "Cannot upshift above top gear")


func test_torque_zero_during_shift() -> void:
    _dt.request_upshift()
    # Immediately query — should still be shifting
    var torque: float = _dt.update(0.001, 50.0, 1.0)
    assert_almost_eq(torque, 0.0, 1.0, "No torque during gear change")
```

---

## test_aero_model.gd

```gdscript
extends GutTest

var _aero: AeroModel

func before_each() -> void:
    _aero = AeroModel.new()
    add_child_autofree(_aero)
    _aero.spec = CarSpec.new()


func test_drag_is_zero_at_rest() -> void:
    var drag: Vector3 = _aero.compute_drag(Vector3.ZERO)
    assert_almost_eq(drag.length(), 0.0, 0.1, "No drag at rest")


func test_drag_increases_with_speed_squared() -> void:
    var drag1: float = _aero.compute_drag(Vector3(10.0, 0, 0)).length()
    var drag2: float = _aero.compute_drag(Vector3(20.0, 0, 0)).length()
    assert_almost_eq(drag2 / drag1, 4.0, 0.1, "Drag scales with v²")


func test_drag_opposes_velocity() -> void:
    var vel: Vector3 = Vector3(30.0, 0, 0)
    var drag: Vector3 = _aero.compute_drag(vel)
    assert_lt(drag.x, 0.0, "Drag opposes forward velocity")


func test_downforce_balance_sums_to_total() -> void:
    _aero.compute_downforce(50.0)
    var front: float = _aero.get_front_downforce()
    var rear: float = _aero.get_rear_downforce()
    assert_almost_eq(front + rear, _aero.get_downforce(), 0.1, "Downforce front + rear = total")
```

---

## Running Tests

```bash
godot --headless --script addons/gut/gut_cmdln.gd -gdir=res://test/unit
```

All tests (including existing camera tests) should pass.

---

## Related

- [[Step 12 - Debug Integration]] — final verification step
- [[Vehicle Physics]] — back to hub

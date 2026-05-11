> [!warning] Legacy — Pre-MJIP Architecture
> This note describes the old VehicleController + Pacejka GDExtension approach. **MJIP supersedes this architecture.** Preserved for historical reference only. Do not implement from these notes without first reading [[MJIP — Overview]] and [[MJIP-Trackside Integration]].

     1|---
     2|title: "Step 11 - GUT Tests"
     3|aliases: ["Step 11 - GUT Tests"]
     4|linter-yaml-title-alias: "Step 11 - GUT Tests"
     5|tags:
     6|  - Trackside
     7|  - vehicle-physics
     8|  - tier-1
     9|  - testing
    10|  - gut
    11|type: impl-step
    12|step: 11
    13|status: pending
    14|language: GDScript
    15|files-to-create:
    16|  - src/test/unit/test_tire_model.gd
    17|  - src/test/unit/test_suspension.gd
    18|  - src/test/unit/test_car_spec.gd
    19|  - src/test/unit/test_drivetrain.gd
    20|  - src/test/unit/test_aero_model.gd
    21|created: 2026-02-26
    22|updated: 2026-02-26
    23|---
    24|
    25|# Step 11 - GUT Tests
    26|
    27|**Prerequisites:** [[Step 03 - TireModel (C++)]], [[Step 04 - Suspension (C++)]], [[Step 05 - CarSpec Resource]], [[Step 06 - AeroModel]], [[Step 07 - Drivetrain]]
    28|**Estimated Complexity:** M
    29|
    30|---
    31|
    32|## What
    33|
    34|Write GUT unit tests for all vehicle physics systems. Tests verify:
    35|
    36|1. Mathematical correctness of formulas at known input values.
    37|2. Edge cases (zero load, zero slip, full saturation).
    38|3. Default `CarSpec` values are sane.
    39|
    40|---
    41|
    42|## test_tire_model.gd
    43|
    44|```gdscript
    45|extends GutTest
    46|
    47|var _tire: TireModel
    48|
    49|func before_each() -> void:
    50|    _tire = TireModel.new()
    51|    add_child_autofree(_tire)
    52|    _tire.set_lateral_coefficients(10.0, 1.3, 1.0, -1.0)
    53|    _tire.set_longitudinal_coefficients(11.0, 1.65, 1.0, 0.0)
    54|
    55|
    56|func test_zero_slip_produces_no_force() -> void:
    57|    var force: Vector3 = _tire.compute_force(0.0, 0.0, 3000.0, 0.9)
    58|    assert_almost_eq(force.length(), 0.0, 1.0, "No force at zero slip")
    59|
    60|
    61|func test_lateral_force_increases_with_slip_angle() -> void:
    62|    var f1: Vector3 = _tire.compute_force(0.0, 0.05, 3000.0, 0.9)
    63|    var f2: Vector3 = _tire.compute_force(0.0, 0.15, 3000.0, 0.9)
    64|    # Lateral force (Z component) should be larger at higher slip angle (before peak)
    65|    assert_gt(absf(f2.z), absf(f1.z), "Lateral force increases with slip angle")
    66|
    67|
    68|func test_zero_normal_load_produces_no_force() -> void:
    69|    var force: Vector3 = _tire.compute_force(0.1, 0.2, 0.0, 0.9)
    70|    assert_almost_eq(force.length(), 0.0, 0.1, "No force at zero normal load")
    71|
    72|
    73|func test_friction_circle_clamps_combined_force() -> void:
    74|    var mu: float = 0.9
    75|    var fz: float = 3000.0
    76|    var limit: float = mu * fz
    77|
    78|    # High slip in both axes — should be clamped
    79|    var force: Vector3 = _tire.compute_force(0.8, 1.0, fz, mu)
    80|    var resultant: float = sqrt(force.x * force.x + force.z * force.z)
    81|    assert_lt(resultant, limit + 50.0, "Combined force within friction circle (with tolerance)")
    82|
    83|
    84|func test_force_scales_with_normal_load() -> void:
    85|    var f1: Vector3 = _tire.compute_force(0.0, 0.15, 1500.0, 0.9)
    86|    var f2: Vector3 = _tire.compute_force(0.0, 0.15, 3000.0, 0.9)
    87|    # Double the load, roughly double the peak force
    88|    assert_gt(absf(f2.z), absf(f1.z), "Force scales with normal load")
    89|```
    90|
    91|---
    92|
    93|## test_suspension.gd
    94|
    95|```gdscript
    96|extends GutTest
    97|
    98|var _susp: Suspension
    99|
   100|func before_each() -> void:
   101|    _susp = Suspension.new()
   102|    add_child_autofree(_susp)
   103|    _susp.set_spring_stiffness(25000.0)
   104|    _susp.set_damper_coefficient(2500.0)
   105|    _susp.set_rest_length(0.35)
   106|    _susp.set_max_travel(0.12)
   107|
   108|
   109|func test_zero_compression_produces_no_spring_force() -> void:
   110|    var force: float = _susp.compute_force(0.0, 0.0)
   111|    assert_almost_eq(force, 0.0, 1.0, "No force at zero compression")
   112|
   113|
   114|func test_spring_force_proportional_to_compression() -> void:
   115|    var force: float = _susp.compute_force(0.05, 0.0)
   116|    assert_almost_eq(force, 25000.0 * 0.05, 50.0, "Spring force = k * compression")
   117|
   118|
   119|func test_damper_resists_compression_velocity() -> void:
   120|    var force_static: float = _susp.compute_force(0.05, 0.0)
   121|    var force_compressing: float = _susp.compute_force(0.05, 0.5)
   122|    assert_gt(force_compressing, force_static, "Compressing damper adds positive force")
   123|
   124|
   125|func test_no_tension_at_full_extension() -> void:
   126|    # At zero compression with negative velocity (extending), force must be >= 0
   127|    var force: float = _susp.compute_force(0.0, -1.0)
   128|    assert_gte(force, 0.0, "Suspension cannot pull down")
   129|
   130|
   131|func test_compression_clamped_to_max_travel() -> void:
   132|    _susp.compute_force(0.5, 0.0)  # Way beyond max_travel of 0.12
   133|    assert_almost_eq(_susp.get_compression(), 0.12, 0.001, "Compression clamped to max_travel")
   134|```
   135|
   136|---
   137|
   138|## test_car_spec.gd
   139|
   140|```gdscript
   141|extends GutTest
   142|
   143|var _spec: CarSpec
   144|
   145|func before_each() -> void:
   146|    _spec = CarSpec.new()
   147|
   148|
   149|func test_mass_is_positive() -> void:
   150|    assert_gt(_spec.mass_kg, 0.0, "mass_kg must be positive")
   151|
   152|
   153|func test_gear_ratios_descend() -> void:
   154|    for i: int in range(_spec.gear_ratios.size() - 1):
   155|        assert_gt(_spec.gear_ratios[i], _spec.gear_ratios[i + 1],
   156|            "Each gear ratio should be lower than the previous")
   157|
   158|
   159|func test_redline_above_idle() -> void:
   160|    assert_gt(_spec.redline_rpm, _spec.idle_rpm, "Redline must be above idle")
   161|
   162|
   163|func test_weight_distribution_is_normalized() -> void:
   164|    assert_between(_spec.weight_distribution_front, 0.0, 1.0,
   165|        "Weight distribution must be in [0, 1]")
   166|
   167|
   168|func test_grip_mu_is_positive() -> void:
   169|    assert_gt(_spec.grip_mu, 0.0, "Grip mu must be positive")
   170|    assert_lte(_spec.grip_mu, 1.5, "Grip mu should be physically plausible (<= 1.5 for street tires)")
   171|```
   172|
   173|---
   174|
   175|## test_drivetrain.gd
   176|
   177|```gdscript
   178|extends GutTest
   179|
   180|var _dt: Drivetrain
   181|
   182|func before_each() -> void:
   183|    _dt = Drivetrain.new()
   184|    add_child_autofree(_dt)
   185|    _dt.spec = CarSpec.new()
   186|
   187|
   188|func test_rpm_stays_above_idle_at_rest() -> void:
   189|    _dt.update(1.0 / 240.0, 0.0, 0.0)
   190|    assert_gte(_dt.get_rpm(), _dt.spec.idle_rpm, "RPM never drops below idle")
   191|
   192|
   193|func test_upshift_increments_gear() -> void:
   194|    var initial_gear: int = _dt.get_gear()
   195|    _dt.request_upshift()
   196|    assert_eq(_dt.get_gear(), initial_gear + 1, "Upshift increments gear")
   197|
   198|
   199|func test_no_upshift_above_top_gear() -> void:
   200|    # Shift to top gear
   201|    for _i: int in _dt.spec.gear_ratios.size():
   202|        _dt.request_upshift()
   203|        _dt.update(1.0, 0.0, 0.0)  # Simulate shift time passing
   204|    var top_gear: int = _dt.get_gear()
   205|    _dt.request_upshift()
   206|    assert_eq(_dt.get_gear(), top_gear, "Cannot upshift above top gear")
   207|
   208|
   209|func test_torque_zero_during_shift() -> void:
   210|    _dt.request_upshift()
   211|    # Immediately query — should still be shifting
   212|    var torque: float = _dt.update(0.001, 50.0, 1.0)
   213|    assert_almost_eq(torque, 0.0, 1.0, "No torque during gear change")
   214|```
   215|
   216|---
   217|
   218|## test_aero_model.gd
   219|
   220|```gdscript
   221|extends GutTest
   222|
   223|var _aero: AeroModel
   224|
   225|func before_each() -> void:
   226|    _aero = AeroModel.new()
   227|    add_child_autofree(_aero)
   228|    _aero.spec = CarSpec.new()
   229|
   230|
   231|func test_drag_is_zero_at_rest() -> void:
   232|    var drag: Vector3 = _aero.compute_drag(Vector3.ZERO)
   233|    assert_almost_eq(drag.length(), 0.0, 0.1, "No drag at rest")
   234|
   235|
   236|func test_drag_increases_with_speed_squared() -> void:
   237|    var drag1: float = _aero.compute_drag(Vector3(10.0, 0, 0)).length()
   238|    var drag2: float = _aero.compute_drag(Vector3(20.0, 0, 0)).length()
   239|    assert_almost_eq(drag2 / drag1, 4.0, 0.1, "Drag scales with v²")
   240|
   241|
   242|func test_drag_opposes_velocity() -> void:
   243|    var vel: Vector3 = Vector3(30.0, 0, 0)
   244|    var drag: Vector3 = _aero.compute_drag(vel)
   245|    assert_lt(drag.x, 0.0, "Drag opposes forward velocity")
   246|
   247|
   248|func test_downforce_balance_sums_to_total() -> void:
   249|    _aero.compute_downforce(50.0)
   250|    var front: float = _aero.get_front_downforce()
   251|    var rear: float = _aero.get_rear_downforce()
   252|    assert_almost_eq(front + rear, _aero.get_downforce(), 0.1, "Downforce front + rear = total")
   253|```
   254|
   255|---
   256|
   257|## Running Tests
   258|
   259|```bash
   260|godot --headless --script addons/gut/gut_cmdln.gd -gdir=res://test/unit
   261|```
   262|
   263|All tests (including existing camera tests) should pass.
   264|
   265|---
   266|
   267|## Related
   268|
   269|- [[Step 12 - Debug Integration]] — final verification step
   270|- [[Vehicle Physics]] — back to hub
   271|
> [!warning] Legacy — Pre-MJIP Architecture
> This note describes the old VehicleController + Pacejka GDExtension approach. **MJIP supersedes this architecture.** Preserved for historical reference only. Do not implement from these notes without first reading [[MJIP — Overview]] and [[MJIP-Trackside Integration]].

     1|---
     2|title: "Step 07 - Drivetrain"
     3|aliases: ["Step 07 - Drivetrain"]
     4|linter-yaml-title-alias: "Step 07 - Drivetrain"
     5|tags:
     6|  - Trackside
     7|  - vehicle-physics
     8|  - tier-1
     9|  - gdscript
    10|  - drivetrain
    11|type: impl-step
    12|step: 7
    13|status: pending
    14|language: GDScript
    15|files-to-create:
    16|  - src/scripts/vehicle/drivetrain.gd
    17|created: 2026-02-26
    18|updated: 2026-02-26
    19|---
    20|
    21|# Step 07 - Drivetrain
    22|
    23|**Prerequisites:** [[Step 05 - CarSpec Resource]]
    24|**Estimated Complexity:** M
    25|
    26|---
    27|
    28|## What
    29|
    30|Implement engine RPM simulation, sequential gearbox, and torque delivery to the front driven wheels (FWD). `Drivetrain` is a GDScript `Node` — logic-only, no physics, no visual representation.
    31|
    32|---
    33|
    34|## drivetrain.gd
    35|
    36|```gdscript
    37|class_name Drivetrain
    38|extends Node
    39|## Engine, gearbox, and torque delivery for a FWD vehicle.
    40|## Manages engine RPM, gear selection, shift timing, and torque-to-wheel conversion.
    41|
    42|@export var spec: CarSpec
    43|
    44|# --- Signals ---
    45|signal gear_changed(gear: int)
    46|signal rev_limiter_hit(rpm: float)
    47|signal shift_started(from_gear: int, to_gear: int)
    48|
    49|# --- State ---
    50|var _current_gear: int = 1          ## 0 = reverse, 1–N = forward gears
    51|var _current_rpm: float = 0.0
    52|var _is_shifting: bool = false
    53|var _shift_timer: float = 0.0
    54|var _throttle: float = 0.0          ## 0.0–1.0, set by VehicleController
    55|var _clutch_engaged: bool = true
    56|
    57|# --- Public API ---
    58|
    59|## Called every physics tick by VehicleController.
    60|## @param delta           Physics delta (1/240 s).
    61|## @param drive_wheel_speed_rad_s  Average angular speed of the driven wheels.
    62|## @param throttle_input  Current throttle position [0, 1].
    63|## @return  Torque at the driven wheel pair (total, Newtons·metres).
    64|func update(delta: float, drive_wheel_speed_rad_s: float, throttle_input: float) -> float:
    65|    _throttle = throttle_input
    66|
    67|    if _is_shifting:
    68|        _shift_timer -= delta
    69|        if _shift_timer <= 0.0:
    70|            _is_shifting = false
    71|        return 0.0  ## No torque during gear change
    72|
    73|    # Engine RPM from wheel speed back-calculated through drivetrain.
    74|    var ratio: float = _get_current_total_ratio()
    75|    var wheel_derived_rpm: float = (drive_wheel_speed_rad_s * ratio * 60.0) / (2.0 * PI)
    76|
    77|    # Engine RPM is the higher of idle and wheel-derived RPM.
    78|    _current_rpm = maxf(wheel_derived_rpm, spec.idle_rpm)
    79|
    80|    # Rev limiter: hard cut above redline.
    81|    if _current_rpm >= spec.redline_rpm:
    82|        _current_rpm = spec.redline_rpm
    83|        rev_limiter_hit.emit(_current_rpm)
    84|        return 0.0
    85|
    86|    # Engine torque from curve at current RPM.
    87|    var engine_torque: float = _get_engine_torque_at_rpm(_current_rpm) * _throttle
    88|
    89|    # Wheel torque = engine torque × gear ratio × final drive.
    90|    return engine_torque * ratio
    91|
    92|
    93|## Request an upshift. Ignored if already in top gear or currently shifting.
    94|func request_upshift() -> void:
    95|    if _is_shifting or _current_gear >= spec.gear_ratios.size():
    96|        return
    97|    _start_shift(_current_gear, _current_gear + 1)
    98|
    99|
   100|## Request a downshift. Ignored if already in 1st gear or currently shifting.
   101|func request_downshift() -> void:
   102|    if _is_shifting or _current_gear <= 1:
   103|        return
   104|    _start_shift(_current_gear, _current_gear - 1)
   105|
   106|
   107|## Current engine RPM. For telemetry and HUD.
   108|func get_rpm() -> float:
   109|    return _current_rpm
   110|
   111|
   112|## Current gear (1-indexed forward). For HUD.
   113|func get_gear() -> int:
   114|    return _current_gear
   115|
   116|
   117|## Whether a gear change is in progress.
   118|func is_shifting() -> bool:
   119|    return _is_shifting
   120|
   121|# --- Private ---
   122|
   123|func _get_current_total_ratio() -> float:
   124|    if _current_gear == 0:
   125|        return spec.reverse_ratio * spec.final_drive_ratio
   126|    # gear_ratios is 0-indexed; gear 1 = index 0.
   127|    return spec.gear_ratios[_current_gear - 1] * spec.final_drive_ratio
   128|
   129|
   130|func _get_engine_torque_at_rpm(rpm: float) -> float:
   131|    if not spec.torque_curve:
   132|        return spec.max_torque_Nm
   133|    var rpm_fraction: float = clampf((rpm - spec.idle_rpm) / (spec.redline_rpm - spec.idle_rpm), 0.0, 1.0)
   134|    return spec.torque_curve.sample(rpm_fraction) * spec.max_torque_Nm
   135|
   136|
   137|func _start_shift(from_gear: int, to_gear: int) -> void:
   138|    var prev: int = _current_gear
   139|    _current_gear = to_gear
   140|    _is_shifting = true
   141|    _shift_timer = spec.shift_time_s
   142|    shift_started.emit(prev, to_gear)
   143|    gear_changed.emit(to_gear)
   144|```
   145|
   146|---
   147|
   148|## Notes
   149|
   150|- **RPM model is approximate** — wheel speed drives RPM directly through the gear ratio. A full rotating mass model (engine inertia, clutch slip) is Tier 2. For Tier 1 this is indistinguishable to the driver at 240 Hz.
   151|- **FWD torque delivery** — `VehicleController` takes the torque returned by `update()` and splits it evenly between `TireFL` and `TireFR` as a longitudinal force. Rear wheels receive zero drive torque.
   152|- **`drive_wheel_speed_rad_s`** — `VehicleController` computes this as the average angular speed of the two front wheels: `wheel_surface_speed / spec.tire_radius_m`.
   153|- **No auto-gearbox in Tier 1** — manual sequential only. The AI agent and player both call `request_upshift()`/`request_downshift()` directly.
   154|- **Rev limiter is a hard cut** — no soft limiter, no bouncing. Fine for Tier 1. Tier 2 may add a fuel-cut soft limiter.
   155|
   156|---
   157|
   158|## Related
   159|
   160|- [[Step 05 - CarSpec Resource]] — `gear_ratios`, `torque_curve`, `redline_rpm`
   161|- [[Step 08 - VehicleController]] — calls `update()` each tick, passes drive torque to tire model
   162|- [[Vehicle Physics]] — back to hub
   163|
---
title: "Step 07 - Drivetrain"
aliases: ["Step 07 - Drivetrain"]
linter-yaml-title-alias: "Step 07 - Drivetrain"
tags:
  - Synadrive
  - vehicle-physics
  - tier-1
  - gdscript
  - drivetrain
type: impl-step
step: 7
status: pending
language: GDScript
files-to-create:
  - src/scripts/vehicle/drivetrain.gd
created: 2026-02-26
updated: 2026-02-26
---

# Step 07 - Drivetrain

**Prerequisites:** [[Step 05 - CarSpec Resource]]
**Estimated Complexity:** M

---

## What

Implement engine RPM simulation, sequential gearbox, and torque delivery to the front driven wheels (FWD). `Drivetrain` is a GDScript `Node` — logic-only, no physics, no visual representation.

---

## drivetrain.gd

```gdscript
class_name Drivetrain
extends Node
## Engine, gearbox, and torque delivery for a FWD vehicle.
## Manages engine RPM, gear selection, shift timing, and torque-to-wheel conversion.

@export var spec: CarSpec

# --- Signals ---
signal gear_changed(gear: int)
signal rev_limiter_hit(rpm: float)
signal shift_started(from_gear: int, to_gear: int)

# --- State ---
var _current_gear: int = 1          ## 0 = reverse, 1–N = forward gears
var _current_rpm: float = 0.0
var _is_shifting: bool = false
var _shift_timer: float = 0.0
var _throttle: float = 0.0          ## 0.0–1.0, set by VehicleController
var _clutch_engaged: bool = true

# --- Public API ---

## Called every physics tick by VehicleController.
## @param delta           Physics delta (1/240 s).
## @param drive_wheel_speed_rad_s  Average angular speed of the driven wheels.
## @param throttle_input  Current throttle position [0, 1].
## @return  Torque at the driven wheel pair (total, Newtons·metres).
func update(delta: float, drive_wheel_speed_rad_s: float, throttle_input: float) -> float:
    _throttle = throttle_input

    if _is_shifting:
        _shift_timer -= delta
        if _shift_timer <= 0.0:
            _is_shifting = false
        return 0.0  ## No torque during gear change

    # Engine RPM from wheel speed back-calculated through drivetrain.
    var ratio: float = _get_current_total_ratio()
    var wheel_derived_rpm: float = (drive_wheel_speed_rad_s * ratio * 60.0) / (2.0 * PI)

    # Engine RPM is the higher of idle and wheel-derived RPM.
    _current_rpm = maxf(wheel_derived_rpm, spec.idle_rpm)

    # Rev limiter: hard cut above redline.
    if _current_rpm >= spec.redline_rpm:
        _current_rpm = spec.redline_rpm
        rev_limiter_hit.emit(_current_rpm)
        return 0.0

    # Engine torque from curve at current RPM.
    var engine_torque: float = _get_engine_torque_at_rpm(_current_rpm) * _throttle

    # Wheel torque = engine torque × gear ratio × final drive.
    return engine_torque * ratio


## Request an upshift. Ignored if already in top gear or currently shifting.
func request_upshift() -> void:
    if _is_shifting or _current_gear >= spec.gear_ratios.size():
        return
    _start_shift(_current_gear, _current_gear + 1)


## Request a downshift. Ignored if already in 1st gear or currently shifting.
func request_downshift() -> void:
    if _is_shifting or _current_gear <= 1:
        return
    _start_shift(_current_gear, _current_gear - 1)


## Current engine RPM. For telemetry and HUD.
func get_rpm() -> float:
    return _current_rpm


## Current gear (1-indexed forward). For HUD.
func get_gear() -> int:
    return _current_gear


## Whether a gear change is in progress.
func is_shifting() -> bool:
    return _is_shifting

# --- Private ---

func _get_current_total_ratio() -> float:
    if _current_gear == 0:
        return spec.reverse_ratio * spec.final_drive_ratio
    # gear_ratios is 0-indexed; gear 1 = index 0.
    return spec.gear_ratios[_current_gear - 1] * spec.final_drive_ratio


func _get_engine_torque_at_rpm(rpm: float) -> float:
    if not spec.torque_curve:
        return spec.max_torque_Nm
    var rpm_fraction: float = clampf((rpm - spec.idle_rpm) / (spec.redline_rpm - spec.idle_rpm), 0.0, 1.0)
    return spec.torque_curve.sample(rpm_fraction) * spec.max_torque_Nm


func _start_shift(from_gear: int, to_gear: int) -> void:
    var prev: int = _current_gear
    _current_gear = to_gear
    _is_shifting = true
    _shift_timer = spec.shift_time_s
    shift_started.emit(prev, to_gear)
    gear_changed.emit(to_gear)
```

---

## Notes

- **RPM model is approximate** — wheel speed drives RPM directly through the gear ratio. A full rotating mass model (engine inertia, clutch slip) is Tier 2. For Tier 1 this is indistinguishable to the driver at 240 Hz.
- **FWD torque delivery** — `VehicleController` takes the torque returned by `update()` and splits it evenly between `TireFL` and `TireFR` as a longitudinal force. Rear wheels receive zero drive torque.
- **`drive_wheel_speed_rad_s`** — `VehicleController` computes this as the average angular speed of the two front wheels: `wheel_surface_speed / spec.tire_radius_m`.
- **No auto-gearbox in Tier 1** — manual sequential only. The AI agent and player both call `request_upshift()`/`request_downshift()` directly.
- **Rev limiter is a hard cut** — no soft limiter, no bouncing. Fine for Tier 1. Tier 2 may add a fuel-cut soft limiter.

---

## Related

- [[Step 05 - CarSpec Resource]] — `gear_ratios`, `torque_curve`, `redline_rpm`
- [[Step 08 - VehicleController]] — calls `update()` each tick, passes drive torque to tire model
- [[Vehicle Physics]] — back to hub

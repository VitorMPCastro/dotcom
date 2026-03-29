---
title: "Step 09 - GUIDE Input Resources"
aliases: ["Step 09 - GUIDE Input Resources"]
linter-yaml-title-alias: "Step 09 - GUIDE Input Resources"
tags:
  - Synadrive
  - vehicle-physics
  - tier-1
  - input
  - guide
type: impl-step
step: 9
status: pending
language: Resources
files-to-create:
  - src/resources/input/actions/vehicle/throttle.tres
  - src/resources/input/actions/vehicle/brake.tres
  - src/resources/input/actions/vehicle/steer.tres
  - src/resources/input/actions/vehicle/gear_up.tres
  - src/resources/input/actions/vehicle/gear_down.tres
  - src/resources/input/actions/vehicle/handbrake.tres
  - src/resources/input/contexts/vehicle_driving_context.tres
created: 2026-02-26
updated: 2026-02-26
---

# Step 09 - GUIDE Input Resources

**Prerequisites:** None (can be done in parallel with Steps 2–4)
**Estimated Complexity:** S

---

## What

Create GUIDE action and mapping context resources for vehicle driving. All input is defined as `.tres` files — no hardcoded input mappings in code. `VehicleController` reads from these GUIDE actions each tick.

---

## Resource Structure

```
resources/input/
  actions/
    vehicle/
      throttle.tres       ← GUIDEAction, analog [0,1]
      brake.tres          ← GUIDEAction, analog [0,1]
      steer.tres          ← GUIDEAction, analog [-1,1]
      gear_up.tres        ← GUIDEAction, digital (pressed)
      gear_down.tres      ← GUIDEAction, digital (pressed)
      handbrake.tres      ← GUIDEAction, digital (held)
  contexts/
    vehicle_driving_context.tres  ← GUIDEMappingContext
```

---

## Creating Resources (Godot Editor)

Create all resources via **FileSystem dock → right-click → New Resource**:

### Analog Actions (throttle, brake, steer)

1. Create resource of type `GUIDEAction`.
2. Set `action_type` to `Analog1D`.
3. For `throttle`: add gamepad `Right Trigger` + keyboard `W` (positive axis).
4. For `brake`: add gamepad `Left Trigger` + keyboard `S`.
5. For `steer`: add gamepad `Left Stick X` + composite keyboard `A` (negative) / `D` (positive).
6. Save as the respective `.tres`.

### Digital Actions (gear_up, gear_down, handbrake)

1. Create resource of type `GUIDEAction`.
2. Set `action_type` to `Bool`.
3. For `gear_up`: gamepad `Right Bumper` + keyboard `E`.
4. For `gear_down`: gamepad `Left Bumper` + keyboard `Q`.
5. For `handbrake`: gamepad `A` button + keyboard `Space`. Set to `held` (not `just_pressed`).

### Vehicle Driving Context

1. Create resource of type `GUIDEMappingContext`.
2. Add all 6 actions to the context.
3. Save as `vehicle_driving_context.tres`.

---

## Reading in VehicleController

```gdscript
# At top of vehicle_controller.gd:
@export var action_throttle: GUIDEAction
@export var action_brake: GUIDEAction
@export var action_steer: GUIDEAction
@export var action_gear_up: GUIDEAction
@export var action_gear_down: GUIDEAction
@export var action_handbrake: GUIDEAction

func _physics_process(delta: float) -> void:
    _throttle = action_throttle.value_axis_1d
    _brake = action_brake.value_axis_1d
    _steer = action_steer.value_axis_1d
    _gear_up_pressed = action_gear_up.is_just_pressed()
    _gear_down_pressed = action_gear_down.is_just_pressed()
    # ...
```

---

## Activating the Context

`VehicleController._ready()` should activate the context:

```gdscript
@export var driving_context: GUIDEMappingContext

func _ready() -> void:
    GUIDE.enable_mapping_context(driving_context)
```

Deactivate when the player exits the vehicle:

```gdscript
GUIDE.disable_mapping_context(driving_context)
```

---

## Notes

- **Never read `Input.*` directly in vehicle logic** — always go through GUIDE actions. This ensures remappability, controller hot-swap, and future accessibility features.
- **The debug test plane scene** doesn't need to change — GUIDE context is activated by the vehicle itself when ready.
- **Gamepad calibration:** GUIDE handles deadzone configuration. For the analog throttle/brake, consider a `0.05` deadzone to prevent creep on cheap controllers.

---

## Related

- [[Step 08 - VehicleController]] — reads from these GUIDE actions each tick
- [[Step 10 - Scene Assembly]] — assigns action resources as inspector exports
- [[Vehicle Physics]] — back to hub

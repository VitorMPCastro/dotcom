> [!warning] Legacy — Pre-MJIP Architecture
> This note describes the old VehicleController + Pacejka GDExtension approach. **MJIP supersedes this architecture.** Preserved for historical reference only. Do not implement from these notes without first reading [[MJIP — Overview]] and [[MJIP-Trackside Integration]].

     1|---
     2|title: "Step 09 - GUIDE Input Resources"
     3|aliases: ["Step 09 - GUIDE Input Resources"]
     4|linter-yaml-title-alias: "Step 09 - GUIDE Input Resources"
     5|tags:
     6|  - Trackside
     7|  - vehicle-physics
     8|  - tier-1
     9|  - input
    10|  - guide
    11|type: impl-step
    12|step: 9
    13|status: pending
    14|language: Resources
    15|files-to-create:
    16|  - src/resources/input/actions/vehicle/throttle.tres
    17|  - src/resources/input/actions/vehicle/brake.tres
    18|  - src/resources/input/actions/vehicle/steer.tres
    19|  - src/resources/input/actions/vehicle/gear_up.tres
    20|  - src/resources/input/actions/vehicle/gear_down.tres
    21|  - src/resources/input/actions/vehicle/handbrake.tres
    22|  - src/resources/input/contexts/vehicle_driving_context.tres
    23|created: 2026-02-26
    24|updated: 2026-02-26
    25|---
    26|
    27|# Step 09 - GUIDE Input Resources
    28|
    29|**Prerequisites:** None (can be done in parallel with Steps 2–4)
    30|**Estimated Complexity:** S
    31|
    32|---
    33|
    34|## What
    35|
    36|Create GUIDE action and mapping context resources for vehicle driving. All input is defined as `.tres` files — no hardcoded input mappings in code. `VehicleController` reads from these GUIDE actions each tick.
    37|
    38|---
    39|
    40|## Resource Structure
    41|
    42|```
    43|resources/input/
    44|  actions/
    45|    vehicle/
    46|      throttle.tres       ← GUIDEAction, analog [0,1]
    47|      brake.tres          ← GUIDEAction, analog [0,1]
    48|      steer.tres          ← GUIDEAction, analog [-1,1]
    49|      gear_up.tres        ← GUIDEAction, digital (pressed)
    50|      gear_down.tres      ← GUIDEAction, digital (pressed)
    51|      handbrake.tres      ← GUIDEAction, digital (held)
    52|  contexts/
    53|    vehicle_driving_context.tres  ← GUIDEMappingContext
    54|```
    55|
    56|---
    57|
    58|## Creating Resources (Godot Editor)
    59|
    60|Create all resources via **FileSystem dock → right-click → New Resource**:
    61|
    62|### Analog Actions (throttle, brake, steer)
    63|
    64|1. Create resource of type `GUIDEAction`.
    65|2. Set `action_type` to `Analog1D`.
    66|3. For `throttle`: add gamepad `Right Trigger` + keyboard `W` (positive axis).
    67|4. For `brake`: add gamepad `Left Trigger` + keyboard `S`.
    68|5. For `steer`: add gamepad `Left Stick X` + composite keyboard `A` (negative) / `D` (positive).
    69|6. Save as the respective `.tres`.
    70|
    71|### Digital Actions (gear_up, gear_down, handbrake)
    72|
    73|1. Create resource of type `GUIDEAction`.
    74|2. Set `action_type` to `Bool`.
    75|3. For `gear_up`: gamepad `Right Bumper` + keyboard `E`.
    76|4. For `gear_down`: gamepad `Left Bumper` + keyboard `Q`.
    77|5. For `handbrake`: gamepad `A` button + keyboard `Space`. Set to `held` (not `just_pressed`).
    78|
    79|### Vehicle Driving Context
    80|
    81|1. Create resource of type `GUIDEMappingContext`.
    82|2. Add all 6 actions to the context.
    83|3. Save as `vehicle_driving_context.tres`.
    84|
    85|---
    86|
    87|## Reading in VehicleController
    88|
    89|```gdscript
    90|# At top of vehicle_controller.gd:
    91|@export var action_throttle: GUIDEAction
    92|@export var action_brake: GUIDEAction
    93|@export var action_steer: GUIDEAction
    94|@export var action_gear_up: GUIDEAction
    95|@export var action_gear_down: GUIDEAction
    96|@export var action_handbrake: GUIDEAction
    97|
    98|func _physics_process(delta: float) -> void:
    99|    _throttle = action_throttle.value_axis_1d
   100|    _brake = action_brake.value_axis_1d
   101|    _steer = action_steer.value_axis_1d
   102|    _gear_up_pressed = action_gear_up.is_just_pressed()
   103|    _gear_down_pressed = action_gear_down.is_just_pressed()
   104|    # ...
   105|```
   106|
   107|---
   108|
   109|## Activating the Context
   110|
   111|`VehicleController._ready()` should activate the context:
   112|
   113|```gdscript
   114|@export var driving_context: GUIDEMappingContext
   115|
   116|func _ready() -> void:
   117|    GUIDE.enable_mapping_context(driving_context)
   118|```
   119|
   120|Deactivate when the player exits the vehicle:
   121|
   122|```gdscript
   123|GUIDE.disable_mapping_context(driving_context)
   124|```
   125|
   126|---
   127|
   128|## Notes
   129|
   130|- **Never read `Input.*` directly in vehicle logic** — always go through GUIDE actions. This ensures remappability, controller hot-swap, and future accessibility features.
   131|- **The debug test plane scene** doesn't need to change — GUIDE context is activated by the vehicle itself when ready.
   132|- **Gamepad calibration:** GUIDE handles deadzone configuration. For the analog throttle/brake, consider a `0.05` deadzone to prevent creep on cheap controllers.
   133|
   134|---
   135|
   136|## Related
   137|
   138|- [[Step 08 - VehicleController]] — reads from these GUIDE actions each tick
   139|- [[Step 10 - Scene Assembly]] — assigns action resources as inspector exports
   140|- [[Vehicle Physics]] — back to hub
   141|
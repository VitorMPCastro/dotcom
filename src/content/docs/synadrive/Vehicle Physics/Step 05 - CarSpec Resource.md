---
title: "Step 05 - CarSpec Resource"
aliases: ["Step 05 - CarSpec Resource"]
linter-yaml-title-alias: "Step 05 - CarSpec Resource"
tags:
  - Synadrive
  - vehicle-physics
  - tier-1
  - gdscript
  - resource
type: impl-step
step: 5
status: pending
language: GDScript
files-to-create:
  - src/scripts/vehicle/car_spec.gd
  - src/resources/vehicles/hatchback_spec.tres
created: 2026-02-26
updated: 2026-02-26
---

# Step 05 - CarSpec Resource

**Prerequisites:** None (can be done in parallel with Steps 2–4)
**Estimated Complexity:** S

---

## What

Create the `CarSpec` `Resource` subclass — the data-driven container for all static vehicle properties. Every tunable constant lives here; no magic numbers in the physics scripts. Create a concrete `hatchback_spec.tres` instance with FWD hatchback values.

---

## car_spec.gd

```gdscript
class_name CarSpec
extends Resource
## Static vehicle specification data. All tunable constants live here.
## Assign a .tres instance in the VehicleController @export.

# --- Mass & Geometry ---
@export_group("Mass & Geometry")
@export var mass_kg: float = 1200.0
@export var cg_height_m: float = 0.50           ## Centre of gravity height above ground
@export var wheelbase_m: float = 2.58            ## Distance front-to-rear axle centreline
@export var track_width_front_m: float = 1.52    ## Left-to-right wheel centre distance (front)
@export var track_width_rear_m: float = 1.48     ## Left-to-right wheel centre distance (rear)
@export var weight_distribution_front: float = 0.62  ## % of weight on front axle (FWD biased)

# --- Tire ---
@export_group("Tire")
@export var tire_radius_m: float = 0.31            ## Rolling radius (195/65R15)
@export var pacejka_lat_B: float = 10.0
@export var pacejka_lat_C: float = 1.3
@export var pacejka_lat_D: float = 1.0            ## Normalized peak; multiplied by Fz*mu
@export var pacejka_lat_E: float = -1.0
@export var pacejka_lon_B: float = 11.0
@export var pacejka_lon_C: float = 1.65
@export var pacejka_lon_D: float = 1.0
@export var pacejka_lon_E: float = 0.0
@export var grip_mu: float = 0.9                  ## Base friction coefficient (dry asphalt)

# --- Suspension (shared per corner; Tier 2 will split front/rear) ---
@export_group("Suspension")
@export var spring_stiffness_N_m: float = 25000.0
@export var damper_N_s_m: float = 2500.0
@export var suspension_rest_length_m: float = 0.35
@export var suspension_max_travel_m: float = 0.12

# --- Engine ---
@export_group("Engine")
@export var max_torque_Nm: float = 200.0          ## Peak engine torque
@export var max_power_kW: float = 97.0            ## ~130 hp — 1.6L turbo hatchback
@export var redline_rpm: float = 7200.0
@export var idle_rpm: float = 850.0
@export var engine_inertia: float = 0.15          ## kg·m² (rotating mass)
## Normalized torque curve. X = RPM fraction [0,1], Y = torque fraction [0,1].
@export var torque_curve: Curve

# --- Gearbox ---
@export_group("Gearbox")
@export var gear_ratios: Array[float] = [3.45, 2.10, 1.38, 1.03, 0.82]
@export var reverse_ratio: float = 3.67
@export var final_drive_ratio: float = 3.94
@export var shift_time_s: float = 0.18            ## Seconds of neutral / cut torque on upshift

# --- Aerodynamics ---
@export_group("Aerodynamics")
@export var drag_coefficient: float = 0.30        ## Cd (typical for small hatchback)
@export var frontal_area_m2: float = 2.15         ## m²
@export var downforce_coefficient: float = 0.05   ## Small; this is a street car
@export var aero_balance_front: float = 0.50      ## % of downforce on front axle

# --- Driving Assists ---
@export_group("Driving Assists")
@export var abs_enabled: bool = true
@export var abs_slip_threshold: float = 0.15      ## Brake release if |slip_ratio| > this
@export var tcs_enabled: bool = true
@export var tcs_slip_threshold: float = 0.12      ## Throttle cut if driven wheel slip > this
```

---

## hatchback_spec.tres

Create the `.tres` file **via the Godot editor**:

1. In the FileSystem dock, right-click `resources/vehicles/` → **New Resource** → select `CarSpec`.
2. Save as `hatchback_spec.tres`.
3. In the Inspector, the `@export` groups populate with the default values from the script above.
4. Set `torque_curve`: create a new `Curve`, add points to represent a typical 1.6T: flat from ~2000–5500 RPM with a slight drop above 6000 RPM.

Alternatively, create `hatchback_spec.tres` as a text file:

```ini
[gd_resource type="Resource" script_class="CarSpec" load_steps=3 format=3]

[ext_resource type="Script" path="res://scripts/vehicle/car_spec.gd" id="1"]
[sub_resource type="Curve" id="2"]
min_value = 0.0
max_value = 1.0
_data = [Vector2(0, 0.1), 0, 0, 0, 0, Vector2(0.25, 0.85), 0, 0, 0, 0, Vector2(0.55, 1.0), 0, 0, 0, 0, Vector2(0.75, 0.98), 0, 0, 0, 0, Vector2(1.0, 0.72), 0, 0, 0, 0]

[resource]
script = ExtResource("1")
torque_curve = SubResource("2")
```

---

## Notes

- **No magic numbers:** `VehicleController` and all sub-systems read constants exclusively from `CarSpec`. Never hardcode a value in a physics script.
- **Per-corner suspension (Tier 2):** Currently `spring_stiffness_N_m` is one value shared for all four corners. Tier 2 will split into `spring_stiffness_front_N_m` / `spring_stiffness_rear_N_m` when anti-roll bars are added.
- **Torque curve:** The `Curve` resource uses normalized X (0 = idle, 1 = redline). `Drivetrain.get_engine_torque_at_rpm()` converts RPM to a `[0,1]` fraction and samples the curve.
- **`weight_distribution_front = 0.62`:** A FWD hatchback with the engine over the front axle has more than 50% weight up front. This value feeds the weight transfer and static axle load calculations.

---

## Related

- [[Step 06 - AeroModel]] — reads `drag_coefficient`, `frontal_area_m2`, `downforce_coefficient`
- [[Step 07 - Drivetrain]] — reads `gear_ratios`, `torque_curve`, `max_torque_Nm`
- [[Step 08 - VehicleController]] — reads everything
- [[Vehicle Physics]] — back to hub

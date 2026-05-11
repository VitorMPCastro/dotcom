> [!warning] Legacy — Pre-MJIP Architecture
> This note describes the old VehicleController + Pacejka GDExtension approach. **MJIP supersedes this architecture.** Preserved for historical reference only. Do not implement from these notes without first reading [[MJIP — Overview]] and [[MJIP-Trackside Integration]].

     1|---
     2|title: "Step 05 - CarSpec Resource"
     3|aliases: ["Step 05 - CarSpec Resource"]
     4|linter-yaml-title-alias: "Step 05 - CarSpec Resource"
     5|tags:
     6|  - Trackside
     7|  - vehicle-physics
     8|  - tier-1
     9|  - gdscript
    10|  - resource
    11|type: impl-step
    12|step: 5
    13|status: pending
    14|language: GDScript
    15|files-to-create:
    16|  - src/scripts/vehicle/car_spec.gd
    17|  - src/resources/vehicles/hatchback_spec.tres
    18|created: 2026-02-26
    19|updated: 2026-02-26
    20|---
    21|
    22|# Step 05 - CarSpec Resource
    23|
    24|**Prerequisites:** None (can be done in parallel with Steps 2–4)
    25|**Estimated Complexity:** S
    26|
    27|---
    28|
    29|## What
    30|
    31|Create the `CarSpec` `Resource` subclass — the data-driven container for all static vehicle properties. Every tunable constant lives here; no magic numbers in the physics scripts. Create a concrete `hatchback_spec.tres` instance with FWD hatchback values.
    32|
    33|---
    34|
    35|## car_spec.gd
    36|
    37|```gdscript
    38|class_name CarSpec
    39|extends Resource
    40|## Static vehicle specification data. All tunable constants live here.
    41|## Assign a .tres instance in the VehicleController @export.
    42|
    43|# --- Mass & Geometry ---
    44|@export_group("Mass & Geometry")
    45|@export var mass_kg: float = 1200.0
    46|@export var cg_height_m: float = 0.50           ## Centre of gravity height above ground
    47|@export var wheelbase_m: float = 2.58            ## Distance front-to-rear axle centreline
    48|@export var track_width_front_m: float = 1.52    ## Left-to-right wheel centre distance (front)
    49|@export var track_width_rear_m: float = 1.48     ## Left-to-right wheel centre distance (rear)
    50|@export var weight_distribution_front: float = 0.62  ## % of weight on front axle (FWD biased)
    51|
    52|# --- Tire ---
    53|@export_group("Tire")
    54|@export var tire_radius_m: float = 0.31            ## Rolling radius (195/65R15)
    55|@export var pacejka_lat_B: float = 10.0
    56|@export var pacejka_lat_C: float = 1.3
    57|@export var pacejka_lat_D: float = 1.0            ## Normalized peak; multiplied by Fz*mu
    58|@export var pacejka_lat_E: float = -1.0
    59|@export var pacejka_lon_B: float = 11.0
    60|@export var pacejka_lon_C: float = 1.65
    61|@export var pacejka_lon_D: float = 1.0
    62|@export var pacejka_lon_E: float = 0.0
    63|@export var grip_mu: float = 0.9                  ## Base friction coefficient (dry asphalt)
    64|
    65|# --- Suspension (shared per corner; Tier 2 will split front/rear) ---
    66|@export_group("Suspension")
    67|@export var spring_stiffness_N_m: float = 25000.0
    68|@export var damper_N_s_m: float = 2500.0
    69|@export var suspension_rest_length_m: float = 0.35
    70|@export var suspension_max_travel_m: float = 0.12
    71|
    72|# --- Engine ---
    73|@export_group("Engine")
    74|@export var max_torque_Nm: float = 200.0          ## Peak engine torque
    75|@export var max_power_kW: float = 97.0            ## ~130 hp — 1.6L turbo hatchback
    76|@export var redline_rpm: float = 7200.0
    77|@export var idle_rpm: float = 850.0
    78|@export var engine_inertia: float = 0.15          ## kg·m² (rotating mass)
    79|## Normalized torque curve. X = RPM fraction [0,1], Y = torque fraction [0,1].
    80|@export var torque_curve: Curve
    81|
    82|# --- Gearbox ---
    83|@export_group("Gearbox")
    84|@export var gear_ratios: Array[float] = [3.45, 2.10, 1.38, 1.03, 0.82]
    85|@export var reverse_ratio: float = 3.67
    86|@export var final_drive_ratio: float = 3.94
    87|@export var shift_time_s: float = 0.18            ## Seconds of neutral / cut torque on upshift
    88|
    89|# --- Aerodynamics ---
    90|@export_group("Aerodynamics")
    91|@export var drag_coefficient: float = 0.30        ## Cd (typical for small hatchback)
    92|@export var frontal_area_m2: float = 2.15         ## m²
    93|@export var downforce_coefficient: float = 0.05   ## Small; this is a street car
    94|@export var aero_balance_front: float = 0.50      ## % of downforce on front axle
    95|
    96|# --- Driving Assists ---
    97|@export_group("Driving Assists")
    98|@export var abs_enabled: bool = true
    99|@export var abs_slip_threshold: float = 0.15      ## Brake release if |slip_ratio| > this
   100|@export var tcs_enabled: bool = true
   101|@export var tcs_slip_threshold: float = 0.12      ## Throttle cut if driven wheel slip > this
   102|```
   103|
   104|---
   105|
   106|## hatchback_spec.tres
   107|
   108|Create the `.tres` file **via the Godot editor**:
   109|
   110|1. In the FileSystem dock, right-click `resources/vehicles/` → **New Resource** → select `CarSpec`.
   111|2. Save as `hatchback_spec.tres`.
   112|3. In the Inspector, the `@export` groups populate with the default values from the script above.
   113|4. Set `torque_curve`: create a new `Curve`, add points to represent a typical 1.6T: flat from ~2000–5500 RPM with a slight drop above 6000 RPM.
   114|
   115|Alternatively, create `hatchback_spec.tres` as a text file:
   116|
   117|```ini
   118|[gd_resource type="Resource" script_class="CarSpec" load_steps=3 format=3]
   119|
   120|[ext_resource type="Script" path="res://scripts/vehicle/car_spec.gd" id="1"]
   121|[sub_resource type="Curve" id="2"]
   122|min_value = 0.0
   123|max_value = 1.0
   124|_data = [Vector2(0, 0.1), 0, 0, 0, 0, Vector2(0.25, 0.85), 0, 0, 0, 0, Vector2(0.55, 1.0), 0, 0, 0, 0, Vector2(0.75, 0.98), 0, 0, 0, 0, Vector2(1.0, 0.72), 0, 0, 0, 0]
   125|
   126|[resource]
   127|script = ExtResource("1")
   128|torque_curve = SubResource("2")
   129|```
   130|
   131|---
   132|
   133|## Notes
   134|
   135|- **No magic numbers:** `VehicleController` and all sub-systems read constants exclusively from `CarSpec`. Never hardcode a value in a physics script.
   136|- **Per-corner suspension (Tier 2):** Currently `spring_stiffness_N_m` is one value shared for all four corners. Tier 2 will split into `spring_stiffness_front_N_m` / `spring_stiffness_rear_N_m` when anti-roll bars are added.
   137|- **Torque curve:** The `Curve` resource uses normalized X (0 = idle, 1 = redline). `Drivetrain.get_engine_torque_at_rpm()` converts RPM to a `[0,1]` fraction and samples the curve.
   138|- **`weight_distribution_front = 0.62`:** A FWD hatchback with the engine over the front axle has more than 50% weight up front. This value feeds the weight transfer and static axle load calculations.
   139|
   140|---
   141|
   142|## Related
   143|
   144|- [[Step 06 - AeroModel]] — reads `drag_coefficient`, `frontal_area_m2`, `downforce_coefficient`
   145|- [[Step 07 - Drivetrain]] — reads `gear_ratios`, `torque_curve`, `max_torque_Nm`
   146|- [[Step 08 - VehicleController]] — reads everything
   147|- [[Vehicle Physics]] — back to hub
   148|
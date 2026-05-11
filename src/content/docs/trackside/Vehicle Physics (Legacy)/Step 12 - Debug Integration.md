> [!warning] Legacy — Pre-MJIP Architecture
> This note describes the old VehicleController + Pacejka GDExtension approach. **MJIP supersedes this architecture.** Preserved for historical reference only. Do not implement from these notes without first reading [[MJIP — Overview]] and [[MJIP-Trackside Integration]].

     1|---
     2|title: "Step 12 - Debug Integration"
     3|aliases: ["Step 12 - Debug Integration"]
     4|linter-yaml-title-alias: "Step 12 - Debug Integration"
     5|tags:
     6|  - Trackside
     7|  - vehicle-physics
     8|  - tier-1
     9|  - debug
    10|type: impl-step
    11|step: 12
    12|status: pending
    13|language: Config
    14|files-to-create:
    15|  - src/scenes/debug/infinite_plane.tscn (modify)
    16|created: 2026-02-26
    17|updated: 2026-02-26
    18|---
    19|
    20|# Step 12 - Debug Integration
    21|
    22|**Prerequisites:** [[Step 10 - Scene Assembly]], [[Step 11 - GUT Tests]]
    23|**Estimated Complexity:** S
    24|
    25|---
    26|
    27|## What
    28|
    29|Wire the finished `vehicle_hatchback.tscn` into the existing debug harness and run the full verification checklist. No new code — this step is about integration, tuning, and sanity checking in a running environment.
    30|
    31|---
    32|
    33|## Wire to debug_test_plane
    34|
    35|The existing `debug_test_plane.gd` has a `vehicle_scene: PackedScene` export ready and waiting. No code changes needed.
    36|
    37|1. Open `scenes/debug/infinite_plane.tscn` in the editor.
    38|2. In the Inspector for the `DebugTestPlane` node, set `vehicle_scene` to `res://scenes/vehicles/vehicle_hatchback.tscn`.
    39|3. Run the scene (F5 or play button).
    40|
    41|---
    42|
    43|## Verification Checklist
    44|
    45|### Stability
    46|
    47|- [ ] Car spawns on the plane without falling through or exploding.
    48|- [ ] Car sits at rest without drifting, oscillating, or sinking.
    49|- [ ] No physics errors in the Output log.
    50|- [ ] Suspension compression values visible in debug overlay are non-zero at rest (~equal front/rear for a level spawn).
    51|
    52|### Basic Dynamics
    53|
    54|- [ ] Throttle input → car accelerates forward.
    55|- [ ] Brake input → car decelerates.
    56|- [ ] Steer input → car turns. Turn radius feels plausible for a hatchback.
    57|- [ ] RPM climbs with speed. Rev limiter cuts torque at redline (audible cut or telemetry indicator).
    58|- [ ] Gear up/down changes gear. `Drivetrain.gear_changed` signal emits (visible in debug).
    59|
    60|### Physics Realism (rough sanity checks)
    61|
    62|| Test | Expected |
    63||---|---|
    64|| 0–100 km/h time | ~9–11 seconds for a 130 hp hatchback |
    65|| Braking from 100 km/h | ~40–50 m to stop on dry asphalt |
    66|| Top speed (1st gear) | Car should hit rev limiter around 35–45 km/h in 1st |
    67|| Body roll in corner | Visible (outer suspension compresses, inner extends) |
    68|| Weight transfer on brake | Front suspension dips, rear rises |
    69|
    70|These don't need to be perfect — they just shouldn't be wildly wrong (e.g., 0–100 in 1 second or 100 km/h taking 30 seconds).
    71|
    72|### Input
    73|
    74|- [ ] Keyboard input (W/A/S/D, E/Q) works.
    75|- [ ] If gamepad connected: analog throttle/brake/steer responds correctly with no deadzone creep.
    76|
    77|### Respawn
    78|
    79|- [ ] Press the respawn key (debug harness) → car teleports to spawn, velocity resets, car sits still.
    80|
    81|---
    82|
    83|## Common Issues and Fixes
    84|
    85|| Symptom | Likely Cause | Fix |
    86||---|---|---|
    87|| Car immediately explodes | Suspension forces too high | Lower `spring_stiffness` in `CarSpec` or check compression sign |
    88|| Car sinks through floor | Suspension ray cast not hitting ground | Check ray cast direction/length in `VehicleController._compute_suspension_forces` |
    89|| Car spins uncontrollably | Forces applied at wrong offset | Verify `contact_pos - global_position` offset; check `apply_force` vs `apply_central_force` |
    90|| No forward motion | Drivetrain torque not reaching tire | Check `drive_force = drive_torque / spec.tire_radius_m`; check slip ratio computation |
    91|| Steer doesn't turn | Wheel basis not rotating | Check `_get_wheel_basis()` applies `_steer_angle_rad` to front wheels only |
    92|| ABS/TCS spams | Slip threshold too aggressive | Raise `abs_slip_threshold` / `tcs_slip_threshold` in `CarSpec` |
    93|
    94|---
    95|
    96|## Tuning After First Run
    97|
    98|Once the car is driveable, iterate on `hatchback_spec.tres` values:
    99|
   100|1. **Feels too twitchy laterally** → lower `pacejka_lat_B` (less aggressive peak onset).
   101|2. **Understeers too much** → raise front spring stiffness or lower front Pacejka peak.
   102|3. **Oversteers on throttle** (shouldn't on FWD but rear end might float) → raise `spring_stiffness` rear or check weight distribution.
   103|4. **Too much understeer on corner entry** → lower rear spring relative to front.
   104|5. **Acceleration too slow/fast** → adjust `max_torque_Nm` or recalculate against `max_power_kW`.
   105|
   106|---
   107|
   108|## Tier 1 Complete
   109|
   110|When all checklist items pass and the car feels driveable:
   111|
   112|- `gdlint` and `gdformat --check` on all new `.gd` files.
   113|- Update status on all 12 step notes to `done`.
   114|- Update `Trackside MVP Vision.md` — mark features 1 (Core Physics), 2 (Pacejka), 3 (Suspension), 4 (Aero), 5 (Drivetrain) as 🟡 (in progress → done).
   115|- Create a `feat(vehicle): implement Tier 1 vehicle physics stack` commit.
   116|
   117|---
   118|
   119|## Related
   120|
   121|- [[Vehicle Physics]] — back to hub
   122|- [[Trackside MVP Vision]] — update feature statuses after completion
   123|
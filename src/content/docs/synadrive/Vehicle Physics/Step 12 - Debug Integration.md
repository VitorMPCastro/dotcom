---
title: "Step 12 - Debug Integration"
aliases: ["Step 12 - Debug Integration"]
linter-yaml-title-alias: "Step 12 - Debug Integration"
tags:
  - Synadrive
  - vehicle-physics
  - tier-1
  - debug
type: impl-step
step: 12
status: pending
language: Config
files-to-create:
  - src/scenes/debug/infinite_plane.tscn (modify)
created: 2026-02-26
updated: 2026-02-26
---

# Step 12 - Debug Integration

**Prerequisites:** [[Step 10 - Scene Assembly]], [[Step 11 - GUT Tests]]
**Estimated Complexity:** S

---

## What

Wire the finished `vehicle_hatchback.tscn` into the existing debug harness and run the full verification checklist. No new code — this step is about integration, tuning, and sanity checking in a running environment.

---

## Wire to debug_test_plane

The existing `debug_test_plane.gd` has a `vehicle_scene: PackedScene` export ready and waiting. No code changes needed.

1. Open `scenes/debug/infinite_plane.tscn` in the editor.
2. In the Inspector for the `DebugTestPlane` node, set `vehicle_scene` to `res://scenes/vehicles/vehicle_hatchback.tscn`.
3. Run the scene (F5 or play button).

---

## Verification Checklist

### Stability

- [ ] Car spawns on the plane without falling through or exploding.
- [ ] Car sits at rest without drifting, oscillating, or sinking.
- [ ] No physics errors in the Output log.
- [ ] Suspension compression values visible in debug overlay are non-zero at rest (~equal front/rear for a level spawn).

### Basic Dynamics

- [ ] Throttle input → car accelerates forward.
- [ ] Brake input → car decelerates.
- [ ] Steer input → car turns. Turn radius feels plausible for a hatchback.
- [ ] RPM climbs with speed. Rev limiter cuts torque at redline (audible cut or telemetry indicator).
- [ ] Gear up/down changes gear. `Drivetrain.gear_changed` signal emits (visible in debug).

### Physics Realism (rough sanity checks)

| Test | Expected |
|---|---|
| 0–100 km/h time | ~9–11 seconds for a 130 hp hatchback |
| Braking from 100 km/h | ~40–50 m to stop on dry asphalt |
| Top speed (1st gear) | Car should hit rev limiter around 35–45 km/h in 1st |
| Body roll in corner | Visible (outer suspension compresses, inner extends) |
| Weight transfer on brake | Front suspension dips, rear rises |

These don't need to be perfect — they just shouldn't be wildly wrong (e.g., 0–100 in 1 second or 100 km/h taking 30 seconds).

### Input

- [ ] Keyboard input (W/A/S/D, E/Q) works.
- [ ] If gamepad connected: analog throttle/brake/steer responds correctly with no deadzone creep.

### Respawn

- [ ] Press the respawn key (debug harness) → car teleports to spawn, velocity resets, car sits still.

---

## Common Issues and Fixes

| Symptom | Likely Cause | Fix |
|---|---|---|
| Car immediately explodes | Suspension forces too high | Lower `spring_stiffness` in `CarSpec` or check compression sign |
| Car sinks through floor | Suspension ray cast not hitting ground | Check ray cast direction/length in `VehicleController._compute_suspension_forces` |
| Car spins uncontrollably | Forces applied at wrong offset | Verify `contact_pos - global_position` offset; check `apply_force` vs `apply_central_force` |
| No forward motion | Drivetrain torque not reaching tire | Check `drive_force = drive_torque / spec.tire_radius_m`; check slip ratio computation |
| Steer doesn't turn | Wheel basis not rotating | Check `_get_wheel_basis()` applies `_steer_angle_rad` to front wheels only |
| ABS/TCS spams | Slip threshold too aggressive | Raise `abs_slip_threshold` / `tcs_slip_threshold` in `CarSpec` |

---

## Tuning After First Run

Once the car is driveable, iterate on `hatchback_spec.tres` values:

1. **Feels too twitchy laterally** → lower `pacejka_lat_B` (less aggressive peak onset).
2. **Understeers too much** → raise front spring stiffness or lower front Pacejka peak.
3. **Oversteers on throttle** (shouldn't on FWD but rear end might float) → raise `spring_stiffness` rear or check weight distribution.
4. **Too much understeer on corner entry** → lower rear spring relative to front.
5. **Acceleration too slow/fast** → adjust `max_torque_Nm` or recalculate against `max_power_kW`.

---

## Tier 1 Complete

When all checklist items pass and the car feels driveable:

- `gdlint` and `gdformat --check` on all new `.gd` files.
- Update status on all 12 step notes to `done`.
- Update `Synadrive MVP Vision.md` — mark features 1 (Core Physics), 2 (Pacejka), 3 (Suspension), 4 (Aero), 5 (Drivetrain) as 🟡 (in progress → done).
- Create a `feat(vehicle): implement Tier 1 vehicle physics stack` commit.

---

## Related

- [[Vehicle Physics]] — back to hub
- [[Synadrive MVP Vision]] — update feature statuses after completion

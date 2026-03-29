---
title: "Step 06 - AeroModel"
aliases: ["Step 06 - AeroModel"]
linter-yaml-title-alias: "Step 06 - AeroModel"
tags:
  - Synadrive
  - vehicle-physics
  - tier-1
  - gdscript
  - aerodynamics
type: impl-step
step: 6
status: pending
language: GDScript
files-to-create:
  - src/scripts/vehicle/aero_model.gd
created: 2026-02-26
updated: 2026-02-26
---

# Step 06 - AeroModel

**Prerequisites:** [[Step 05 - CarSpec Resource]]
**Estimated Complexity:** S

---

## What

Implement aerodynamic drag and downforce as a light GDScript `Node`. Reads air speed from the parent vehicle, outputs a drag force vector and per-axle downforce scalars for `VehicleController` to apply.

---

## aero_model.gd

```gdscript
class_name AeroModel
extends Node
## Aerodynamic drag and downforce model.
## Reads CarSpec constants. Outputs forces every physics tick.
## Air density is held constant at sea level (1.225 kg/m³) for Tier 1.

const AIR_DENSITY: float = 1.225  ## kg/m³ at sea level, 15°C

@export var spec: CarSpec

# --- State ---
var _last_drag_N: float = 0.0
var _last_downforce_N: float = 0.0

# --- Public API ---

## Compute aerodynamic drag force in world space.
## @param velocity  Vehicle world-space velocity vector (m/s).
## @return  Drag force vector opposing velocity direction (Newtons).
func compute_drag(velocity: Vector3) -> Vector3:
    var speed_sq: float = velocity.length_squared()
    if speed_sq < 0.01:
        _last_drag_N = 0.0
        return Vector3.ZERO

    # F_drag = 0.5 · Cd · A · ρ · v²
    _last_drag_N = 0.5 * spec.drag_coefficient * spec.frontal_area_m2 * AIR_DENSITY * speed_sq
    return -velocity.normalized() * _last_drag_N


## Compute total downforce (Newtons). Split by aero_balance_front.
## @param speed_ms  Scalar speed in m/s.
## @return  Total downforce in Newtons (always positive).
func compute_downforce(speed_ms: float) -> float:
    # F_downforce = 0.5 · Cl · A · ρ · v²
    _last_downforce_N = 0.5 * spec.downforce_coefficient * spec.frontal_area_m2 * AIR_DENSITY * speed_ms * speed_ms
    return _last_downforce_N


## Downforce applied to the front axle (Newtons).
func get_front_downforce() -> float:
    return _last_downforce_N * spec.aero_balance_front


## Downforce applied to the rear axle (Newtons).
func get_rear_downforce() -> float:
    return _last_downforce_N * (1.0 - spec.aero_balance_front)


## Last computed drag magnitude (Newtons). For telemetry HUD.
func get_drag_force() -> float:
    return _last_drag_N


## Last computed total downforce (Newtons). For telemetry HUD.
func get_downforce() -> float:
    return _last_downforce_N
```

---

## Notes

- **This node is a logic component** — it extends `Node`, not `Node3D`. It has no physical presence in the scene; it's a pure computation service owned by `VehicleController`.
- **Air density is constant** for Tier 1. Tier 2 will vary it by weather temperature once the weather system is implemented (from the coupled weather/track conditions system).
- **Downforce on a FWD hatchback is tiny** — `downforce_coefficient = 0.05` produces about 30 N at 100 km/h. This is realistic (street car, no bodykit). The model exists now so GT3-class cars with `Cl = 3.0+` are trivially supported later.
- **`compute_drag` receives world-space velocity** — the drag force correctly opposes the actual direction of travel (including sideways drift drag), not just the forward direction.

---

## Usage in VehicleController (Preview)

```gdscript
# In VehicleController._physics_process():
var vel: Vector3 = linear_velocity
var drag: Vector3 = _aero.compute_drag(vel)
var downforce: float = _aero.compute_downforce(vel.length())

# Apply drag at centre of mass
apply_central_force(drag)

# Add downforce to normal load before tire force calculation
var front_df: float = _aero.get_front_downforce()
var rear_df: float = _aero.get_rear_downforce()
```

---

## Related

- [[Step 05 - CarSpec Resource]] — provides `Cd`, `Cl`, `A`, `aero_balance_front`
- [[Step 08 - VehicleController]] — calls `compute_drag` and `compute_downforce` each tick
- [[Vehicle Physics]] — back to hub

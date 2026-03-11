---
title: "Step 03 - TireModel (C++)"
aliases: ["Step 03 - TireModel (C++)"]
linter-yaml-title-alias: "Step 03 - TireModel (C++)"
tags:
  - Synadrive
  - vehicle-physics
  - tier-1
  - cpp
  - gdextension
  - tire
type: impl-step
step: 3
status: pending
language: C++
files-to-create:
  - src/gdextension/src/vehicle/tire_model.h
  - src/gdextension/src/vehicle/tire_model.cpp
created: 2026-02-26
updated: 2026-02-26
---

# Step 03 - TireModel (C++)

**Prerequisites:** [[Step 02 - GDExtension Scaffold]]
**Estimated Complexity:** M

---

## What

Implement the Pacejka Magic Formula tire force computation as a C++ GDExtension class. This is the hottest path in the entire simulation — it runs 4 × 240 = 960 times per second. No GDScript equivalent; C++ from day one.

---

## Role of This Class

`TireModel` is a **pure computation node** — it does not integrate physics itself. `VehicleController` (Step 8) calls it each tick, passes current slip and load values, and receives force vectors back. The `TireModel` node lives as a child of the vehicle `RigidBody3D`.

---

## tire_model.h

```cpp
#pragma once
#include <godot_cpp/classes/node3d.hpp>
#include <godot_cpp/variant/vector3.hpp>

namespace godot {

/// Pacejka Magic Formula tire model.
/// Computes combined lateral and longitudinal tire forces at the contact patch.
/// ## HOT PATH — runs 4x per physics tick at 240 Hz.
class TireModel : public Node3D {
    GDCLASS(TireModel, Node3D)

public:
    TireModel() = default;
    ~TireModel() = default;

    // --- GDScript API ---

    /// Set Pacejka coefficients for lateral (slip angle) model.
    void set_lateral_coefficients(float B, float C, float D, float E);

    /// Set Pacejka coefficients for longitudinal (slip ratio) model.
    void set_longitudinal_coefficients(float B, float C, float D, float E);

    /// Compute combined tire force at the contact patch.
    /// @param slip_ratio  Longitudinal slip ratio [-1, 1]. Positive = drive, negative = brake.
    /// @param slip_angle  Lateral slip angle in radians. Positive = left.
    /// @param normal_load Normal force on the tire in Newtons (Fz). Must be >= 0.
    /// @param mu          Friction coefficient of the current surface [0, 1].
    /// @return Force vector in wheel-local space: X = longitudinal, Z = lateral.
    Vector3 compute_force(float slip_ratio, float slip_angle, float normal_load, float mu) const;

    /// Last computed lateral force (Fy) in Newtons. For telemetry.
    float get_lateral_force() const { return _last_lateral; }

    /// Last computed longitudinal force (Fx) in Newtons. For telemetry.
    float get_longitudinal_force() const { return _last_longitudinal; }

protected:
    static void _bind_methods();

private:
    // Pacejka coefficients — lateral (slip angle)
    float _lat_B = 10.0f;    // Stiffness factor
    float _lat_C = 1.3f;     // Shape factor (1.3 = lateral typical)
    float _lat_D = 1.0f;     // Peak value (normalized; multiply by Fz in compute)
    float _lat_E = -1.0f;    // Curvature factor

    // Pacejka coefficients — longitudinal (slip ratio)
    float _lon_B = 11.0f;
    float _lon_C = 1.65f;    // Shape factor (1.65 = longitudinal typical)
    float _lon_D = 1.0f;
    float _lon_E = 0.0f;

    // Telemetry state
    mutable float _last_lateral = 0.0f;
    mutable float _last_longitudinal = 0.0f;

    // Internal — evaluates the Magic Formula for one axis.
    static float _pacejka(float B, float C, float D, float E, float slip);
};

} // namespace godot
```

---

## tire_model.cpp

```cpp
#include "tire_model.h"
#include <cmath>
#include <algorithm>
#include <godot_cpp/core/class_db.hpp>

using namespace godot;

// ## HOT PATH — this function runs 4x per physics tick (240 Hz = 960 calls/sec).
float TireModel::_pacejka(float B, float C, float D, float E, float slip) {
    // Pacejka Magic Formula: F = D·sin(C·arctan(B·slip - E·(B·slip - arctan(B·slip))))
    float Bs = B * slip;
    return D * std::sin(C * std::atan(Bs - E * (Bs - std::atan(Bs))));
}

Vector3 TireModel::compute_force(float slip_ratio, float slip_angle, float normal_load, float mu) const {
    if (normal_load <= 0.0f) {
        _last_lateral = 0.0f;
        _last_longitudinal = 0.0f;
        return Vector3();
    }

    // Raw Pacejka forces (normalized — multiply by Fz for real Newtons).
    // D coefficient is normalized: actual peak = D * normal_load * mu
    float Fx_raw = _pacejka(_lon_B, _lon_C, _lon_D * normal_load * mu, _lon_E, slip_ratio);
    float Fy_raw = _pacejka(_lat_B, _lat_C, _lat_D * normal_load * mu, _lat_E, slip_angle);

    // Combined slip — friction circle: sqrt(Fx² + Fy²) <= mu * Fz
    // Scale both forces down proportionally if their resultant exceeds the friction circle.
    float friction_limit = mu * normal_load;
    float resultant = std::sqrt(Fx_raw * Fx_raw + Fy_raw * Fy_raw);
    float scale = (resultant > friction_limit && resultant > 0.0f)
        ? friction_limit / resultant
        : 1.0f;

    float Fx = Fx_raw * scale;
    float Fy = Fy_raw * scale;

    _last_longitudinal = Fx;
    _last_lateral = Fy;

    // Wheel-local space: X = forward (longitudinal), Z = left (lateral).
    return Vector3(Fx, 0.0f, Fy);
}

void TireModel::set_lateral_coefficients(float B, float C, float D, float E) {
    _lat_B = B; _lat_C = C; _lat_D = D; _lat_E = E;
}

void TireModel::set_longitudinal_coefficients(float B, float C, float D, float E) {
    _lon_B = B; _lon_C = C; _lon_D = D; _lon_E = E;
}

void TireModel::_bind_methods() {
    ClassDB::bind_method(D_METHOD("set_lateral_coefficients", "B", "C", "D", "E"),
        &TireModel::set_lateral_coefficients);
    ClassDB::bind_method(D_METHOD("set_longitudinal_coefficients", "B", "C", "D", "E"),
        &TireModel::set_longitudinal_coefficients);
    ClassDB::bind_method(D_METHOD("compute_force", "slip_ratio", "slip_angle", "normal_load", "mu"),
        &TireModel::compute_force);
    ClassDB::bind_method(D_METHOD("get_lateral_force"), &TireModel::get_lateral_force);
    ClassDB::bind_method(D_METHOD("get_longitudinal_force"), &TireModel::get_longitudinal_force);
}
```

---

## After Writing These Files

Uncomment in `register_types.cpp`:

```cpp
#include "vehicle/tire_model.h"
// ...
ClassDB::register_class<TireModel>();
```

Rebuild: `scons platform=windows target=template_debug`

---

## Verification

1. Build succeeds.
2. Reopen Godot editor. Add a `TireModel` node to a test scene — it should appear in the "Add Node" dialog under Node3D.
3. In GDScript, call `compute_force(0.0, 0.2, 3000.0, 0.9)` — expect a lateral force around ~2400 N (roughly 0.8×Fz for a typical C=1.3 Pacejka).
4. Call `compute_force(0.0, 0.0, 3000.0, 0.9)` — expect Vector3.ZERO (no slip = no force). Correct.
5. Call `compute_force(0.5, 0.5, 3000.0, 0.9)` — resultant should be clamped to `0.9 × 3000 = 2700 N`.

---

## Pacejka Coefficient Reference (FWD Hatchback Starting Values)

| Coefficient | Lateral | Longitudinal | Meaning |
|---|---|---|---|
| B (stiffness) | 10 | 11 | Controls the slope near zero slip. Higher = more responsive. |
| C (shape) | 1.3 | 1.65 | Controls peak shape. Typical values don't vary much. |
| D (peak) | 1.0 | 1.0 | Peak normalized force. Multiply by Fz × mu for Newtons. |
| E (curvature) | -1.0 | 0.0 | Controls post-peak drop-off. Negative = more progressive drop. |

These are starting values. After the car is driveable, tune via telemetry data (Step 12).

---

## Related

- [[Step 02 - GDExtension Scaffold]] — must exist first
- [[Step 04 - Suspension (C++)]] — parallel work
- [[Step 08 - VehicleController]] — calls `compute_force` each tick
- [[Learning Resources]] — Pacejka textbook reference
- [[Vehicle Physics]] — back to hub

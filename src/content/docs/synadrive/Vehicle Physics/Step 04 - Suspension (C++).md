---
title: "Step 04 - Suspension (C++)"
aliases: ["Step 04 - Suspension (C++)"]
linter-yaml-title-alias: "Step 04 - Suspension (C++)"
tags:
  - Synadrive
  - vehicle-physics
  - tier-1
  - cpp
  - gdextension
  - suspension
type: impl-step
step: 4
status: pending
language: C++
files-to-create:
  - src/gdextension/src/vehicle/suspension.h
  - src/gdextension/src/vehicle/suspension.cpp
created: 2026-02-26
updated: 2026-02-26
---

# Step 04 - Suspension (C++)

**Prerequisites:** [[Step 02 - GDExtension Scaffold]] (can be done in parallel with [[Step 03 - TireModel (C++)]])
**Estimated Complexity:** M

---

## What

Implement a per-corner spring-damper suspension model as a C++ GDExtension `Node3D`. Computes the vertical suspension force from compression distance and compression velocity.

---

## Role of This Class

`Suspension` is a **pure computation node**, like `TireModel`. It does not cast rays itself — `VehicleController` (Step 8) performs the ray cast in GDScript, computes compression and compression velocity, then calls `Suspension.compute_force()` to get the spring+damper force to apply.

Four `Suspension` nodes live as children of the vehicle `RigidBody3D`: `SuspensionFL`, `SuspensionFR`, `SuspensionRL`, `SuspensionRR`.

---

## suspension.h

```cpp
#pragma once
#include <godot_cpp/classes/node3d.hpp>

namespace godot {

/// Per-corner spring-damper suspension model.
/// ## HOT PATH — runs 4x per physics tick.
class Suspension : public Node3D {
    GDCLASS(Suspension, Node3D)

public:
    Suspension() = default;
    ~Suspension() = default;

    // --- Configuration ---

    void set_spring_stiffness(float k);      // N/m
    float get_spring_stiffness() const { return _spring_k; }

    void set_damper_coefficient(float c);    // N·s/m
    float get_damper_coefficient() const { return _damper_c; }

    void set_rest_length(float length);      // metres
    float get_rest_length() const { return _rest_length; }

    void set_max_travel(float travel);       // metres (one-directional, from rest)
    float get_max_travel() const { return _max_travel; }

    // --- Runtime ---

    /// Compute suspension force for this corner.
    /// @param compression       Current compression in metres (positive = compressed).
    ///                          Clamped to [0, max_travel].
    /// @param compression_vel   Rate of compression change in m/s (positive = compressing).
    /// @return  Force magnitude in Newtons (always >= 0). Direction is applied by controller.
    float compute_force(float compression, float compression_vel);

    /// Last computed total force (spring + damper). For telemetry.
    float get_last_force() const { return _last_force; }

    /// Last compression value (metres). For weight transfer calculation.
    float get_compression() const { return _last_compression; }

protected:
    static void _bind_methods();

private:
    float _spring_k = 25000.0f;    // N/m (soft hatchback default)
    float _damper_c = 2500.0f;     // N·s/m
    float _rest_length = 0.35f;    // metres
    float _max_travel = 0.12f;     // metres

    float _last_force = 0.0f;
    float _last_compression = 0.0f;
};

} // namespace godot
```

---

## suspension.cpp

```cpp
#include "suspension.h"
#include <algorithm>
#include <godot_cpp/core/class_db.hpp>

using namespace godot;

// ## HOT PATH — 4x per physics tick at 240 Hz.
float Suspension::compute_force(float compression, float compression_vel) {
    // Clamp compression to physical travel limits.
    compression = std::clamp(compression, 0.0f, _max_travel);
    _last_compression = compression;

    // Spring force: F_spring = k * compression
    float spring_force = _spring_k * compression;

    // Damper force: F_damper = c * compression_velocity
    // Damper resists compression (positive vel) and extension (negative vel).
    // We clamp to zero on extension beyond rest to prevent tension (simple model).
    float damper_force = _damper_c * compression_vel;

    float total = spring_force + damper_force;

    // Suspension cannot pull the car down (no tension in compression damper).
    // If the wheel is fully extended and moving further away, output 0.
    total = std::max(total, 0.0f);

    _last_force = total;
    return total;
}

void Suspension::set_spring_stiffness(float k) { _spring_k = k; }
void Suspension::set_damper_coefficient(float c) { _damper_c = c; }
void Suspension::set_rest_length(float length) { _rest_length = length; }
void Suspension::set_max_travel(float travel) { _max_travel = travel; }

void Suspension::_bind_methods() {
    // Spring stiffness
    ClassDB::bind_method(D_METHOD("set_spring_stiffness", "k"), &Suspension::set_spring_stiffness);
    ClassDB::bind_method(D_METHOD("get_spring_stiffness"), &Suspension::get_spring_stiffness);
    ADD_PROPERTY(PropertyInfo(Variant::FLOAT, "spring_stiffness"), "set_spring_stiffness", "get_spring_stiffness");

    // Damper coefficient
    ClassDB::bind_method(D_METHOD("set_damper_coefficient", "c"), &Suspension::set_damper_coefficient);
    ClassDB::bind_method(D_METHOD("get_damper_coefficient"), &Suspension::get_damper_coefficient);
    ADD_PROPERTY(PropertyInfo(Variant::FLOAT, "damper_coefficient"), "set_damper_coefficient", "get_damper_coefficient");

    // Rest length
    ClassDB::bind_method(D_METHOD("set_rest_length", "length"), &Suspension::set_rest_length);
    ClassDB::bind_method(D_METHOD("get_rest_length"), &Suspension::get_rest_length);
    ADD_PROPERTY(PropertyInfo(Variant::FLOAT, "rest_length"), "set_rest_length", "get_rest_length");

    // Max travel
    ClassDB::bind_method(D_METHOD("set_max_travel", "travel"), &Suspension::set_max_travel);
    ClassDB::bind_method(D_METHOD("get_max_travel"), &Suspension::get_max_travel);
    ADD_PROPERTY(PropertyInfo(Variant::FLOAT, "max_travel"), "set_max_travel", "get_max_travel");

    // Runtime methods
    ClassDB::bind_method(D_METHOD("compute_force", "compression", "compression_vel"),
        &Suspension::compute_force);
    ClassDB::bind_method(D_METHOD("get_last_force"), &Suspension::get_last_force);
    ClassDB::bind_method(D_METHOD("get_compression"), &Suspension::get_compression);
}
```

---

## Compression Calculation (GDScript Side — Step 8)

The `VehicleController` computes `compression` using a ray cast from each wheel anchor point:

```gdscript
# In VehicleController._physics_process():
var ray_origin: Vector3 = _get_wheel_anchor_world(corner)  # e.g. SuspensionFL global position
var ray_end: Vector3 = ray_origin + Vector3.DOWN * (_spec.suspension_rest_length + _spec.suspension_max_travel)

var query := PhysicsRayQueryParameters3D.create(ray_origin, ray_end)
query.exclude = [get_rid()]  # exclude the vehicle body itself
var result := get_world_3d().direct_space_state.intersect_ray(query)

if result:
    var hit_dist: float = ray_origin.distance_to(result["position"])
    var compression: float = _spec.suspension_rest_length - (hit_dist - _spec.tire_radius_m)
    var compression_vel: float = (compression - _prev_compression[corner]) / delta
    _prev_compression[corner] = compression
    var force: float = _suspension[corner].compute_force(compression, compression_vel)
```

---

## Default Values Reference (FWD Hatchback)

| Parameter | Value | Notes |
|---|---|---|
| Spring stiffness | 25,000 N/m | Comfortable but sporty hatchback. 15,000 = soft; 50,000 = stiff. |
| Damper coefficient | 2,500 N·s/m | ~critical damping at these spring rates. |
| Rest length | 0.35 m | Suspension at design height. |
| Max travel | 0.12 m | 12 cm total travel (bump + rebound handled symmetrically here). |

---

## After Writing These Files

Uncomment in `register_types.cpp`:

```cpp
#include "vehicle/suspension.h"
ClassDB::register_class<Suspension>();
```

Rebuild and verify `Suspension` appears in the Godot Add Node dialog.

---

## Related

- [[Step 03 - TireModel (C++)]] — parallel work
- [[Step 08 - VehicleController]] — calls `compute_force` + performs ray casts
- [[Vehicle Physics]] — back to hub

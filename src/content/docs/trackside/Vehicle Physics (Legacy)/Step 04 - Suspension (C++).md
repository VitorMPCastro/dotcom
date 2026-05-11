> [!warning] Legacy — Pre-MJIP Architecture
> This note describes the old VehicleController + Pacejka GDExtension approach. **MJIP supersedes this architecture.** Preserved for historical reference only. Do not implement from these notes without first reading [[MJIP — Overview]] and [[MJIP-Trackside Integration]].

     1|---
     2|title: "Step 04 - Suspension (C++)"
     3|aliases: ["Step 04 - Suspension (C++)"]
     4|linter-yaml-title-alias: "Step 04 - Suspension (C++)"
     5|tags:
     6|  - Trackside
     7|  - vehicle-physics
     8|  - tier-1
     9|  - cpp
    10|  - gdextension
    11|  - suspension
    12|type: impl-step
    13|step: 4
    14|status: pending
    15|language: C++
    16|files-to-create:
    17|  - src/gdextension/src/vehicle/suspension.h
    18|  - src/gdextension/src/vehicle/suspension.cpp
    19|created: 2026-02-26
    20|updated: 2026-02-26
    21|---
    22|
    23|# Step 04 - Suspension (C++)
    24|
    25|**Prerequisites:** [[Step 02 - GDExtension Scaffold]] (can be done in parallel with [[Step 03 - TireModel (C++)]])
    26|**Estimated Complexity:** M
    27|
    28|---
    29|
    30|## What
    31|
    32|Implement a per-corner spring-damper suspension model as a C++ GDExtension `Node3D`. Computes the vertical suspension force from compression distance and compression velocity.
    33|
    34|---
    35|
    36|## Role of This Class
    37|
    38|`Suspension` is a **pure computation node**, like `TireModel`. It does not cast rays itself — `VehicleController` (Step 8) performs the ray cast in GDScript, computes compression and compression velocity, then calls `Suspension.compute_force()` to get the spring+damper force to apply.
    39|
    40|Four `Suspension` nodes live as children of the vehicle `RigidBody3D`: `SuspensionFL`, `SuspensionFR`, `SuspensionRL`, `SuspensionRR`.
    41|
    42|---
    43|
    44|## suspension.h
    45|
    46|```cpp
    47|#pragma once
    48|#include <godot_cpp/classes/node3d.hpp>
    49|
    50|namespace godot {
    51|
    52|/// Per-corner spring-damper suspension model.
    53|/// ## HOT PATH — runs 4x per physics tick.
    54|class Suspension : public Node3D {
    55|    GDCLASS(Suspension, Node3D)
    56|
    57|public:
    58|    Suspension() = default;
    59|    ~Suspension() = default;
    60|
    61|    // --- Configuration ---
    62|
    63|    void set_spring_stiffness(float k);      // N/m
    64|    float get_spring_stiffness() const { return _spring_k; }
    65|
    66|    void set_damper_coefficient(float c);    // N·s/m
    67|    float get_damper_coefficient() const { return _damper_c; }
    68|
    69|    void set_rest_length(float length);      // metres
    70|    float get_rest_length() const { return _rest_length; }
    71|
    72|    void set_max_travel(float travel);       // metres (one-directional, from rest)
    73|    float get_max_travel() const { return _max_travel; }
    74|
    75|    // --- Runtime ---
    76|
    77|    /// Compute suspension force for this corner.
    78|    /// @param compression       Current compression in metres (positive = compressed).
    79|    ///                          Clamped to [0, max_travel].
    80|    /// @param compression_vel   Rate of compression change in m/s (positive = compressing).
    81|    /// @return  Force magnitude in Newtons (always >= 0). Direction is applied by controller.
    82|    float compute_force(float compression, float compression_vel);
    83|
    84|    /// Last computed total force (spring + damper). For telemetry.
    85|    float get_last_force() const { return _last_force; }
    86|
    87|    /// Last compression value (metres). For weight transfer calculation.
    88|    float get_compression() const { return _last_compression; }
    89|
    90|protected:
    91|    static void _bind_methods();
    92|
    93|private:
    94|    float _spring_k = 25000.0f;    // N/m (soft hatchback default)
    95|    float _damper_c = 2500.0f;     // N·s/m
    96|    float _rest_length = 0.35f;    // metres
    97|    float _max_travel = 0.12f;     // metres
    98|
    99|    float _last_force = 0.0f;
   100|    float _last_compression = 0.0f;
   101|};
   102|
   103|} // namespace godot
   104|```
   105|
   106|---
   107|
   108|## suspension.cpp
   109|
   110|```cpp
   111|#include "suspension.h"
   112|#include <algorithm>
   113|#include <godot_cpp/core/class_db.hpp>
   114|
   115|using namespace godot;
   116|
   117|// ## HOT PATH — 4x per physics tick at 240 Hz.
   118|float Suspension::compute_force(float compression, float compression_vel) {
   119|    // Clamp compression to physical travel limits.
   120|    compression = std::clamp(compression, 0.0f, _max_travel);
   121|    _last_compression = compression;
   122|
   123|    // Spring force: F_spring = k * compression
   124|    float spring_force = _spring_k * compression;
   125|
   126|    // Damper force: F_damper = c * compression_velocity
   127|    // Damper resists compression (positive vel) and extension (negative vel).
   128|    // We clamp to zero on extension beyond rest to prevent tension (simple model).
   129|    float damper_force = _damper_c * compression_vel;
   130|
   131|    float total = spring_force + damper_force;
   132|
   133|    // Suspension cannot pull the car down (no tension in compression damper).
   134|    // If the wheel is fully extended and moving further away, output 0.
   135|    total = std::max(total, 0.0f);
   136|
   137|    _last_force = total;
   138|    return total;
   139|}
   140|
   141|void Suspension::set_spring_stiffness(float k) { _spring_k = k; }
   142|void Suspension::set_damper_coefficient(float c) { _damper_c = c; }
   143|void Suspension::set_rest_length(float length) { _rest_length = length; }
   144|void Suspension::set_max_travel(float travel) { _max_travel = travel; }
   145|
   146|void Suspension::_bind_methods() {
   147|    // Spring stiffness
   148|    ClassDB::bind_method(D_METHOD("set_spring_stiffness", "k"), &Suspension::set_spring_stiffness);
   149|    ClassDB::bind_method(D_METHOD("get_spring_stiffness"), &Suspension::get_spring_stiffness);
   150|    ADD_PROPERTY(PropertyInfo(Variant::FLOAT, "spring_stiffness"), "set_spring_stiffness", "get_spring_stiffness");
   151|
   152|    // Damper coefficient
   153|    ClassDB::bind_method(D_METHOD("set_damper_coefficient", "c"), &Suspension::set_damper_coefficient);
   154|    ClassDB::bind_method(D_METHOD("get_damper_coefficient"), &Suspension::get_damper_coefficient);
   155|    ADD_PROPERTY(PropertyInfo(Variant::FLOAT, "damper_coefficient"), "set_damper_coefficient", "get_damper_coefficient");
   156|
   157|    // Rest length
   158|    ClassDB::bind_method(D_METHOD("set_rest_length", "length"), &Suspension::set_rest_length);
   159|    ClassDB::bind_method(D_METHOD("get_rest_length"), &Suspension::get_rest_length);
   160|    ADD_PROPERTY(PropertyInfo(Variant::FLOAT, "rest_length"), "set_rest_length", "get_rest_length");
   161|
   162|    // Max travel
   163|    ClassDB::bind_method(D_METHOD("set_max_travel", "travel"), &Suspension::set_max_travel);
   164|    ClassDB::bind_method(D_METHOD("get_max_travel"), &Suspension::get_max_travel);
   165|    ADD_PROPERTY(PropertyInfo(Variant::FLOAT, "max_travel"), "set_max_travel", "get_max_travel");
   166|
   167|    // Runtime methods
   168|    ClassDB::bind_method(D_METHOD("compute_force", "compression", "compression_vel"),
   169|        &Suspension::compute_force);
   170|    ClassDB::bind_method(D_METHOD("get_last_force"), &Suspension::get_last_force);
   171|    ClassDB::bind_method(D_METHOD("get_compression"), &Suspension::get_compression);
   172|}
   173|```
   174|
   175|---
   176|
   177|## Compression Calculation (GDScript Side — Step 8)
   178|
   179|The `VehicleController` computes `compression` using a ray cast from each wheel anchor point:
   180|
   181|```gdscript
   182|# In VehicleController._physics_process():
   183|var ray_origin: Vector3 = _get_wheel_anchor_world(corner)  # e.g. SuspensionFL global position
   184|var ray_end: Vector3 = ray_origin + Vector3.DOWN * (_spec.suspension_rest_length + _spec.suspension_max_travel)
   185|
   186|var query := PhysicsRayQueryParameters3D.create(ray_origin, ray_end)
   187|query.exclude = [get_rid()]  # exclude the vehicle body itself
   188|var result := get_world_3d().direct_space_state.intersect_ray(query)
   189|
   190|if result:
   191|    var hit_dist: float = ray_origin.distance_to(result["position"])
   192|    var compression: float = _spec.suspension_rest_length - (hit_dist - _spec.tire_radius_m)
   193|    var compression_vel: float = (compression - _prev_compression[corner]) / delta
   194|    _prev_compression[corner] = compression
   195|    var force: float = _suspension[corner].compute_force(compression, compression_vel)
   196|```
   197|
   198|---
   199|
   200|## Default Values Reference (FWD Hatchback)
   201|
   202|| Parameter | Value | Notes |
   203||---|---|---|
   204|| Spring stiffness | 25,000 N/m | Comfortable but sporty hatchback. 15,000 = soft; 50,000 = stiff. |
   205|| Damper coefficient | 2,500 N·s/m | ~critical damping at these spring rates. |
   206|| Rest length | 0.35 m | Suspension at design height. |
   207|| Max travel | 0.12 m | 12 cm total travel (bump + rebound handled symmetrically here). |
   208|
   209|---
   210|
   211|## After Writing These Files
   212|
   213|Uncomment in `register_types.cpp`:
   214|
   215|```cpp
   216|#include "vehicle/suspension.h"
   217|ClassDB::register_class<Suspension>();
   218|```
   219|
   220|Rebuild and verify `Suspension` appears in the Godot Add Node dialog.
   221|
   222|---
   223|
   224|## Related
   225|
   226|- [[Step 03 - TireModel (C++)]] — parallel work
   227|- [[Step 08 - VehicleController]] — calls `compute_force` + performs ray casts
   228|- [[Vehicle Physics]] — back to hub
   229|
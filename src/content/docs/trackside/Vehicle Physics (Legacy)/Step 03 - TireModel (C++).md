> [!warning] Legacy — Pre-MJIP Architecture
> This note describes the old VehicleController + Pacejka GDExtension approach. **MJIP supersedes this architecture.** Preserved for historical reference only. Do not implement from these notes without first reading [[MJIP — Overview]] and [[MJIP-Trackside Integration]].

     1|---
     2|title: "Step 03 - TireModel (C++)"
     3|aliases: ["Step 03 - TireModel (C++)"]
     4|linter-yaml-title-alias: "Step 03 - TireModel (C++)"
     5|tags:
     6|  - Trackside
     7|  - vehicle-physics
     8|  - tier-1
     9|  - cpp
    10|  - gdextension
    11|  - tire
    12|type: impl-step
    13|step: 3
    14|status: pending
    15|language: C++
    16|files-to-create:
    17|  - src/gdextension/src/vehicle/tire_model.h
    18|  - src/gdextension/src/vehicle/tire_model.cpp
    19|created: 2026-02-26
    20|updated: 2026-02-26
    21|---
    22|
    23|# Step 03 - TireModel (C++)
    24|
    25|**Prerequisites:** [[Step 02 - GDExtension Scaffold]]
    26|**Estimated Complexity:** M
    27|
    28|---
    29|
    30|## What
    31|
    32|Implement the Pacejka Magic Formula tire force computation as a C++ GDExtension class. This is the hottest path in the entire simulation — it runs 4 × 240 = 960 times per second. No GDScript equivalent; C++ from day one.
    33|
    34|---
    35|
    36|## Role of This Class
    37|
    38|`TireModel` is a **pure computation node** — it does not integrate physics itself. `VehicleController` (Step 8) calls it each tick, passes current slip and load values, and receives force vectors back. The `TireModel` node lives as a child of the vehicle `RigidBody3D`.
    39|
    40|---
    41|
    42|## tire_model.h
    43|
    44|```cpp
    45|#pragma once
    46|#include <godot_cpp/classes/node3d.hpp>
    47|#include <godot_cpp/variant/vector3.hpp>
    48|
    49|namespace godot {
    50|
    51|/// Pacejka Magic Formula tire model.
    52|/// Computes combined lateral and longitudinal tire forces at the contact patch.
    53|/// ## HOT PATH — runs 4x per physics tick at 240 Hz.
    54|class TireModel : public Node3D {
    55|    GDCLASS(TireModel, Node3D)
    56|
    57|public:
    58|    TireModel() = default;
    59|    ~TireModel() = default;
    60|
    61|    // --- GDScript API ---
    62|
    63|    /// Set Pacejka coefficients for lateral (slip angle) model.
    64|    void set_lateral_coefficients(float B, float C, float D, float E);
    65|
    66|    /// Set Pacejka coefficients for longitudinal (slip ratio) model.
    67|    void set_longitudinal_coefficients(float B, float C, float D, float E);
    68|
    69|    /// Compute combined tire force at the contact patch.
    70|    /// @param slip_ratio  Longitudinal slip ratio [-1, 1]. Positive = drive, negative = brake.
    71|    /// @param slip_angle  Lateral slip angle in radians. Positive = left.
    72|    /// @param normal_load Normal force on the tire in Newtons (Fz). Must be >= 0.
    73|    /// @param mu          Friction coefficient of the current surface [0, 1].
    74|    /// @return Force vector in wheel-local space: X = longitudinal, Z = lateral.
    75|    Vector3 compute_force(float slip_ratio, float slip_angle, float normal_load, float mu) const;
    76|
    77|    /// Last computed lateral force (Fy) in Newtons. For telemetry.
    78|    float get_lateral_force() const { return _last_lateral; }
    79|
    80|    /// Last computed longitudinal force (Fx) in Newtons. For telemetry.
    81|    float get_longitudinal_force() const { return _last_longitudinal; }
    82|
    83|protected:
    84|    static void _bind_methods();
    85|
    86|private:
    87|    // Pacejka coefficients — lateral (slip angle)
    88|    float _lat_B = 10.0f;    // Stiffness factor
    89|    float _lat_C = 1.3f;     // Shape factor (1.3 = lateral typical)
    90|    float _lat_D = 1.0f;     // Peak value (normalized; multiply by Fz in compute)
    91|    float _lat_E = -1.0f;    // Curvature factor
    92|
    93|    // Pacejka coefficients — longitudinal (slip ratio)
    94|    float _lon_B = 11.0f;
    95|    float _lon_C = 1.65f;    // Shape factor (1.65 = longitudinal typical)
    96|    float _lon_D = 1.0f;
    97|    float _lon_E = 0.0f;
    98|
    99|    // Telemetry state
   100|    mutable float _last_lateral = 0.0f;
   101|    mutable float _last_longitudinal = 0.0f;
   102|
   103|    // Internal — evaluates the Magic Formula for one axis.
   104|    static float _pacejka(float B, float C, float D, float E, float slip);
   105|};
   106|
   107|} // namespace godot
   108|```
   109|
   110|---
   111|
   112|## tire_model.cpp
   113|
   114|```cpp
   115|#include "tire_model.h"
   116|#include <cmath>
   117|#include <algorithm>
   118|#include <godot_cpp/core/class_db.hpp>
   119|
   120|using namespace godot;
   121|
   122|// ## HOT PATH — this function runs 4x per physics tick (240 Hz = 960 calls/sec).
   123|float TireModel::_pacejka(float B, float C, float D, float E, float slip) {
   124|    // Pacejka Magic Formula: F = D·sin(C·arctan(B·slip - E·(B·slip - arctan(B·slip))))
   125|    float Bs = B * slip;
   126|    return D * std::sin(C * std::atan(Bs - E * (Bs - std::atan(Bs))));
   127|}
   128|
   129|Vector3 TireModel::compute_force(float slip_ratio, float slip_angle, float normal_load, float mu) const {
   130|    if (normal_load <= 0.0f) {
   131|        _last_lateral = 0.0f;
   132|        _last_longitudinal = 0.0f;
   133|        return Vector3();
   134|    }
   135|
   136|    // Raw Pacejka forces (normalized — multiply by Fz for real Newtons).
   137|    // D coefficient is normalized: actual peak = D * normal_load * mu
   138|    float Fx_raw = _pacejka(_lon_B, _lon_C, _lon_D * normal_load * mu, _lon_E, slip_ratio);
   139|    float Fy_raw = _pacejka(_lat_B, _lat_C, _lat_D * normal_load * mu, _lat_E, slip_angle);
   140|
   141|    // Combined slip — friction circle: sqrt(Fx² + Fy²) <= mu * Fz
   142|    // Scale both forces down proportionally if their resultant exceeds the friction circle.
   143|    float friction_limit = mu * normal_load;
   144|    float resultant = std::sqrt(Fx_raw * Fx_raw + Fy_raw * Fy_raw);
   145|    float scale = (resultant > friction_limit && resultant > 0.0f)
   146|        ? friction_limit / resultant
   147|        : 1.0f;
   148|
   149|    float Fx = Fx_raw * scale;
   150|    float Fy = Fy_raw * scale;
   151|
   152|    _last_longitudinal = Fx;
   153|    _last_lateral = Fy;
   154|
   155|    // Wheel-local space: X = forward (longitudinal), Z = left (lateral).
   156|    return Vector3(Fx, 0.0f, Fy);
   157|}
   158|
   159|void TireModel::set_lateral_coefficients(float B, float C, float D, float E) {
   160|    _lat_B = B; _lat_C = C; _lat_D = D; _lat_E = E;
   161|}
   162|
   163|void TireModel::set_longitudinal_coefficients(float B, float C, float D, float E) {
   164|    _lon_B = B; _lon_C = C; _lon_D = D; _lon_E = E;
   165|}
   166|
   167|void TireModel::_bind_methods() {
   168|    ClassDB::bind_method(D_METHOD("set_lateral_coefficients", "B", "C", "D", "E"),
   169|        &TireModel::set_lateral_coefficients);
   170|    ClassDB::bind_method(D_METHOD("set_longitudinal_coefficients", "B", "C", "D", "E"),
   171|        &TireModel::set_longitudinal_coefficients);
   172|    ClassDB::bind_method(D_METHOD("compute_force", "slip_ratio", "slip_angle", "normal_load", "mu"),
   173|        &TireModel::compute_force);
   174|    ClassDB::bind_method(D_METHOD("get_lateral_force"), &TireModel::get_lateral_force);
   175|    ClassDB::bind_method(D_METHOD("get_longitudinal_force"), &TireModel::get_longitudinal_force);
   176|}
   177|```
   178|
   179|---
   180|
   181|## After Writing These Files
   182|
   183|Uncomment in `register_types.cpp`:
   184|
   185|```cpp
   186|#include "vehicle/tire_model.h"
   187|// ...
   188|ClassDB::register_class<TireModel>();
   189|```
   190|
   191|Rebuild: `scons platform=windows target=template_debug`
   192|
   193|---
   194|
   195|## Verification
   196|
   197|1. Build succeeds.
   198|2. Reopen Godot editor. Add a `TireModel` node to a test scene — it should appear in the "Add Node" dialog under Node3D.
   199|3. In GDScript, call `compute_force(0.0, 0.2, 3000.0, 0.9)` — expect a lateral force around ~2400 N (roughly 0.8×Fz for a typical C=1.3 Pacejka).
   200|4. Call `compute_force(0.0, 0.0, 3000.0, 0.9)` — expect Vector3.ZERO (no slip = no force). Correct.
   201|5. Call `compute_force(0.5, 0.5, 3000.0, 0.9)` — resultant should be clamped to `0.9 × 3000 = 2700 N`.
   202|
   203|---
   204|
   205|## Pacejka Coefficient Reference (FWD Hatchback Starting Values)
   206|
   207|| Coefficient | Lateral | Longitudinal | Meaning |
   208||---|---|---|---|
   209|| B (stiffness) | 10 | 11 | Controls the slope near zero slip. Higher = more responsive. |
   210|| C (shape) | 1.3 | 1.65 | Controls peak shape. Typical values don't vary much. |
   211|| D (peak) | 1.0 | 1.0 | Peak normalized force. Multiply by Fz × mu for Newtons. |
   212|| E (curvature) | -1.0 | 0.0 | Controls post-peak drop-off. Negative = more progressive drop. |
   213|
   214|These are starting values. After the car is driveable, tune via telemetry data (Step 12).
   215|
   216|---
   217|
   218|## Related
   219|
   220|- [[Step 02 - GDExtension Scaffold]] — must exist first
   221|- [[Step 04 - Suspension (C++)]] — parallel work
   222|- [[Step 08 - VehicleController]] — calls `compute_force` each tick
   223|- [[Learning Resources]] — Pacejka textbook reference
   224|- [[Vehicle Physics]] — back to hub
   225|
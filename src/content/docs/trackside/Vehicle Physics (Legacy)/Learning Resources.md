> [!warning] Legacy — Pre-MJIP Architecture
> This note describes the old VehicleController + Pacejka GDExtension approach. **MJIP supersedes this architecture.** Preserved for historical reference only. Do not implement from these notes without first reading [[MJIP — Overview]] and [[MJIP-Trackside Integration]].

     1|---
     2|title: Vehicle Physics — Learning Resources
     3|aliases: [Vehicle Physics — Learning Resources]
     4|linter-yaml-title-alias: Vehicle Physics — Learning Resources
     5|tags:
     6|  - Trackside
     7|  - vehicle-physics
     8|  - learning
     9|  - reference
    10|type: reference
    11|created: 2026-02-26
    12|updated: 2026-02-26
    13|---
    14|
    15|# Vehicle Physics — Learning Resources
    16|
    17|Essential reading for implementing sim-level vehicle dynamics. Listed in recommended reading order.
    18|
    19|---
    20|
    21|## Start Here
    22|
    23|### Marco Monster — Car Physics for Games
    24|
    25|**Source:** gamedev.net (free article)
    26|**Read when:** Before writing any code. This is the accessible entry point.
    27|**Covers:** Slip angle, lateral/longitudinal tire forces, weight transfer, steering geometry — all explained with minimal math and clear diagrams.
    28|**Why:** Marco's article is the most referenced starting point in game dev vehicle physics. It maps directly to what we're building.
    29|
    30|---
    31|
    32|### Brian Beckman — The Physics of Racing (Parts 1–16)
    33|
    34|**Source:** Free PDF, multiple hosting sites. Search "Brian Beckman Physics of Racing PDF".
    35|**Read when:** After Monster. Before touching the Pacejka formula.
    36|**Read:** Parts 1–6 for Tier 1. Parts 7–16 for Tier 2+ (tire thermals, differential, etc.).
    37|**Covers:** Slip angle derivation, tire contact patch physics, weight transfer intuition, understeer/oversteer dynamics, throttle-steer balance.
    38|**Why:** Beckman is a physicist who races. The intuition he builds is exactly what you need to tune `CarSpec` values correctly once the code is running.
    39|
    40|---
    41|
    42|## Deep Dives
    43|
    44|### Hans B. Pacejka — Tyre and Vehicle Dynamics (3rd Edition)
    45|
    46|**Source:** Textbook (Butterworth-Heinemann). ISBN 978-0-08-097016-5.
    47|**Read when:** When implementing `TireModel` (Step 3). Chapter 4 first.
    48|**Covers:** The Magic Formula derivation in full. Lateral model → longitudinal model → combined slip. Every coefficient explained.
    49|**Why:** This is the source. Everything else citing "Pacejka" references this book. Understanding *why* B, C, D, E exist prevents tuning errors.
    50|**Key formula:** `F = D·sin(C·arctan(B·α - E·(B·α - arctan(B·α))))`
    51|Where: B = stiffness, C = shape, D = peak, E = curvature, α = slip angle or slip ratio.
    52|
    53|---
    54|
    55|### Edy's Vehicle Physics Docs
    56|
    57|**Source:** [vehiclephysics.com](https://vehiclephysics.com) (free)
    58|**Read when:** Before implementing `VehicleController` (Step 8). Specifically the "Physics Integration" and "Solver Order" sections.
    59|**Covers:** The *order* in which forces must be applied each physics tick to prevent solver blow-up. Suspension → tire load → tire forces → drive forces → apply to body. Getting this order wrong causes violent instability.
    60|**Why:** Edy has shipped a commercial vehicle physics SDK. His solver integration guidance is battle-tested and Godot/Unity-agnostic.
    61|
    62|---
    63|
    64|### Gregor Veble — ODE Vehicle Tutorial
    65|
    66|**Source:** Search "Gregor Veble ODE vehicle tutorial". Mirror on several game physics sites.
    67|**Read when:** Alongside Edy's docs, before Step 8.
    68|**Covers:** The force application model for a 4-wheel vehicle on a physics engine. Explains why suspension forces must be applied *before* lateral tire forces in each tick.
    69|
    70|---
    71|
    72|## Engine-Specific
    73|
    74|### Jolt Physics Documentation
    75|
    76|**Source:** [jrouwe.github.io/JoltPhysics](https://jrouwe.github.io/JoltPhysics/)
    77|**Read when:** When setting up GDExtension (Step 2) and VehicleController (Step 8).
    78|**Covers:** `Body`, `BodyInterface`, `PhysicsSystem`. What Jolt computes automatically (collision response, constraint solving) vs. what you must compute and apply manually (tire forces, aero, drive torque).
    79|**Key section:** "Adding forces and torques" — understand `AddForce`, `AddTorque`, `AddImpulse` and their integration timing.
    80|**Important:** In Godot, you don't call Jolt directly — you use `PhysicsServer3D`. But reading Jolt docs builds the mental model.
    81|
    82|---
    83|
    84|### Godot `PhysicsServer3D` API
    85|
    86|**Source:** [docs.godotengine.org](https://docs.godotengine.org/en/stable/classes/class_physicsserver3d.html)
    87|**Read when:** Implementing `VehicleController` (Step 8).
    88|**Key methods to understand:**
    89|- `body_apply_force(body, force, position)` — apply world-space force at a world-space contact patch position
    90|- `body_apply_central_force(body, force)` — apply force at the center of mass
    91|- `body_apply_torque(body, torque)` — apply world-space torque
    92|- `body_get_state(body, state)` — read current linear velocity, angular velocity, transform
    93|**Why:** At 240 Hz you'll be calling these methods 240 times per second. Understanding which variant to use (force vs. impulse, central vs. offset) prevents subtle integration errors.
    94|
    95|---
    96|
    97|## Supplementary
    98|
    99|### iRacing — "How iRacing Models Tires" (GDC Talk)
   100|
   101|**Source:** GDC Vault (requires GDC account or YouTube mirror). Search "iRacing tire model GDC".
   102|**Read when:** After the system is working. Context for future refinement.
   103|**Covers:** How a production simracing title handles Pacejka coefficients per compound, tire deformation, and contact patch simulation. Sets a north-star for Tier 2+ work.
   104|
   105|---
   106|
   107|## Notes on 240 Hz
   108|
   109|At 240 Hz, every millisecond matters in the hot path. Some practical notes:
   110|
   111|- **Pacejka evaluation is `O(1)` per wheel** — 4 evaluations per tick. At 240 Hz that is 960/sec. In C++ this is trivial (<0.1 ms). In GDScript it would be ~2–3 ms — too slow by far.
   112|- **Weight transfer** uses current acceleration which is the *previous frame's* result. This one-frame lag is acceptable at 240 Hz (4 ms lag max).
   113|- **Semi-implicit Euler integration** is strongly recommended over explicit Euler for the RPM/torque dynamics. Godot's Jolt backend already uses this for its own integration; your GDScript forces benefit if applied correctly.
   114|- **`max_physics_steps_per_frame = 8`** (set in Step 1) prevents spiral-of-death. If a frame takes 100 ms, physics still only runs 8 steps max instead of catching up with 24 steps.
   115|
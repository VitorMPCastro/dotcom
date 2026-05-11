---
title: VehicleExtension — Architecture Decisions
aliases: [VehicleExtension — Architecture Decisions]
linter-yaml-title-alias: VehicleExtension — Architecture Decisions
tags:
  - Trackside
  - gdextension
  - architecture
  - vehicle-physics
type: architecture-decision
created: 2026-03-11
updated: 2026-03-29
---

# VehicleExtension — Architecture Decisions

Running log of significant architectural choices made for the VehicleExtension C++ GDExtension. Each entry captures the decision, the reasoning, and what was ruled out.

---

## Decision 1 — Force Feedback is a Separate Extension

**Decision:** FFB will live in a dedicated `FFBExtension` GDExtension, not inside VehicleExtension.

**Reasoning:**
- FFB logic reads one value from VehicleBody (rack force at the steering axis) and writes it to a hardware device via DirectInput or SDL. It does not need Pacejka math, suspension kinematics, or any other physics subsystem.
- Bundling FFB inside VehicleExtension would couple device API headers (DirectInput, SDL) into the physics build, creating unnecessary dependencies on Windows SDK specifics.
- A separate extension can be updated, swapped, or disabled without touching the physics DLL.
- The boundary is clean: VehicleBody exposes `get_rack_force() -> float`, and FFBExtension consumes it.

**Dependency chain:** `VehicleExtension → (consumed by) → FFBExtension`

VehicleExtension has no knowledge of FFBExtension. FFBExtension depends on VehicleExtension's GDScript API (polling the rack force property each frame). No C++ cross-linkage.

**What was ruled out:** A single monolithic extension. Rejected because it would require shipping unused device API headers on non-FFB builds (e.g. headless training server).

---

## Decision 2 — LUT Dimensionality Ceiling is 3D

**Decision:** LUT tables are capped at 3 axes. 4D+ inputs go to ONNX, not to larger LUTs.

**Reasoning — the exponential scaling problem:**
A Lut2D at 64×64 = 4 096 floats = 16 KB. Fine.
A Lut3D at 64×64×64 = 262 144 floats = 1 MB. Acceptable for pre-baked tire data.
A Lut4D at 64×64×64×64 = 16 777 216 floats = 64 MB. Unacceptable per LUT.

Beyond 3D, the data size is impractical and the gain in modelling accuracy is diminishing — because at 4+ tightly coupled continuous inputs, the system is better modelled by ONNX anyway (the runtime is already present for the driving AI).

**How apparent 4D cases decompose:**

| System | Apparent inputs | Actual strategy |
|---|---|---|
| Tire + thermal model | slip_angle, Fz, temp, compound | Factored: `Fy_base(slip, Fz)` × `temp_factor(temp)`. Two 2D LUTs. |
| Track grip per compound | speed, load, compound, temp | Discrete compound index → separate named LUT per compound. |
| Engine torque maps | RPM, throttle, boost, AFR | Only RPM + throttle in LUT; boost and AFR are scalars applied after. |
| Audio synthesis | RPM, load, throttle, gear | Analytical (AngeTheGreat-style combustion sim), not LUT. |

**The rule of thumb:** If an input can be applied as a multiplier *after* a 2D lookup (i.e. it scales the result but doesn't reshape the surface), it does not need to be a full LUT axis. If all inputs reshape the surface, that's a ONNX candidate.

**`LutND<N>` template:** Technically valid as an internal C++ refactor, but it does not change the public GDScript API or the ceiling decision. Possibly worth doing for code deduplication once Lut1D/2D/3D are all stable.

---

## Decision 3 — LUT Extension Boundary (Pending)

**Current state:** LUT classes (Lut1D, Lut2D, Lut3D, LutLoader) live inside VehicleExtension.

**The question:** Should they move to a standalone `LutExtension` that VehicleExtension, TrackConditionManager, WeatherManager, and AI reward shaping can all share?

**Arguments for extracting:**
- TrackConditionManager grip multiplier is a natural Lut2D (speed × track_temp).
- WeatherManager state transitions could be LUT-driven.
- AI reward shaping (lap time delta as function of speed + slip) is a Lut2D.

**Arguments against (current position):**
- All three non-vehicle systems are Tier 1–2 features that do not exist yet.
- Premature extraction adds build complexity before the need is proven.
- GDScript can implement these functions analytically for now.

**Resolution:** Keep LUT classes in VehicleExtension. Revisit at the start of Tier 2 when TrackConditionManager is being implemented. If it needs LUTs, extract then.

---

## Decision 4 — `reloadable = true` in Debug Builds

**Decision:** Both `.gdextension` files now set `reloadable = true`.

**Why:** The Godot editor supports reloading a GDExtension without relaunching when `reloadable = true`. After a `scons` build finishes, switching to the editor and triggering "Reload GDExtension" (or a scene re-open) picks up the new DLL. This eliminates full editor restarts during development.

**Caveat:** Hot-reload does not preserve in-memory state from the previous DLL load. Node instances that were alive under the old DLL get their native data invalidated. Always use it with a clean scene open or after closing the scene first.

---

## Decision 5 — Part Primitive System (March 2026)

**Decision:** Replace the monolithic `VehicleSolver` with a composable, data-driven Part Primitive System. Every vehicle component is built on a single general primitive (`VehiclePart`) exposed to GDScript.

**Full design:** See [[Part Primitive System — Architecture]].

**Three structural problems this solves:**
1. No per-part simulation loop — VehicleSolver was one flat force evaluation, parts couldn't evolve independently
2. LUMs as the result, not as parameters to physics — LUMs should feed computation, not replace it
3. No stateful simulation — tyre temperature, wear, engine thermal state did not exist

**What was ruled out:** A full codebase teardown. The existing LUT infrastructure, Resource classes, and registration pattern are all retained. The change is additive.

---

## Decision 6 — Two-Layer Primitive (March 2026)

**Decision:** The `VehiclePart` primitive has two distinct layers that must never be conflated:
- **Layer 1 — VehiclePart (GDCLASS):** GDScript-visible contract. Extends `Resource`. Exposes wiring declarations, identity, and state accessors. GDScript can subclass this to define new parts without C++.
- **Layer 2 — PartContext (plain C++ struct):** Hot-path data. Never a GDCLASS, never serialised, never visible to GDScript directly. Holds `PartState` (ephemeral, per-instance), `PartConfig` (from loaded Resource), `PartInputs`, and `PartOutputs`.

**Why two layers:** A `Resource` in Godot is shared by path by default — two cars loading the same `tire_spec.tres` share the same object. If simulation state lived on the Resource, two vehicles would share the same tyre temperature. Keeping state in plain C++ structs gives each `VehicleRig` an independent state pool.

**Serialisation rule:** `PartState` fields are NEVER bound with `ADD_PROPERTY`. Only `PartConfig` fields (loaded from `.tres`) are serialised. State is always ephemeral.

**What was ruled out:** Putting all five contracts as mandatory on every part. Optional contracts (state, config, wiring) are capability flags. Only `step()` and identity are mandatory.

---

## Decision 7 — VehicleRig as Graph Owner (March 2026)

**Decision:** A new class `VehicleRig` (pure C++, not a GDCLASS) owns the directed acyclic graph of `VehiclePart` instances and drives the simulation each tick.

**Responsibilities:**
- Topological evaluation order — parts are evaluated in dependency order
- Cycle detection — detected on graph build/rebuild; offending parts are disabled and logged
- Dynamic rewiring — damage can add/remove parts or disconnect ports; sets `needs_rebuild` flag; sort runs once per structural change, never per tick
- Fidelity tiers — `FULL`, `SIMPLIFIED`, `DEAD_RECKONING`; parts beyond the current tier are skipped

**Why not a GDCLASS:** The graph data structures (adjacency list, topological sort buffer) are pure C++ and carry no GDScript API surface. Exposing them would add overhead without benefit.

**What was ruled out:** Signal-based wiring. Signals are appropriate for the observability bus (HUD, telemetry, AI observation at 20–60 Hz) but too expensive for hot-path data flow at 240 Hz × N cars × N parts.

---

## Decision 8 — Fidelity Tiers for Multi-Car and Multiplayer (March 2026)

**Decision:** `VehicleRig` supports three fidelity tiers:
- `FULL` — all parts, all state, all LUM evaluation. Player car and high-priority singleplayer AI.
- `SIMPLIFIED` — tyre + suspension forces only, no thermal/wear state. Background AI cars.
- `DEAD_RECKONING` — no simulation; position and velocity from network snapshot. Multiplayer remote cars.

**Multiplayer sync model:** Client-side prediction + snapshot interpolation. Server runs `SIMPLIFIED` for all cars at 30–60 Hz, broadcasts `{position, rotation, linear_vel, angular_vel, gear, rpm}`. Player car runs `FULL` speculatively on the client; remote cars are smooth-interpolated toward server snapshots. No full-fidelity state (temperature, wear) is ever transmitted over the network.

**Why this resolves the Jolt non-determinism problem:** Remote cars in multiplayer never run the full-fidelity simulation on the client; they run position interpolation only. Server-authoritative position is used for scoring, collision, and lap timing. Client sees a smooth, corrected representation. Jolt determinism across platforms is not required.

**What was ruled out:** Running identical full-fidelity physics on all clients simultaneously. Godot's Jolt integration does not guarantee bit-exact results across platforms, making lockstep multiplayer infeasible at this fidelity level.

---

## References

- [[ONNX Infrastructure]] — shared inference runtime architecture
- [[Trackside MVP Vision]] — §4 GDExtension conventions, §10 Physics Reference
- [[Part Primitive System — Architecture]] — detailed design for Decisions 5–8
- VehicleExtension `.github/copilot-instructions.md` — binding conventions and hot-path rules

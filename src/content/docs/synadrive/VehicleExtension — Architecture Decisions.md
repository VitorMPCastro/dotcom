---
title: VehicleExtension — Architecture Decisions
aliases: [VehicleExtension — Architecture Decisions]
linter-yaml-title-alias: VehicleExtension — Architecture Decisions
tags:
  - Synadrive
  - gdextension
  - architecture
  - vehicle-physics
type: architecture-decision
created: 2026-03-11
updated: 2026-03-11
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

## References

- [[ONNX Infrastructure]] — shared inference runtime architecture
- [[Synadrive MVP Vision]] — §4 GDExtension conventions, §10 Physics Reference
- VehicleExtension `.github/copilot-instructions.md` — binding conventions and hot-path rules

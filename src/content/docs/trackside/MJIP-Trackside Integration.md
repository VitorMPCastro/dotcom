---
title: MJIP–Trackside Integration
description: How MJIP connects to Trackside — the boundary, the contract, and what each side owns.
sidebar:
  order: 5
---

# MJIP–Trackside Integration

MJIP is the physics engine. Trackside is the game. This note defines the boundary between them.

---

## The Model

MJIP is treated as a **black box with a well-defined interface**. Trackside does not own or maintain MJIP internals — it calls MJIP's API and trusts the result. The physics engine's implementation details are irrelevant to the game layer as long as the contract holds.

```
Trackside (GDScript / C++)
        |
        |  calls
        v
  MJIP GDExtension API   <-- boundary
        |
        |  runs
        v
  Jolt Physics Engine
```

Everything above the line is Trackside's problem. Everything below is MJIP's problem.

---

## What Trackside Owns

- Vehicle definitions: part composition, mass properties, joint configuration.
- Input routing: player controls → MJIP force inputs.
- Output consumption: MJIP rigid body state → Godot node transforms, audio cues, VFX.
- Simulation stepping: calling MJIP's tick at the right rate (fixed physics tick, not frame rate).
- Save/load: serialising vehicle state for replay, multiplayer sync, and career persistence.

## What MJIP Owns

- Rigid body integration (semi-implicit Euler).
- Constraint solving (joints, contacts).
- Force application (tyre, suspension, aero, drivetrain forces fed from Trackside).
- Collision detection (via Jolt).
- Determinism guarantees.

---

## Integration Points

| Trackside calls | MJIP provides |
|---|---|
| `create_vehicle(spec)` | Vehicle body handle |
| `set_input(handle, throttle, steer, brake)` | — |
| `step(dt)` | Updated transforms for all bodies |
| `get_contact_forces(handle)` | Per-wheel force data |
| `destroy_vehicle(handle)` | — |

*This table reflects the intended interface, not a final API contract. Exact method names subject to change.*

---

## What This Note Is Not

This is a **boundary note**, not an implementation plan. It documents the relationship and responsibilities so that anyone touching either side knows where the seam is.

For MJIP internals, see [[MJIP — Overview]].
For the vehicle hardware model, see [[Part Primitive System — Architecture]].
For the legacy Pacejka/GDExtension approach this replaces, see [[Vehicle Physics (Legacy)/Vehicle Physics — Index]].

---

## Related

- [[MJIP — Overview]] — Full MJIP documentation.
- [[What Is Trackside]] — Scope and vision.
- [[Trackside — Design Philosophy]] — Why this architecture exists.
- [[VehicleExtension — Architecture Decisions]] — ADR log for the Godot integration layer.

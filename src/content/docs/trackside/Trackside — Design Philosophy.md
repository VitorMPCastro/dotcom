---
title: Trackside — Design Philosophy
description: The core design model behind Trackside — sandbox-first, tools not roles, and the layered architecture pattern.
sidebar:
  order: 2
---

# Trackside — Design Philosophy

Trackside is a **physics sandbox** built around a single conviction: give the player tools, not a job title.

The game does not assign you the role of driver, engineer, or team principal. It hands you a paddock and steps back. You decide what you do with it. AI fills every role you choose not to take. If you want to tune suspension, tune it. If you want to hand the car to an AI driver and watch, watch. The motorsport framing is a nudge, not a constraint.

---

## The Layered Architecture Pattern

Trackside is designed in two distinct layers: an **engine** and a **game**.

The engine is the simulation — deterministic, physics-grounded vehicle behaviour with no awareness of races, teams, or progression. It is a self-contained tool that answers one question: given this vehicle state and these forces, what happens next?

The game is everything built on top of that: team management, AI drivers, race weekends, career arcs. It calls into the engine but does not own it.

The key design constraint is that **the game is a mod loaded on top of the engine** — not the other way around. The engine cannot degrade into a black box that only serves the scripted game experience. The sandbox exposes it directly to the player. If the player wants to bypass the career layer entirely and experiment with raw vehicle behaviour, that must be possible without fighting the architecture.

This separation keeps both layers honest. The engine stays physically correct because it has no incentive to fake it for gameplay. The game stays clean because it cannot reach into engine internals to patch over simulation problems.

---

## MessyerStyle Applied

The [MessyerStyle](https://github.com/VitorMPCastro/praxis) philosophy governs how Trackside is built:

**Safety > Performance > DX**

In practice for Trackside:

- Physics correctness is non-negotiable. A car that passes through a wall is worse than a car that runs at 30fps.
- Simulation fidelity comes before framerate tricks. MJIP's semi-implicit Euler integration was chosen for its numerical stability under large timesteps — a property that matters more than implementation simplicity.
- Developer experience is important but secondary. Internal scaffolding should be clean, but not at the cost of simulation integrity.

---

## What "Sandbox" Means Here

Sandbox does not mean "open world" or "no structure." It means:

1. **No enforced role.** The player chooses their level of involvement in each aspect of team operation.
2. **Physics-first.** Vehicle behaviour is physically grounded, not tuned to feel good. If it feels wrong, the model is wrong.
3. **Modular by default.** Systems are composable. Adding a new tyre compound or suspension geometry does not require touching unrelated code. See [[Part Primitive System — Architecture]] for the hardware model.
4. **AI fills gaps, not the spotlight.** AI drivers, engineers, and strategists are competent understudies, not characters with story arcs.

---

## Related

- [[What Is Trackside]] — High-level overview and scope.
- [[MJIP — Overview]] — The physics engine that makes the sandbox credible.
- [[Part Primitive System — Architecture]] — How vehicle hardware is represented.
- [[Trackside — Index]] — Entry point.

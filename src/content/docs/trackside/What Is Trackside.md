---
tags:
  - Trackside
title: What Is Trackside
---

# What Is Trackside

Trackside is a motorsport simulation game where the player can take **any role on a racing team** — driver, race engineer, strategist, or team principal — while AI fills the remaining roles. It sits somewhere between a simracing title and an AI trainer sandbox.

---

## Where Trackside Came From

The project started from a desire to build a game where I can train my own AI to do something meaningful. It is the continuation of a college project where I made a 2D game about training an AI to drive on a version of the Interlagos circuit.

That project answered the core question — can a self-trained AI learn to drive? — but left everything else open: what does the player actually *do*, and what makes the game interesting beyond watching an agent converge?

---

## What Is My Aim for Trackside?

Two targets that reinforce each other:

1. **Assetto Corsa-level vehicle physics.** Pacejka tire model, realistic suspension kinematics, proper aero and drivetrain — not an approximation. The simulation must be credible to someone who knows what they are looking at.

2. **A fully fleshed AI training feature.** The player trains AI agents that fill roles on the team. Agents learn, have personalities, accumulate race history, and communicate. The training system is gameplay, not a background process.

---

## What Is the Gameloop?

The core concept is that **every role on a motorsport team can be played or delegated to AI**:

- **Driver** — take the wheel yourself, or let your AI driver race while you manage from the pit wall.
- **Race Engineer** — tune the car setup, call strategy, manage tire and fuel windows.
- **Strategist** — read the race data, decide when to pit, manage the championship picture.
- **Team Principal** — oversee the full operation, hire and develop drivers and engineers, make contract decisions.

Any role the player does not take is filled by an AI agent. The player can shift roles between sessions, or hand off roles mid-race if the game supports it. The game is about the whole team, not just the car.

The competition goal remains: train and manage a team that achieves the fastest times and wins championships.

---

## Related

- [[Trackside — Index]] — full vault map
- [[Trackside MVP Vision]] — 5-tier roadmap and feature scope
- [[MJIP — Overview]] — the physics engine Trackside is built on

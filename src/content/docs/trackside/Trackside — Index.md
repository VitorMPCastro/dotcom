---
title: Trackside
description: Entry point for all Trackside game design and architecture documentation.
sidebar:
  order: 1
---

# Trackside

A physics sandbox built on MJIP/Jolt. Take any role in a motorsport team — or none. AI fills what you don't.

---

## Start Here

- [[What Is Trackside]] — Scope, vision, and what makes this different.
- [[Trackside — Design Philosophy]] — The Layered Architecture Plan, MessyerStyle, sandbox-first design.
- [[MJIP-Trackside Integration]] — Where MJIP ends and Trackside begins.

---

## Physics Foundation

- [[MJIP — Overview]] — The physics engine. Read this first if you're touching anything vehicle-related.
- [[Part Primitive System — Architecture]] — How vehicle hardware is modelled.
- [[VehicleExtension — Architecture Decisions]] — ADR log for the Godot integration layer.

---

## Tech Stack

- [[Tech Stack/The Godot Game Engine]] — Engine version, project settings, GDExtension conventions.

---

## Legacy (Pre-MJIP)

> [!warning] These notes describe the old VehicleController + Pacejka GDExtension approach. MJIP supersedes this work.

- [[Vehicle Physics (Legacy)/Vehicle Physics — Index]] — Overview of the old step-by-step build plan.

---

## Planning (Internal)

> Not synced to the docs site.

- `_Planning/Trackside MVP Vision.md` — Early scope document. Pre-MJIP, pre-sandbox. Kept for context.
- `_Planning/Vehicle Physics — To-do.md` — Open physics questions.

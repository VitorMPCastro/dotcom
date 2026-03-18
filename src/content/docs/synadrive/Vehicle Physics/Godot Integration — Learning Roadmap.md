---
title: Godot Integration — Learning Roadmap
aliases: [Godot Integration — Learning Roadmap]
linter-yaml-title-alias: Godot Integration — Learning Roadmap
tags:
  - Synadrive
  - gdextension
  - learning
  - editor-tooling
type: learning-plan
created: 2026-03-11
updated: 2026-03-11
---

# Godot Integration — Learning Roadmap

A structured learning path for implementing the **9-phase VehicleExtension editor integration** as a hobby project. The goal is to understand each Godot system before writing the code for it, rather than copying patterns you don't understand.

The 9 phases build on top of each other. Each phase has one or two new Godot concepts to learn. This note maps the concept gaps and the recommended resources.

---

## The 9 Phases at a Glance

| Phase | What gets built | New concept to learn |
|---|---|---|
| 1 | C++ API foundation + hot-reload | `reloadable`, `PackedStringArray`, signals |
| 2 | `LutBuilder` GDCLASS (C++) | New GDCLASS from scratch |
| 3 | Addon scaffold + build sync | `EditorPlugin`, `plugin.cfg`, SCons hooks |
| 4 | GDScript formula resources | `@tool`, custom `Resource` subclass |
| 5 | LUT generator dock | `EditorPlugin` dock, GDScript UI nodes |
| 6 | Custom resource inspectors | `EditorInspectorPlugin` |
| 7 | Viewport gizmos | `EditorNode3DGizmoPlugin` |
| 8 | Live telemetry dock | Polling in-play state, graph drawing |
| 9 | Tests + docs | GUT for GDExtension, `doc_classes` XML |

---

## Concept 1 — Signals in C++ GDExtension

**When needed:** Phase 1.

**What it is:** `ADD_SIGNAL` in `_bind_methods()` declares a signal that GDScript can `connect()` to. `emit_signal("name", args...)` fires it from `_integrate_forces()`.

**What to study:**
- Godot docs: *GDExtension — Registering signals* (short, official, correct).
- Read the existing `VehicleWheel` implementation — it already uses `emit_signal` in a few places as a reference.
- Key: signal arguments must be `Variant`-compatible types. `int`, `float`, `bool`, `String` are fine. Custom structs are not.

**Common mistake:** Calling `emit_signal` before `_bind_methods` has run (e.g. from a constructor). Always emit from lifecycle callbacks or physics callbacks only.

---

## Concept 2 — Creating a New GDCLASS from Scratch

**When needed:** Phase 2 (`LutBuilder`).

**What it is:** The full ritual for exposing a new C++ class to GDScript: header + cpp + register in `register_types.cpp` + rebuild + open Godot to verify.

**Checklist (from VehicleExtension instructions):**
1. Create `src/<module>/my_class.h` and `.cpp`
2. `#include` the header in `src/register_types.cpp`
3. `GDREGISTER_CLASS(MyClass)` inside `initialize_gdextension_types()`
4. Build, fix errors
5. Open Godot editor — verify the class appears in Add Node / Create Resource
6. Write a usage example in `project/`

**What to study:**
- Godot docs: *GDExtension C++ example* (the Hello World extension). Do this tutorial end-to-end before writing any real code.
- Pay attention to the `GDCLASS(MyClass, BaseClass)` macro — the base class must already be a registered Godot type.
- `D_METHOD("method_name", "arg1", "arg2")` — argument names appear in the Godot docs tooltip.

---

## Concept 3 — `@tool` Resources in GDScript

**When needed:** Phase 4 (formula-based LUT generators).

**What it is:** Adding `@tool` at the top of a `.gd` file makes the script run inside the editor, not just at runtime. A `Resource` subclass with `@tool` can compute data when properties change and update itself live.

**Key pattern:**
```gdscript
@tool
class_name MF96Params
extends Resource

@export var peak_force: float = 4500.0:
    set(v):
        peak_force = v
        emit_changed()  # tells the inspector to refresh
```

The trick is `emit_changed()` — this is what causes the EditorInspectorPlugin (Phase 6) to refresh its preview when the user adjusts a slider.

**What to study:**
- Godot docs: *Running code in the editor* (`@tool` scripts).
- Godot docs: *Creating custom resources*. Focus on `_validate_property()` and `emit_changed()`.
- Caution: `@tool` scripts run in the editor process. A bug that causes an infinite loop will hang the editor. Always test with `Engine.is_editor_hint()` as a guard.

---

## Concept 4 — EditorPlugin and Docks

**When needed:** Phase 3 (addon entry point) and Phase 5 (LUT generator dock).

**What it is:** `EditorPlugin` is the GDScript entry point for an editor addon. It registers docks, custom inspectors, gizmos, and menu items. The `plugin.cfg` file is what Godot reads to load it.

**Minimal `plugin.cfg`:**
```ini
[plugin]
name="VehicleExtension Tools"
description="LUT generator and telemetry tools for VehicleExtension."
author="Your Name"
version="0.1.0"
script="plugin.gd"
```

**Minimal `plugin.gd`:**
```gdscript
@tool
extends EditorPlugin

func _enter_tree() -> void:
    # Add a dock
    add_control_to_dock(DOCK_SLOT_LEFT_BR, preload("my_dock.tscn").instantiate())

func _exit_tree() -> void:
    # Clean up — required or the dock persists after disabling the plugin
    remove_control_from_docks(my_dock_instance)
    my_dock_instance.queue_free()
```

**What to study:**
- Godot docs: *Making plugins* — the official step-by-step guide. Read all of it.
- Godot docs: `EditorPlugin` class reference — full list of what you can register.
- Key lesson: `_enter_tree` / `_exit_tree` are the lifetime hooks; if you don't clean up in `_exit_tree`, disabling the plugin in Project Settings will leave stale UI.

---

## Concept 5 — EditorInspectorPlugin

**When needed:** Phase 6 (custom property drawers for TireSpec, AeroSpec, etc.).

**What it is:** Lets you replace or augment how a specific resource class is displayed in the inspector. You can draw a Pacejka force curve preview below the raw property fields.

**Key methods:**
- `_can_handle(object)` — return `true` if this is a TireSpec / AeroSpec / etc.
- `_parse_begin(object)` — add a custom Control before the property list.
- `_parse_end(object)` — add a custom Control after the property list.
- `_parse_property(...)` — intercept and replace how a specific property is drawn.

**Registration in plugin.gd:**
```gdscript
var _tire_inspector = TireSpecInspector.new()

func _enter_tree() -> void:
    add_inspector_plugin(_tire_inspector)

func _exit_tree() -> void:
    remove_inspector_plugin(_tire_inspector)
```

**What to study:**
- Godot docs: `EditorInspectorPlugin` class reference.
- Search for open-source Godot addons that draw custom curves in the inspector — GodotSteam, Dialogic, or any plugin with a curve preview. Reading real examples is faster than docs alone.
- The curve preview itself is just a `Control` node with a custom `_draw()` override. Learn `_draw()` on `Control` separately first (it's simple).

---

## Concept 6 — EditorNode3DGizmoPlugin

**When needed:** Phase 7 (wheel disc gizmos, CG point, suspension travel bar).

**What it is:** Lets you draw custom 3D overlays in the editor viewport on any node type — lines, meshes, handles. The wheel disc and suspension travel bar are just `add_lines()` calls.

**Key methods:**
- `_has_gizmo(node)` — return true for `VehicleWheel` / `VehicleBody`.
- `_create_gizmo(node)` — return an `EditorNode3DGizmo` for that node.
- On the gizmo: `add_lines(lines, material)` draws the disc/bar each frame.
- `_redraw(gizmo)` — called when the node changes; you rebuild line arrays here.

**What to study:**
- Godot docs: *Custom 3D gizmos*. The official tutorial builds a gizmo step by step.
- The disc is a `PackedVector3Array` of line pairs — calculate circle points in a loop, pair[i] = start, pair[i+1] = end.
- Suspension bar: two lines from the rest position to the current travel limit — both endpoints derived from `VehicleWheel.get_suspension_travel()`.

---

## Concept 7 — Reloadable GDExtension

**When needed:** Immediately (already done — `reloadable = true` is set).

**What it is:** When `reloadable = true` in the `.gdextension` file, the Godot editor can reload the DLL after a build without a full editor restart.

**Workflow:**
1. Make C++ changes.
2. Run `scons` in the terminal (VS Code task: *GDExtension: Build Debug (Windows)*).
3. In Godot editor: `Project → Reload Current Project` or close/reopen the scene.
4. The new DLL is loaded.

**Caveat re-stated:** Node instances lose native state across the reload. Any `_initialized` flags or cached solver state is gone. This is fine for an edit → rebuild → test workflow since you never reload mid-play.

**What to study:**
- Godot 4.3+ changelog entry on reloadable GDExtensions.
- Note that `reloadable = true` has a small overhead even when not reloading — the engine watches the file. Keep it `false` in release builds.

---

## Recommended Learning Order

If you're starting from scratch with C++ GDExtension:

1. **Do the official GDExtension Hello World** — creates a class, builds, runs. Understand the full toolchain.
2. **Read Concept 2** (GDCLASS checklist) — the ritual. Do it 3 times until it's muscle memory.
3. **Read Concept 3** (`@tool` resources) — this unlocks Phase 4 entirely.
4. **Read Concept 4** (EditorPlugin + docks) — write the addon scaffold (Phase 3) using only what you've learned.
5. **Build Phase 5 (dock)** before Phase 6 (inspector) — docks are simpler, same plugin backbone.
6. **Concept 5 (inspector)** — read one real open-source example, then write your own.
7. **Concept 6 (gizmos)** — the official tutorial is good; do it.

Don't try to learn all of this before writing code. Learn one concept, implement the phase, then move to the next. The implementation cements the concept.

---

## References

- [[Vehicle Physics]] — the step-by-step build guide (Steps 01–12)
- [[Learning Resources]] — physics and tire model references
- [[VehicleExtension — Architecture Decisions]] — decisions that inform what gets built
- Godot docs: https://docs.godotengine.org/en/stable/tutorials/plugins/editor/
- Godot docs: https://docs.godotengine.org/en/stable/tutorials/scripting/gdextension/

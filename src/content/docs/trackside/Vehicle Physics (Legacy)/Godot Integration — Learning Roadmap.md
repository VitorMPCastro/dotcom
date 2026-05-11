> [!warning] Legacy — Pre-MJIP Architecture
> This note describes the old VehicleController + Pacejka GDExtension approach. **MJIP supersedes this architecture.** Preserved for historical reference only. Do not implement from these notes without first reading [[MJIP — Overview]] and [[MJIP-Trackside Integration]].

     1|---
     2|title: Godot Integration — Learning Roadmap
     3|aliases: [Godot Integration — Learning Roadmap]
     4|linter-yaml-title-alias: Godot Integration — Learning Roadmap
     5|tags:
     6|  - Trackside
     7|  - gdextension
     8|  - learning
     9|  - editor-tooling
    10|type: learning-plan
    11|created: 2026-03-11
    12|updated: 2026-03-11
    13|---
    14|
    15|# Godot Integration — Learning Roadmap
    16|
    17|A structured learning path for implementing the **9-phase VehicleExtension editor integration** as a hobby project. The goal is to understand each Godot system before writing the code for it, rather than copying patterns you don't understand.
    18|
    19|The 9 phases build on top of each other. Each phase has one or two new Godot concepts to learn. This note maps the concept gaps and the recommended resources.
    20|
    21|---
    22|
    23|## The 9 Phases at a Glance
    24|
    25|| Phase | What gets built | New concept to learn |
    26||---|---|---|
    27|| 1 | C++ API foundation + hot-reload | `reloadable`, `PackedStringArray`, signals |
    28|| 2 | `LutBuilder` GDCLASS (C++) | New GDCLASS from scratch |
    29|| 3 | Addon scaffold + build sync | `EditorPlugin`, `plugin.cfg`, SCons hooks |
    30|| 4 | GDScript formula resources | `@tool`, custom `Resource` subclass |
    31|| 5 | LUT generator dock | `EditorPlugin` dock, GDScript UI nodes |
    32|| 6 | Custom resource inspectors | `EditorInspectorPlugin` |
    33|| 7 | Viewport gizmos | `EditorNode3DGizmoPlugin` |
    34|| 8 | Live telemetry dock | Polling in-play state, graph drawing |
    35|| 9 | Tests + docs | GUT for GDExtension, `doc_classes` XML |
    36|
    37|---
    38|
    39|## Concept 1 — Signals in C++ GDExtension
    40|
    41|**When needed:** Phase 1.
    42|
    43|**What it is:** `ADD_SIGNAL` in `_bind_methods()` declares a signal that GDScript can `connect()` to. `emit_signal("name", args...)` fires it from `_integrate_forces()`.
    44|
    45|**What to study:**
    46|- Godot docs: *GDExtension — Registering signals* (short, official, correct).
    47|- Read the existing `VehicleWheel` implementation — it already uses `emit_signal` in a few places as a reference.
    48|- Key: signal arguments must be `Variant`-compatible types. `int`, `float`, `bool`, `String` are fine. Custom structs are not.
    49|
    50|**Common mistake:** Calling `emit_signal` before `_bind_methods` has run (e.g. from a constructor). Always emit from lifecycle callbacks or physics callbacks only.
    51|
    52|---
    53|
    54|## Concept 2 — Creating a New GDCLASS from Scratch
    55|
    56|**When needed:** Phase 2 (`LutBuilder`).
    57|
    58|**What it is:** The full ritual for exposing a new C++ class to GDScript: header + cpp + register in `register_types.cpp` + rebuild + open Godot to verify.
    59|
    60|**Checklist (from VehicleExtension instructions):**
    61|1. Create `src/<module>/my_class.h` and `.cpp`
    62|2. `#include` the header in `src/register_types.cpp`
    63|3. `GDREGISTER_CLASS(MyClass)` inside `initialize_gdextension_types()`
    64|4. Build, fix errors
    65|5. Open Godot editor — verify the class appears in Add Node / Create Resource
    66|6. Write a usage example in `project/`
    67|
    68|**What to study:**
    69|- Godot docs: *GDExtension C++ example* (the Hello World extension). Do this tutorial end-to-end before writing any real code.
    70|- Pay attention to the `GDCLASS(MyClass, BaseClass)` macro — the base class must already be a registered Godot type.
    71|- `D_METHOD("method_name", "arg1", "arg2")` — argument names appear in the Godot docs tooltip.
    72|
    73|---
    74|
    75|## Concept 3 — `@tool` Resources in GDScript
    76|
    77|**When needed:** Phase 4 (formula-based LUT generators).
    78|
    79|**What it is:** Adding `@tool` at the top of a `.gd` file makes the script run inside the editor, not just at runtime. A `Resource` subclass with `@tool` can compute data when properties change and update itself live.
    80|
    81|**Key pattern:**
    82|```gdscript
    83|@tool
    84|class_name MF96Params
    85|extends Resource
    86|
    87|@export var peak_force: float = 4500.0:
    88|    set(v):
    89|        peak_force = v
    90|        emit_changed()  # tells the inspector to refresh
    91|```
    92|
    93|The trick is `emit_changed()` — this is what causes the EditorInspectorPlugin (Phase 6) to refresh its preview when the user adjusts a slider.
    94|
    95|**What to study:**
    96|- Godot docs: *Running code in the editor* (`@tool` scripts).
    97|- Godot docs: *Creating custom resources*. Focus on `_validate_property()` and `emit_changed()`.
    98|- Caution: `@tool` scripts run in the editor process. A bug that causes an infinite loop will hang the editor. Always test with `Engine.is_editor_hint()` as a guard.
    99|
   100|---
   101|
   102|## Concept 4 — EditorPlugin and Docks
   103|
   104|**When needed:** Phase 3 (addon entry point) and Phase 5 (LUT generator dock).
   105|
   106|**What it is:** `EditorPlugin` is the GDScript entry point for an editor addon. It registers docks, custom inspectors, gizmos, and menu items. The `plugin.cfg` file is what Godot reads to load it.
   107|
   108|**Minimal `plugin.cfg`:**
   109|```ini
   110|[plugin]
   111|name="VehicleExtension Tools"
   112|description="LUT generator and telemetry tools for VehicleExtension."
   113|author="Your Name"
   114|version="0.1.0"
   115|script="plugin.gd"
   116|```
   117|
   118|**Minimal `plugin.gd`:**
   119|```gdscript
   120|@tool
   121|extends EditorPlugin
   122|
   123|func _enter_tree() -> void:
   124|    # Add a dock
   125|    add_control_to_dock(DOCK_SLOT_LEFT_BR, preload("my_dock.tscn").instantiate())
   126|
   127|func _exit_tree() -> void:
   128|    # Clean up — required or the dock persists after disabling the plugin
   129|    remove_control_from_docks(my_dock_instance)
   130|    my_dock_instance.queue_free()
   131|```
   132|
   133|**What to study:**
   134|- Godot docs: *Making plugins* — the official step-by-step guide. Read all of it.
   135|- Godot docs: `EditorPlugin` class reference — full list of what you can register.
   136|- Key lesson: `_enter_tree` / `_exit_tree` are the lifetime hooks; if you don't clean up in `_exit_tree`, disabling the plugin in Project Settings will leave stale UI.
   137|
   138|---
   139|
   140|## Concept 5 — EditorInspectorPlugin
   141|
   142|**When needed:** Phase 6 (custom property drawers for TireSpec, AeroSpec, etc.).
   143|
   144|**What it is:** Lets you replace or augment how a specific resource class is displayed in the inspector. You can draw a Pacejka force curve preview below the raw property fields.
   145|
   146|**Key methods:**
   147|- `_can_handle(object)` — return `true` if this is a TireSpec / AeroSpec / etc.
   148|- `_parse_begin(object)` — add a custom Control before the property list.
   149|- `_parse_end(object)` — add a custom Control after the property list.
   150|- `_parse_property(...)` — intercept and replace how a specific property is drawn.
   151|
   152|**Registration in plugin.gd:**
   153|```gdscript
   154|var _tire_inspector = TireSpecInspector.new()
   155|
   156|func _enter_tree() -> void:
   157|    add_inspector_plugin(_tire_inspector)
   158|
   159|func _exit_tree() -> void:
   160|    remove_inspector_plugin(_tire_inspector)
   161|```
   162|
   163|**What to study:**
   164|- Godot docs: `EditorInspectorPlugin` class reference.
   165|- Search for open-source Godot addons that draw custom curves in the inspector — GodotSteam, Dialogic, or any plugin with a curve preview. Reading real examples is faster than docs alone.
   166|- The curve preview itself is just a `Control` node with a custom `_draw()` override. Learn `_draw()` on `Control` separately first (it's simple).
   167|
   168|---
   169|
   170|## Concept 6 — EditorNode3DGizmoPlugin
   171|
   172|**When needed:** Phase 7 (wheel disc gizmos, CG point, suspension travel bar).
   173|
   174|**What it is:** Lets you draw custom 3D overlays in the editor viewport on any node type — lines, meshes, handles. The wheel disc and suspension travel bar are just `add_lines()` calls.
   175|
   176|**Key methods:**
   177|- `_has_gizmo(node)` — return true for `VehicleWheel` / `VehicleBody`.
   178|- `_create_gizmo(node)` — return an `EditorNode3DGizmo` for that node.
   179|- On the gizmo: `add_lines(lines, material)` draws the disc/bar each frame.
   180|- `_redraw(gizmo)` — called when the node changes; you rebuild line arrays here.
   181|
   182|**What to study:**
   183|- Godot docs: *Custom 3D gizmos*. The official tutorial builds a gizmo step by step.
   184|- The disc is a `PackedVector3Array` of line pairs — calculate circle points in a loop, pair[i] = start, pair[i+1] = end.
   185|- Suspension bar: two lines from the rest position to the current travel limit — both endpoints derived from `VehicleWheel.get_suspension_travel()`.
   186|
   187|---
   188|
   189|## Concept 7 — Reloadable GDExtension
   190|
   191|**When needed:** Immediately (already done — `reloadable = true` is set).
   192|
   193|**What it is:** When `reloadable = true` in the `.gdextension` file, the Godot editor can reload the DLL after a build without a full editor restart.
   194|
   195|**Workflow:**
   196|1. Make C++ changes.
   197|2. Run `scons` in the terminal (VS Code task: *GDExtension: Build Debug (Windows)*).
   198|3. In Godot editor: `Project → Reload Current Project` or close/reopen the scene.
   199|4. The new DLL is loaded.
   200|
   201|**Caveat re-stated:** Node instances lose native state across the reload. Any `_initialized` flags or cached solver state is gone. This is fine for an edit → rebuild → test workflow since you never reload mid-play.
   202|
   203|**What to study:**
   204|- Godot 4.3+ changelog entry on reloadable GDExtensions.
   205|- Note that `reloadable = true` has a small overhead even when not reloading — the engine watches the file. Keep it `false` in release builds.
   206|
   207|---
   208|
   209|## Recommended Learning Order
   210|
   211|If you're starting from scratch with C++ GDExtension:
   212|
   213|1. **Do the official GDExtension Hello World** — creates a class, builds, runs. Understand the full toolchain.
   214|2. **Read Concept 2** (GDCLASS checklist) — the ritual. Do it 3 times until it's muscle memory.
   215|3. **Read Concept 3** (`@tool` resources) — this unlocks Phase 4 entirely.
   216|4. **Read Concept 4** (EditorPlugin + docks) — write the addon scaffold (Phase 3) using only what you've learned.
   217|5. **Build Phase 5 (dock)** before Phase 6 (inspector) — docks are simpler, same plugin backbone.
   218|6. **Concept 5 (inspector)** — read one real open-source example, then write your own.
   219|7. **Concept 6 (gizmos)** — the official tutorial is good; do it.
   220|
   221|Don't try to learn all of this before writing code. Learn one concept, implement the phase, then move to the next. The implementation cements the concept.
   222|
   223|---
   224|
   225|## References
   226|
   227|- [[Vehicle Physics — Index]] — navigation hub for all vehicle physics notes
   228|- [[Vehicle Physics]] — the step-by-step build guide (Steps 01–12)
   229|- [[Learning Resources]] — physics and tire model references
   230|- [[VehicleExtension — Architecture Decisions]] — decisions that inform what gets built
   231|- Godot docs: https://docs.godotengine.org/en/stable/tutorials/plugins/editor/
   232|- Godot docs: https://docs.godotengine.org/en/stable/tutorials/scripting/gdextension/
   233|
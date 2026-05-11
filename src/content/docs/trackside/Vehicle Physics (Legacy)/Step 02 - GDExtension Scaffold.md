> [!warning] Legacy — Pre-MJIP Architecture
> This note describes the old VehicleController + Pacejka GDExtension approach. **MJIP supersedes this architecture.** Preserved for historical reference only. Do not implement from these notes without first reading [[MJIP — Overview]] and [[MJIP-Trackside Integration]].

     1|---
     2|title: "Step 02 - GDExtension Scaffold"
     3|aliases: ["Step 02 - GDExtension Scaffold"]
     4|linter-yaml-title-alias: "Step 02 - GDExtension Scaffold"
     5|tags:
     6|  - Trackside
     7|  - vehicle-physics
     8|  - tier-1
     9|  - cpp
    10|  - gdextension
    11|type: impl-step
    12|step: 2
    13|status: pending
    14|language: C++
    15|files-to-create:
    16|  - src/gdextension/SConstruct
    17|  - src/gdextension/synadrive.gdextension
    18|  - src/gdextension/src/register_types.cpp
    19|  - src/gdextension/src/register_types.h
    20|created: 2026-02-26
    21|updated: 2026-02-26
    22|---
    23|
    24|# Step 02 - GDExtension Scaffold
    25|
    26|**Prerequisites:** [[Step 01 - Physics Tick Rate]]
    27|**Estimated Complexity:** L (several hours — mostly setup, not logic)
    28|
    29|---
    30|
    31|## What
    32|
    33|Create the full GDExtension directory structure, SCons build system, and `.gdextension` registration file. No vehicle logic yet — this step's goal is: **build compiles, extension loads in Godot editor, no classes exposed yet.**
    34|
    35|---
    36|
    37|## Directory Structure
    38|
    39|```
    40|src/gdextension/
    41|  SConstruct               ← SCons build script
    42|  synadrive.gdextension    ← Extension registration (loaded by Godot)
    43|  src/
    44|    register_types.cpp     ← Entry point; registers all C++ classes
    45|    register_types.h
    46|    vehicle/
    47|      tire_model.cpp       ← Step 3
    48|      tire_model.h
    49|      suspension.cpp       ← Step 4
    50|      suspension.h
    51|  godot-cpp/               ← Git submodule
    52|  bin/                     ← Build output (.gitignore this)
    53|```
    54|
    55|---
    56|
    57|## Step-by-Step
    58|
    59|### 1. Add godot-cpp Submodule
    60|
    61|From the repo root (`d:\Dev\workspace\synadrive\src\`):
    62|
    63|```bash
    64|# From repo root, one directory above src/
    65|git submodule add https://github.com/godotengine/godot-cpp src/gdextension/godot-cpp
    66|cd src/gdextension/godot-cpp
    67|git checkout godot-4.6  # Pin to Godot 4.6 branch
    68|```
    69|
    70|Then run:
    71|```bash
    72|cd src/gdextension
    73|git submodule update --init --recursive
    74|```
    75|
    76|### 2. SConstruct
    77|
    78|Copy from `godot-cpp/test/SConstruct` as a starting point. Minimum working version:
    79|
    80|```python
    81|#!/usr/bin/env python
    82|import os, sys
    83|
    84|env = SConscript("godot-cpp/SConstruct")
    85|
    86|env.Append(CPPPATH=["src/"])
    87|sources = Glob("src/*.cpp") + Glob("src/vehicle/*.cpp")
    88|
    89|if env["platform"] == "macos":
    90|    library = env.SharedLibrary(
    91|        "bin/synadrive.{}.{}.framework/synadrive.{}.{}".format(
    92|            env["platform"], env["target"], env["platform"], env["target"]
    93|        ),
    94|        source=sources,
    95|    )
    96|else:
    97|    library = env.SharedLibrary(
    98|        "bin/synadrive{}{}".format(env["suffix"], env["SHLIBSUFFIX"]),
    99|        source=sources,
   100|    )
   101|
   102|Default(library)
   103|```
   104|
   105|### 3. synadrive.gdextension
   106|
   107|Place at `src/gdextension/synadrive.gdextension`:
   108|
   109|```ini
   110|[configuration]
   111|
   112|entry_symbol = "synadrive_library_init"
   113|compatibility_minimum = "4.3"
   114|reloadable = true
   115|
   116|[libraries]
   117|
   118|windows.debug.x86_64 = "res://gdextension/bin/synadrive.windows.template_debug.x86_64.dll"
   119|windows.release.x86_64 = "res://gdextension/bin/synadrive.windows.template_release.x86_64.dll"
   120|linux.debug.x86_64 = "res://gdextension/bin/synadrive.linux.template_debug.x86_64.so"
   121|linux.release.x86_64 = "res://gdextension/bin/synadrive.linux.template_release.x86_64.so"
   122|```
   123|
   124|> **Note on `res://` path:** Godot resolves `res://` from the project root (`src/`). The `.gdextension` file itself must be placed somewhere under `res://` — put it at `src/gdextension/synadrive.gdextension` so its path is `res://gdextension/synadrive.gdextension`.
   125|
   126|### 4. register_types.h
   127|
   128|```cpp
   129|#pragma once
   130|#include <godot_cpp/core/class_db.hpp>
   131|
   132|using namespace godot;
   133|
   134|void initialize_synadrive_module(ModuleInitializationLevel p_level);
   135|void uninitialize_synadrive_module(ModuleInitializationLevel p_level);
   136|```
   137|
   138|### 5. register_types.cpp
   139|
   140|```cpp
   141|#include "register_types.h"
   142|// #include "vehicle/tire_model.h"    // uncomment in Step 3
   143|// #include "vehicle/suspension.h"    // uncomment in Step 4
   144|
   145|#include <gdextension_interface.h>
   146|#include <godot_cpp/core/defs.hpp>
   147|#include <godot_cpp/godot.hpp>
   148|
   149|using namespace godot;
   150|
   151|void initialize_synadrive_module(ModuleInitializationLevel p_level) {
   152|    if (p_level != MODULE_INITIALIZATION_LEVEL_SCENE) {
   153|        return;
   154|    }
   155|    // ClassDB::register_class<TireModel>();    // uncomment in Step 3
   156|    // ClassDB::register_class<Suspension>();   // uncomment in Step 4
   157|}
   158|
   159|void uninitialize_synadrive_module(ModuleInitializationLevel p_level) {
   160|    if (p_level != MODULE_INITIALIZATION_LEVEL_SCENE) {
   161|        return;
   162|    }
   163|}
   164|
   165|extern "C" {
   166|GDExtensionBool GDE_EXPORT synadrive_library_init(
   167|    GDExtensionInterfaceGetProcAddress p_get_proc_address,
   168|    const GDExtensionClassLibraryPtr p_library,
   169|    GDExtensionInitialization *r_initialization
   170|) {
   171|    godot::GDExtensionBinding::InitObject init_obj(p_get_proc_address, p_library, r_initialization);
   172|    init_obj.register_initializer(initialize_synadrive_module);
   173|    init_obj.register_terminator(uninitialize_synadrive_module);
   174|    init_obj.set_minimum_library_initialization_level(MODULE_INITIALIZATION_LEVEL_SCENE);
   175|    return init_obj.init();
   176|}
   177|}
   178|```
   179|
   180|---
   181|
   182|## Build Command
   183|
   184|```bash
   185|cd src/gdextension
   186|scons platform=windows target=template_debug
   187|```
   188|
   189|Expected output: `bin/synadrive.windows.template_debug.x86_64.dll`
   190|
   191|For release: `scons platform=windows target=template_release`
   192|
   193|---
   194|
   195|## Verification
   196|
   197|1. `scons` completes with exit code 0.
   198|2. Open Godot editor. Check **Project → Project Settings → Plugins** — the synadrive extension should appear (or check the Output log for extension loading messages).
   199|3. No crash on editor open.
   200|4. Extension is listed in `res://gdextension/synadrive.gdextension` when viewed from FileSystem dock.
   201|
   202|---
   203|
   204|## Gotchas
   205|
   206|- `godot-cpp` branch must match the exact Godot version. Godot 4.6 ships with a matching `godot-cpp` branch. Mismatches cause cryptic symbol errors at runtime.
   207|- SCons requires Python. On Windows, install via `pip install scons`.
   208|- The `.gdextension` file path (`res://gdextension/...`) must be reachable from Godot's filesystem. If the file isn't picked up, check that it's under `src/` (the project root).
   209|- `reloadable = true` enables hot-reloading the extension during editor use — invaluable for iteration. It has minor overhead; set to `false` for release builds.
   210|
   211|---
   212|
   213|## Related
   214|
   215|- [[Step 03 - TireModel (C++)]] — first class to register
   216|- [[Step 04 - Suspension (C++)]] — second class to register
   217|- [[Vehicle Physics]] — back to hub
   218|
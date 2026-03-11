---
title: "Step 02 - GDExtension Scaffold"
aliases: ["Step 02 - GDExtension Scaffold"]
linter-yaml-title-alias: "Step 02 - GDExtension Scaffold"
tags:
  - Synadrive
  - vehicle-physics
  - tier-1
  - cpp
  - gdextension
type: impl-step
step: 2
status: pending
language: C++
files-to-create:
  - src/gdextension/SConstruct
  - src/gdextension/synadrive.gdextension
  - src/gdextension/src/register_types.cpp
  - src/gdextension/src/register_types.h
created: 2026-02-26
updated: 2026-02-26
---

# Step 02 - GDExtension Scaffold

**Prerequisites:** [[Step 01 - Physics Tick Rate]]
**Estimated Complexity:** L (several hours — mostly setup, not logic)

---

## What

Create the full GDExtension directory structure, SCons build system, and `.gdextension` registration file. No vehicle logic yet — this step's goal is: **build compiles, extension loads in Godot editor, no classes exposed yet.**

---

## Directory Structure

```
src/gdextension/
  SConstruct               ← SCons build script
  synadrive.gdextension    ← Extension registration (loaded by Godot)
  src/
    register_types.cpp     ← Entry point; registers all C++ classes
    register_types.h
    vehicle/
      tire_model.cpp       ← Step 3
      tire_model.h
      suspension.cpp       ← Step 4
      suspension.h
  godot-cpp/               ← Git submodule
  bin/                     ← Build output (.gitignore this)
```

---

## Step-by-Step

### 1. Add godot-cpp Submodule

From the repo root (`d:\Dev\workspace\synadrive\src\`):

```bash
# From repo root, one directory above src/
git submodule add https://github.com/godotengine/godot-cpp src/gdextension/godot-cpp
cd src/gdextension/godot-cpp
git checkout godot-4.6  # Pin to Godot 4.6 branch
```

Then run:
```bash
cd src/gdextension
git submodule update --init --recursive
```

### 2. SConstruct

Copy from `godot-cpp/test/SConstruct` as a starting point. Minimum working version:

```python
#!/usr/bin/env python
import os, sys

env = SConscript("godot-cpp/SConstruct")

env.Append(CPPPATH=["src/"])
sources = Glob("src/*.cpp") + Glob("src/vehicle/*.cpp")

if env["platform"] == "macos":
    library = env.SharedLibrary(
        "bin/synadrive.{}.{}.framework/synadrive.{}.{}".format(
            env["platform"], env["target"], env["platform"], env["target"]
        ),
        source=sources,
    )
else:
    library = env.SharedLibrary(
        "bin/synadrive{}{}".format(env["suffix"], env["SHLIBSUFFIX"]),
        source=sources,
    )

Default(library)
```

### 3. synadrive.gdextension

Place at `src/gdextension/synadrive.gdextension`:

```ini
[configuration]

entry_symbol = "synadrive_library_init"
compatibility_minimum = "4.3"
reloadable = true

[libraries]

windows.debug.x86_64 = "res://gdextension/bin/synadrive.windows.template_debug.x86_64.dll"
windows.release.x86_64 = "res://gdextension/bin/synadrive.windows.template_release.x86_64.dll"
linux.debug.x86_64 = "res://gdextension/bin/synadrive.linux.template_debug.x86_64.so"
linux.release.x86_64 = "res://gdextension/bin/synadrive.linux.template_release.x86_64.so"
```

> **Note on `res://` path:** Godot resolves `res://` from the project root (`src/`). The `.gdextension` file itself must be placed somewhere under `res://` — put it at `src/gdextension/synadrive.gdextension` so its path is `res://gdextension/synadrive.gdextension`.

### 4. register_types.h

```cpp
#pragma once
#include <godot_cpp/core/class_db.hpp>

using namespace godot;

void initialize_synadrive_module(ModuleInitializationLevel p_level);
void uninitialize_synadrive_module(ModuleInitializationLevel p_level);
```

### 5. register_types.cpp

```cpp
#include "register_types.h"
// #include "vehicle/tire_model.h"    // uncomment in Step 3
// #include "vehicle/suspension.h"    // uncomment in Step 4

#include <gdextension_interface.h>
#include <godot_cpp/core/defs.hpp>
#include <godot_cpp/godot.hpp>

using namespace godot;

void initialize_synadrive_module(ModuleInitializationLevel p_level) {
    if (p_level != MODULE_INITIALIZATION_LEVEL_SCENE) {
        return;
    }
    // ClassDB::register_class<TireModel>();    // uncomment in Step 3
    // ClassDB::register_class<Suspension>();   // uncomment in Step 4
}

void uninitialize_synadrive_module(ModuleInitializationLevel p_level) {
    if (p_level != MODULE_INITIALIZATION_LEVEL_SCENE) {
        return;
    }
}

extern "C" {
GDExtensionBool GDE_EXPORT synadrive_library_init(
    GDExtensionInterfaceGetProcAddress p_get_proc_address,
    const GDExtensionClassLibraryPtr p_library,
    GDExtensionInitialization *r_initialization
) {
    godot::GDExtensionBinding::InitObject init_obj(p_get_proc_address, p_library, r_initialization);
    init_obj.register_initializer(initialize_synadrive_module);
    init_obj.register_terminator(uninitialize_synadrive_module);
    init_obj.set_minimum_library_initialization_level(MODULE_INITIALIZATION_LEVEL_SCENE);
    return init_obj.init();
}
}
```

---

## Build Command

```bash
cd src/gdextension
scons platform=windows target=template_debug
```

Expected output: `bin/synadrive.windows.template_debug.x86_64.dll`

For release: `scons platform=windows target=template_release`

---

## Verification

1. `scons` completes with exit code 0.
2. Open Godot editor. Check **Project → Project Settings → Plugins** — the synadrive extension should appear (or check the Output log for extension loading messages).
3. No crash on editor open.
4. Extension is listed in `res://gdextension/synadrive.gdextension` when viewed from FileSystem dock.

---

## Gotchas

- `godot-cpp` branch must match the exact Godot version. Godot 4.6 ships with a matching `godot-cpp` branch. Mismatches cause cryptic symbol errors at runtime.
- SCons requires Python. On Windows, install via `pip install scons`.
- The `.gdextension` file path (`res://gdextension/...`) must be reachable from Godot's filesystem. If the file isn't picked up, check that it's under `src/` (the project root).
- `reloadable = true` enables hot-reloading the extension during editor use — invaluable for iteration. It has minor overhead; set to `false` for release builds.

---

## Related

- [[Step 03 - TireModel (C++)]] — first class to register
- [[Step 04 - Suspension (C++)]] — second class to register
- [[Vehicle Physics]] — back to hub

---
title: Vehicle Physics — Simulation Tools
aliases: [Vehicle Physics — Simulation Tools]
linter-yaml-title-alias: Vehicle Physics — Simulation Tools
tags:
  - Synadrive
  - vehicle-physics
  - tools
  - reference
  - open-source
type: reference
created: 2026-02-26
updated: 2026-02-26
---

# Vehicle Physics — Simulation Tools

Open source and FOSS tools used by manufacturers, racing teams, and research institutions for vehicle dynamics simulation. Organized by category. These are the tools that feed data into Synadrive's LUT-based physics pipeline — not runtime dependencies.

> **Key principle:** Most of these tools are used *offline* to generate or validate the LUT tables that Synadrive's C++ physics solver consumes at runtime.

---

## Tier 1 Priority — Use These First

| Tool | Purpose | When |
|---|---|---|
| **MFeval** | Validate tire LUT output against reference MF6.2 | When baking Pacejka coefficients |
| **OpenModelica** | Extract suspension kinematic curves | When authoring `SuspensionSpec` LUTs |
| **OpenFOAM + Gmsh** | Generate real aero LUT data from car geometry | When authoring `AeroSpec` LUTs |
| **OpenWAM** | Generate physically correct engine torque LUTs | When authoring `EngineSpec` LUTs |
| **FastF1** | Real-world F1 telemetry validation data | Throughout — compare sim to real-world traces |
| **OpenLAP** | Validate whole-car performance numbers | Once the full physics pipeline is running |

---

## 1. Tire Modeling

### MFeval
**License:** MIT
**Source:** [github.com/tyre-models/MFeval](https://github.com/tyre-models/MFeval)
**Language:** MATLAB, with Python ports available.

The reference open implementation of the full Pacejka **MF6.2 combined slip model**. This is the tool you validate your LUT generator against — run the same inputs through MFeval and compare outputs to ensure your baked tables are correct.

**How to use in Synadrive:** Run your `CarSpec`'s Pacejka coefficients through MFeval, export the Fy/Fx/Mz curves, overlay them against your LUT generator outputs. Error must be below target tolerance.

Used by: university racing programs (FSAE), tire research labs.

---

### OpenTIRE
**License:** Apache 2.0
**Source:** OpenTIRE consortium — search for current repository.

A standardized API for tire models. Not a tire model itself, but a wrapper standard so different tire models (Pacejka, FTire, etc.) plug into the same interface.

**How to use in Synadrive:** Defines the I/O contract your `TireModel` C++ class should mirror — particularly what inputs (slip angle, slip ratio, Fz, camber) and outputs (Fx, Fy, Mz) are expected.

---

### FSAE TTC (Formula SAE Tire Test Consortium)
**License:** Member access, but fitted coefficients are widely shared by FSAE teams.
**Source:** [fsae.com/tires](https://www.fsae.com/tires)

Physical tire test data from a real test rig — the canonical source of real Pacejka B, C, D, E coefficients for race tires. The TNO MF-Tool (commercial) fits these coefficients; the resulting data is what your LUT generator ingests.

**How to use in Synadrive:** Use published FSAE TTC coefficient sets as the input data for your three car classes. Many teams have published their fitted coefficients in papers and GitHub repos. Search: `FSAE TTC Pacejka coefficients site:github.com`.

---

## 2. Vehicle Dynamics / Multi-Body

### OpenModelica
**License:** GPL / OSMC-PL (FOSS)
**Source:** [openmodelica.org](https://openmodelica.org)
**Language:** Modelica (equation-based)

The FOSS implementation of the Modelica language. Modelica is equation-based — you write physics equations and the solver handles the ODE/DAE system automatically. Genuinely used in production by Daimler, BMW, and Volvo for powertrain and chassis simulation.

The `Modelica.Mechanics.MultiBody` standard library provides a full rigid body dynamics toolkit. You can simulate a complete suspension corner, extract kinematic curves (camber vs. travel, toe vs. travel), export to CSV, and feed directly into your LUT generator.

**How to use in Synadrive:** Model a double-wishbone suspension corner with your geometry parameters. Sweep suspension travel from full droop to full compression. Export the resulting camber, toe, and caster angle curves → these become the 1D LUTs in `SuspensionSpec`.

---

### OpenVD (Open Vehicle Dynamics)
**License:** MIT
**Source:** [github.com/andresmendes/openvd](https://github.com/andresmendes/openvd)
**Language:** Python and MATLAB

Implements: Pacejka tires, bicycle model, full 4-wheel vehicle, LSD differential. Mathematically rigorous despite being an academic project.

**How to use in Synadrive:** Validate your combined slip behavior against OpenVD's known-correct implementation. If both produce the same corner forces for the same inputs, your LUT tables are correct.

---

### PyDy / SymPy Mechanics
**License:** BSD
**Source:** [pydy.org](http://pydy.org)
**Language:** Python

Symbolic multi-body dynamics. Define a system symbolically (bodies, joints, constraints) and it derives the equations of motion automatically. Useful for deriving exact suspension kinematics equations before baking them into LUTs.

**How to use in Synadrive:** Derive the symbolic equations for your suspension geometry → evaluate numerically across the travel range → export as LUT data.

---

## 3. Suspension Kinematics

> **Honest assessment:** There is no mature, widely-adopted FOSS tool here equivalent to commercial options like SusProg3D or OptimumKinematics. Most teams write their own (as we are) or use OpenModelica's `MultiBody` library (see above, Category 2).

**Practical approach for Synadrive:** Use OpenModelica to simulate the geometry, or hand-derive the kinematics with PyDy. Several FSAE teams have published their own Python suspension kinematic solvers under permissive licenses — search GitHub: `fsae suspension kinematics python`.

---

## 4. CFD / Aerodynamics

### OpenFOAM
**License:** GPL
**Source:** [openfoam.com](https://www.openfoam.com) | [openfoam.org](https://www.openfoam.org)

**Legitimately used by Formula 1 teams.** Red Bull, Mercedes, and others use OpenFOAM for CFD work alongside their proprietary in-house solvers. It is the gold standard FOSS CFD tool.

For Synadrive: run simplified car geometry through OpenFOAM's `simpleFoam` (steady-state incompressible) solver to extract real Cd, Cl, and ride-height-dependent downforce curves → these become your `AeroSpec` LUT data.

**How to use in Synadrive:**
1. Export a simplified car body mesh from Blender/FreeCAD.
2. Generate a CFD mesh with Gmsh (see below).
3. Run `simpleFoam` across a sweep of ride heights and speeds.
4. Extract force coefficients at each point → these are your LUT data points.

---

### SU2
**License:** LGPL
**Source:** [github.com/su2code/SU2](https://github.com/su2code/SU2)
**Language:** C++

Stanford University Unstructured solver. Aerospace-focused but handles external aerodynamics well. Cleaner API than OpenFOAM, easier to script automated parameter sweeps.

**When to prefer over OpenFOAM:** When you want scripted batch jobs (e.g., sweep ride height from 20mm to 80mm automatically) and need cleaner output parsing.

---

### Gmsh
**License:** GPL
**Source:** [gmsh.info](https://gmsh.info)

Mesh generator — not a solver, but a required step before OpenFOAM or SU2. Converts your car geometry (exported from Blender or FreeCAD) into a computational mesh.

---

### ParaView
**License:** BSD
**Source:** [paraview.org](https://www.paraview.org)

Post-processing and visualization of CFD results. Used to extract force-vs-parameter tables from OpenFOAM or SU2 output — the last step before writing LUT data files.

---

## 5. Engine / Powertrain Simulation

### OpenWAM
**License:** GPL
**Source:** [openwave.upv.es](https://openwave.upv.es)
**Institution:** Universidad Politécnica de Valencia (one of the leading engine research institutions in the world)

Full 1D gas dynamics simulation: intake manifold, exhaust, turbocharger, intercooler, wastegate. Used by real OEM research departments. This is how you generate a physically correct engine torque LUT rather than guessing the curve shape.

**How to use in Synadrive:** Define your engine geometry (bore, stroke, compression ratio, valve timing). Run a sweep over RPM and throttle position. Export the torque and power map → this becomes `EngineSpec.torque_lut` (2D LUT: RPM × throttle → Nm).

---

### Julia + ModelingToolkit.jl
**License:** MIT
**Source:** [github.com/SciML/ModelingToolkit.jl](https://github.com/SciML/ModelingToolkit.jl)
**Language:** Julia

Symbolic-numeric system used increasingly in automotive powertrain research — you write thermodynamic equations, it JIT-compiles an ODE solver. Used by research labs for engine cycle simulation. A modern alternative to OpenWAM for custom engine models.

---

### LibreEMS
**License:** GPL
**Source:** [libreems.org](http://libreems.org)

Open source engine management system firmware. Not a simulator, but its published fuel/ignition map formats define the canonical 2D LUT structure `(RPM, load) → output` — exactly the structure your `EngineSpec` LUT mirrors.

**How to use in Synadrive:** Reference for how to structure fuel maps and ignition advance tables. Good source of real-world engine map data shared by the tuning community.

---

## 6. Data Acquisition & Telemetry Validation

### FastF1
**License:** MIT
**Source:** [github.com/theOehrly/Fast-F1](https://github.com/theOehrly/Fast-F1)
**Language:** Python

Official Formula 1 telemetry data via the F1 data API. Available data per lap: throttle, brake, gear, speed, tyre compound, tyre life, pit stop timing, sector times, DRS, ERS. All real, all free.

**How to use in Synadrive:** Extract a real car's throttle/brake/speed trace. Run the same input sequence through your physics model. Compare simulated corner speeds, braking distances, and lap times against the real data. This is your primary real-world validation tool.

Example validation questions:
- Does your GT car simulate the correct braking distance into a heavy braking zone?
- Does your formula car hit the correct minimum corner speed for a given downforce level?
- Does your tyre model show the correct degradation rate over a stint?

---

## 7. Lap Simulation

### OpenLAP
**License:** MIT
**Source:** [github.com/LVMS/OpenLAP](https://github.com/LVMS/OpenLAP)
**Language:** Python

Quasi-static lap simulation. Takes your car's Pacejka coefficients, powertrain curve, and aero data → outputs minimum lap time and speed trace. Directly useful for validating that your `CarSpec` parameters produce sensible real-world performance numbers.

**How to use in Synadrive:** After authoring a `CarSpec` (GT3, Formula, Road), run it through OpenLAP on a known circuit. Compare the simulated lap time against real-world references. If your GT3 car simulates a 1:35 at Silverstone GP but the real car does a 1:58, your parameters are wrong.

---

### OpenTRACK
**License:** MIT
**Source:** [github.com/LVMS/OpenTRACK](https://github.com/LVMS/OpenTRACK)
**Language:** Python

Companion to OpenLAP. Generates the track model from GPS coordinates or manually defined circuit geometry. Required input for OpenLAP simulations.

---

### OptimumLap
**License:** Proprietary freeware (not open source)
**Source:** [optimumg.com/optimumlap](https://optimumg.com/optimumlap)

OptimumG's lap simulation tool — not open source, but free to use and the de facto standard for FSAE teams. Useful for quick reality checks even without source access.

---

## See Also

- [[Learning Resources]] — books and articles for understanding the theory behind these tools
- [[Step 03 - TireModel (C++)]] — where MFeval validation fits in the implementation pipeline
- [[Step 05 - CarSpec Resource]] — where LUT data from these tools is consumed
- [[Step 06 - AeroModel]] — where OpenFOAM data feeds in

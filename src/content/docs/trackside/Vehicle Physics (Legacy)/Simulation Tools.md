> [!warning] Legacy — Pre-MJIP Architecture
> This note describes the old VehicleController + Pacejka GDExtension approach. **MJIP supersedes this architecture.** Preserved for historical reference only. Do not implement from these notes without first reading [[MJIP — Overview]] and [[MJIP-Trackside Integration]].

     1|---
     2|title: Vehicle Physics — Simulation Tools
     3|aliases: [Vehicle Physics — Simulation Tools]
     4|linter-yaml-title-alias: Vehicle Physics — Simulation Tools
     5|tags:
     6|  - Trackside
     7|  - vehicle-physics
     8|  - tools
     9|  - reference
    10|  - open-source
    11|type: reference
    12|created: 2026-02-26
    13|updated: 2026-02-26
    14|---
    15|
    16|# Vehicle Physics — Simulation Tools
    17|
    18|Open source and FOSS tools used by manufacturers, racing teams, and research institutions for vehicle dynamics simulation. Organized by category. These are the tools that feed data into Trackside's LUT-based physics pipeline — not runtime dependencies.
    19|
    20|> **Key principle:** Most of these tools are used *offline* to generate or validate the LUT tables that Trackside's C++ physics solver consumes at runtime.
    21|
    22|---
    23|
    24|## Tier 1 Priority — Use These First
    25|
    26|| Tool | Purpose | When |
    27||---|---|---|
    28|| **MFeval** | Validate tire LUT output against reference MF6.2 | When baking Pacejka coefficients |
    29|| **OpenModelica** | Extract suspension kinematic curves | When authoring `SuspensionSpec` LUTs |
    30|| **OpenFOAM + Gmsh** | Generate real aero LUT data from car geometry | When authoring `AeroSpec` LUTs |
    31|| **OpenWAM** | Generate physically correct engine torque LUTs | When authoring `EngineSpec` LUTs |
    32|| **FastF1** | Real-world F1 telemetry validation data | Throughout — compare sim to real-world traces |
    33|| **OpenLAP** | Validate whole-car performance numbers | Once the full physics pipeline is running |
    34|
    35|---
    36|
    37|## 1. Tire Modeling
    38|
    39|### MFeval
    40|**License:** MIT
    41|**Source:** [github.com/tyre-models/MFeval](https://github.com/tyre-models/MFeval)
    42|**Language:** MATLAB, with Python ports available.
    43|
    44|The reference open implementation of the full Pacejka **MF6.2 combined slip model**. This is the tool you validate your LUT generator against — run the same inputs through MFeval and compare outputs to ensure your baked tables are correct.
    45|
    46|**How to use in Trackside:** Run your `CarSpec`'s Pacejka coefficients through MFeval, export the Fy/Fx/Mz curves, overlay them against your LUT generator outputs. Error must be below target tolerance.
    47|
    48|Used by: university racing programs (FSAE), tire research labs.
    49|
    50|---
    51|
    52|### OpenTIRE
    53|**License:** Apache 2.0
    54|**Source:** OpenTIRE consortium — search for current repository.
    55|
    56|A standardized API for tire models. Not a tire model itself, but a wrapper standard so different tire models (Pacejka, FTire, etc.) plug into the same interface.
    57|
    58|**How to use in Trackside:** Defines the I/O contract your `TireModel` C++ class should mirror — particularly what inputs (slip angle, slip ratio, Fz, camber) and outputs (Fx, Fy, Mz) are expected.
    59|
    60|---
    61|
    62|### FSAE TTC (Formula SAE Tire Test Consortium)
    63|**License:** Member access, but fitted coefficients are widely shared by FSAE teams.
    64|**Source:** [fsae.com/tires](https://www.fsae.com/tires)
    65|
    66|Physical tire test data from a real test rig — the canonical source of real Pacejka B, C, D, E coefficients for race tires. The TNO MF-Tool (commercial) fits these coefficients; the resulting data is what your LUT generator ingests.
    67|
    68|**How to use in Trackside:** Use published FSAE TTC coefficient sets as the input data for your three car classes. Many teams have published their fitted coefficients in papers and GitHub repos. Search: `FSAE TTC Pacejka coefficients site:github.com`.
    69|
    70|---
    71|
    72|## 2. Vehicle Dynamics / Multi-Body
    73|
    74|### OpenModelica
    75|**License:** GPL / OSMC-PL (FOSS)
    76|**Source:** [openmodelica.org](https://openmodelica.org)
    77|**Language:** Modelica (equation-based)
    78|
    79|The FOSS implementation of the Modelica language. Modelica is equation-based — you write physics equations and the solver handles the ODE/DAE system automatically. Genuinely used in production by Daimler, BMW, and Volvo for powertrain and chassis simulation.
    80|
    81|The `Modelica.Mechanics.MultiBody` standard library provides a full rigid body dynamics toolkit. You can simulate a complete suspension corner, extract kinematic curves (camber vs. travel, toe vs. travel), export to CSV, and feed directly into your LUT generator.
    82|
    83|**How to use in Trackside:** Model a double-wishbone suspension corner with your geometry parameters. Sweep suspension travel from full droop to full compression. Export the resulting camber, toe, and caster angle curves → these become the 1D LUTs in `SuspensionSpec`.
    84|
    85|---
    86|
    87|### OpenVD (Open Vehicle Dynamics)
    88|**License:** MIT
    89|**Source:** [github.com/andresmendes/openvd](https://github.com/andresmendes/openvd)
    90|**Language:** Python and MATLAB
    91|
    92|Implements: Pacejka tires, bicycle model, full 4-wheel vehicle, LSD differential. Mathematically rigorous despite being an academic project.
    93|
    94|**How to use in Trackside:** Validate your combined slip behavior against OpenVD's known-correct implementation. If both produce the same corner forces for the same inputs, your LUT tables are correct.
    95|
    96|---
    97|
    98|### PyDy / SymPy Mechanics
    99|**License:** BSD
   100|**Source:** [pydy.org](http://pydy.org)
   101|**Language:** Python
   102|
   103|Symbolic multi-body dynamics. Define a system symbolically (bodies, joints, constraints) and it derives the equations of motion automatically. Useful for deriving exact suspension kinematics equations before baking them into LUTs.
   104|
   105|**How to use in Trackside:** Derive the symbolic equations for your suspension geometry → evaluate numerically across the travel range → export as LUT data.
   106|
   107|---
   108|
   109|## 3. Suspension Kinematics
   110|
   111|> **Honest assessment:** There is no mature, widely-adopted FOSS tool here equivalent to commercial options like SusProg3D or OptimumKinematics. Most teams write their own (as we are) or use OpenModelica's `MultiBody` library (see above, Category 2).
   112|
   113|**Practical approach for Trackside:** Use OpenModelica to simulate the geometry, or hand-derive the kinematics with PyDy. Several FSAE teams have published their own Python suspension kinematic solvers under permissive licenses — search GitHub: `fsae suspension kinematics python`.
   114|
   115|---
   116|
   117|## 4. CFD / Aerodynamics
   118|
   119|### OpenFOAM
   120|**License:** GPL
   121|**Source:** [openfoam.com](https://www.openfoam.com) | [openfoam.org](https://www.openfoam.org)
   122|
   123|**Legitimately used by Formula 1 teams.** Red Bull, Mercedes, and others use OpenFOAM for CFD work alongside their proprietary in-house solvers. It is the gold standard FOSS CFD tool.
   124|
   125|For Trackside: run simplified car geometry through OpenFOAM's `simpleFoam` (steady-state incompressible) solver to extract real Cd, Cl, and ride-height-dependent downforce curves → these become your `AeroSpec` LUT data.
   126|
   127|**How to use in Trackside:**
   128|1. Export a simplified car body mesh from Blender/FreeCAD.
   129|2. Generate a CFD mesh with Gmsh (see below).
   130|3. Run `simpleFoam` across a sweep of ride heights and speeds.
   131|4. Extract force coefficients at each point → these are your LUT data points.
   132|
   133|---
   134|
   135|### SU2
   136|**License:** LGPL
   137|**Source:** [github.com/su2code/SU2](https://github.com/su2code/SU2)
   138|**Language:** C++
   139|
   140|Stanford University Unstructured solver. Aerospace-focused but handles external aerodynamics well. Cleaner API than OpenFOAM, easier to script automated parameter sweeps.
   141|
   142|**When to prefer over OpenFOAM:** When you want scripted batch jobs (e.g., sweep ride height from 20mm to 80mm automatically) and need cleaner output parsing.
   143|
   144|---
   145|
   146|### Gmsh
   147|**License:** GPL
   148|**Source:** [gmsh.info](https://gmsh.info)
   149|
   150|Mesh generator — not a solver, but a required step before OpenFOAM or SU2. Converts your car geometry (exported from Blender or FreeCAD) into a computational mesh.
   151|
   152|---
   153|
   154|### ParaView
   155|**License:** BSD
   156|**Source:** [paraview.org](https://www.paraview.org)
   157|
   158|Post-processing and visualization of CFD results. Used to extract force-vs-parameter tables from OpenFOAM or SU2 output — the last step before writing LUT data files.
   159|
   160|---
   161|
   162|## 5. Engine / Powertrain Simulation
   163|
   164|### OpenWAM
   165|**License:** GPL
   166|**Source:** [openwave.upv.es](https://openwave.upv.es)
   167|**Institution:** Universidad Politécnica de Valencia (one of the leading engine research institutions in the world)
   168|
   169|Full 1D gas dynamics simulation: intake manifold, exhaust, turbocharger, intercooler, wastegate. Used by real OEM research departments. This is how you generate a physically correct engine torque LUT rather than guessing the curve shape.
   170|
   171|**How to use in Trackside:** Define your engine geometry (bore, stroke, compression ratio, valve timing). Run a sweep over RPM and throttle position. Export the torque and power map → this becomes `EngineSpec.torque_lut` (2D LUT: RPM × throttle → Nm).
   172|
   173|---
   174|
   175|### Julia + ModelingToolkit.jl
   176|**License:** MIT
   177|**Source:** [github.com/SciML/ModelingToolkit.jl](https://github.com/SciML/ModelingToolkit.jl)
   178|**Language:** Julia
   179|
   180|Symbolic-numeric system used increasingly in automotive powertrain research — you write thermodynamic equations, it JIT-compiles an ODE solver. Used by research labs for engine cycle simulation. A modern alternative to OpenWAM for custom engine models.
   181|
   182|---
   183|
   184|### LibreEMS
   185|**License:** GPL
   186|**Source:** [libreems.org](http://libreems.org)
   187|
   188|Open source engine management system firmware. Not a simulator, but its published fuel/ignition map formats define the canonical 2D LUT structure `(RPM, load) → output` — exactly the structure your `EngineSpec` LUT mirrors.
   189|
   190|**How to use in Trackside:** Reference for how to structure fuel maps and ignition advance tables. Good source of real-world engine map data shared by the tuning community.
   191|
   192|---
   193|
   194|## 6. Data Acquisition & Telemetry Validation
   195|
   196|### FastF1
   197|**License:** MIT
   198|**Source:** [github.com/theOehrly/Fast-F1](https://github.com/theOehrly/Fast-F1)
   199|**Language:** Python
   200|
   201|Official Formula 1 telemetry data via the F1 data API. Available data per lap: throttle, brake, gear, speed, tyre compound, tyre life, pit stop timing, sector times, DRS, ERS. All real, all free.
   202|
   203|**How to use in Trackside:** Extract a real car's throttle/brake/speed trace. Run the same input sequence through your physics model. Compare simulated corner speeds, braking distances, and lap times against the real data. This is your primary real-world validation tool.
   204|
   205|Example validation questions:
   206|- Does your GT car simulate the correct braking distance into a heavy braking zone?
   207|- Does your formula car hit the correct minimum corner speed for a given downforce level?
   208|- Does your tyre model show the correct degradation rate over a stint?
   209|
   210|---
   211|
   212|## 7. Lap Simulation
   213|
   214|### OpenLAP
   215|**License:** MIT
   216|**Source:** [github.com/LVMS/OpenLAP](https://github.com/LVMS/OpenLAP)
   217|**Language:** Python
   218|
   219|Quasi-static lap simulation. Takes your car's Pacejka coefficients, powertrain curve, and aero data → outputs minimum lap time and speed trace. Directly useful for validating that your `CarSpec` parameters produce sensible real-world performance numbers.
   220|
   221|**How to use in Trackside:** After authoring a `CarSpec` (GT3, Formula, Road), run it through OpenLAP on a known circuit. Compare the simulated lap time against real-world references. If your GT3 car simulates a 1:35 at Silverstone GP but the real car does a 1:58, your parameters are wrong.
   222|
   223|---
   224|
   225|### OpenTRACK
   226|**License:** MIT
   227|**Source:** [github.com/LVMS/OpenTRACK](https://github.com/LVMS/OpenTRACK)
   228|**Language:** Python
   229|
   230|Companion to OpenLAP. Generates the track model from GPS coordinates or manually defined circuit geometry. Required input for OpenLAP simulations.
   231|
   232|---
   233|
   234|### OptimumLap
   235|**License:** Proprietary freeware (not open source)
   236|**Source:** [optimumg.com/optimumlap](https://optimumg.com/optimumlap)
   237|
   238|OptimumG's lap simulation tool — not open source, but free to use and the de facto standard for FSAE teams. Useful for quick reality checks even without source access.
   239|
   240|---
   241|
   242|## See Also
   243|
   244|- [[Learning Resources]] — books and articles for understanding the theory behind these tools
   245|- [[Step 03 - TireModel (C++)]] — where MFeval validation fits in the implementation pipeline
   246|- [[Step 05 - CarSpec Resource]] — where LUT data from these tools is consumed
   247|- [[Step 06 - AeroModel]] — where OpenFOAM data feeds in
   248|
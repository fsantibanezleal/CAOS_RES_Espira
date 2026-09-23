# Changelog

All notable changes to Espira are documented here, newest on top. Versions use the padded display
form `X.XX.XXX`; while the parameter data is curated from published sources and the biaxial bake is
not fully converged, the product stays in `0.x`.

## [0.15.000] - 2026-09-22

### Added
- **C10 and C05 baked: 25 of 26 cases, and nothing blocked.** Felipe retrieved the kickoff paper's CC-BY
  full text, which had blocked both (backlog BL-002), and it was read directly.
- **C10 replicates the kickoff paper's peak switching fields** for monolayer CrSBr, at the damping the
  database assumes: 4.47 T against a published 4.6 T at 4 ps, 150.4 mT against 150 mT at 126 ps, 136.2 mT
  against 135 mT at 140 ps. The fourth quoted point, 9.6 mT at 2 ns, needs a damping near 0.001, inside
  the range the paper states for this family. The source prints two different fields for the same 126 ps
  point, 0.11 T in one section and 150 mT in another; the case carries both and lands on 150 mT. The
  published energies are not replicated, because the constant that turns a cost in T^2 s into the joules
  they print cannot be reconstructed from the text, and the case says so instead of inventing one.
- **C05 replicates the biaxial paper's thermal-robustness table**, all eight published cells within the
  Monte-Carlo interval (96.0 against 95.3 and 96.9 against 96.8 at a barrier of thirty thermal energies,
  and so on up to eighty). The case's subject moved from digitizing two figures, which it had been
  blocked on, to the table of numbers the same paper prints with its protocol stated.
- A results-wiki page for both replications, and six tests holding them to the published values.
- **The replications are in the app, not only in the wiki**: a Published replications tab on the
  Experiments page draws both comparisons on their own axes (peak field against switching time on log
  axes, success rate against barrier at both dampings) with the tables under them, including the point
  that does not reproduce and both of the two values the kickoff source prints for its 126 ps point. A
  thirteenth browser gate reads the committed artifacts in the page and compares them cell by cell with
  what is rendered, so a table that quietly dropped the unreproduced point would fail the build.
- **The external cross-check now covers the two-dimensional patch** (backlog BL-013). Spirit's geodesic
  nudged elastic band reproduces the engine's string-method barrier on the square element of cases C20
  and C21 as well as on the chain: worst relative difference 1.4e-06 over six lattices, against a
  declared tolerance of 1e-05. Every row sits below the coherent saddle N K, so the comparison is about
  wall paths rather than the rotation both codes would find from a straight interpolation, and the
  artifact validator now refuses a patch row that does not. The two agree best, to 8.1e-09, on the
  deepest wall in the table, and worst on the row where wall and rotation are nearly degenerate.
- **A fourteenth browser gate, for the pages the other thirteen never opened** (backlog BL-027). Each
  of the existing gates goes deep on one surface, and between them not one of them loaded the Introduction
  or the Theory page, so a prose page could have shipped blank and every gate would have stayed green.
  `e2e/pages.mjs` walks the nav the app itself renders, so a page added later is covered without anyone
  remembering, and on every page, in both themes, both languages and at a desktop and a phone viewport
  it holds that the route mounts with a heading and enough text that an empty shell cannot pass, that
  nothing scrolls sideways or runs under the footer, that no panel is still showing its loading
  placeholder after the network settled, that no NaN or undefined reached the visible text, and that
  the two languages are different documents rather than one falling back to the other.
- **The equation of motion is now cross-checked against an independent code** (backlog BL-013, the
  VAMPIRE half). The Spirit cross-check compares a barrier, which is static; this one compares a
  trajectory. VAMPIRE is GPL-2, so the adapter runs it as a separate process over generated input
  files, never links it, and keeps no VAMPIRE source in the repository. Over four configurations
  (precession at two dampings, a transverse drive, and a real reversal at 3 T through 400 ps) the worst
  deviation is 4.7e-06 against a tolerance of 1e-05, and the two codes put the moment through the
  equator at 78.7319 ps and 78.7319 ps. Surfaced on the Implementation page, validated by the artifact
  checker, and held by the parity gate and five tests.
- A results-wiki page for it, including the two setups that had to be discarded on the way: a reversal
  field of 1.2 T that was below the 1.73 T anisotropy field, and a 100 ps run that was shorter than the
  45 ps growth constant, each of which had the two codes agreeing to seven digits that nothing had
  happened. The script now refuses to write an artifact when the row called a reversal did not reverse.
- **The method ladder is documented** (backlog BL-030): `docs/methods/README.md` explains every rung
  code a reader meets in the coverage matrix, the provenance strip, the case pages and the committed
  JSON, transcribed from the dispatch that implements them: what each computes, which cases run it,
  what it writes into an artifact and what it does not claim, including why R08 and R09 report a
  non-reversal as a non-reversal rather than as a cheap protocol. A test holds the page to the
  registry in both directions, so a rung a case runs but the ladder never names, or a section for a
  rung no case runs, fails the build.
- **A fourth section in the Architecture modal**, Checked from outside, with its own theme-aware SVG:
  the two independent codes, what each one re-derives (the barrier and the trajectory), the numbers
  they agree to, and why neither is a dependency. The breadth gate now opens the modal, measures that
  every diagram laid out, and refuses a diagram that renders both languages at once, which is the
  failure mode of a bilingual hand-authored SVG.

### Fixed
- **A rounded constant that looked like a disagreement.** VAMPIRE hard-codes the gyromagnetic ratio as
  1.76e11 rad/(s T) while the engine uses the CODATA electron value 1.760859e11. The 4.9e-4 difference
  enters as a rescaling of time and moved the compared trajectory by 1.0e-04, a hundred times the level
  the two codes agree at once they are given the same constant. The cross-check passes VAMPIRE's value
  to the engine and records why in the artifact.
- **An under-equilibrated ensemble nearly became someone else's non-replication.** At a damping of 0.01
  the thermal case returned 100 per cent where the paper reports 95.3 to 99.9. The cause was ours:
  reaching a Boltzmann distribution takes a dissipation time, tau0 over the damping, so the fixed
  two-Larmor-time equilibration that suffices at 0.1 is ten times too short at 0.01, and the ensemble
  started with a spread of 0.0013 against a Boltzmann 0.017. Equilibration now scales with the damping,
  every cell records the spread it started from, and a test holds that spread to falling like one over
  the barrier.

## [0.14.000] - 2026-09-22

### Added
- **The barrier, computed twice by two codes** (backlog BL-013). The floor under every switching cost
  this product reports is an energy barrier from the engine's own string method; if that method were
  wrong, every floor would be wrong together and no internal test would notice. Spirit, an atomistic
  spin-dynamics framework written by other people, computes the same barrier by a different method
  (geodesic nudged elastic band) from the same Hamiltonian and the same initial path. Measured at
  J/K = 10: 7.747500 against 7.747498 K at N = 8, 8.699064 against 8.699061 at N = 12, and 8.839571
  against 8.839569 at N = 16. Worst relative difference 3.1e-07, against a declared tolerance of 1e-05.
- The starting point is part of the result: started from the straight interpolation between the two ends,
  which is the coherent rotation, Spirit converges to exactly N K (11.999995 K at N = 12). That checks
  the conventions and is not a check of the wall barrier, so the cross-check hands it our own wall path.
- Spirit is not a dependency: `scripts/crosscheck_spirit.py` is run by hand in a separate environment,
  the result is committed with both engine versions, and CI never installs it. The suite recomputes our
  own column on every run, so the agreement cannot go stale unnoticed, and the Implementation page shows
  the comparison with the parity gate checking it.

## [0.13.001] - 2026-09-22

### Added
- **A results section in the wiki** (backlog BL-030), one page per result that spans cases: the
  reliability front, the free chain crossover, the two-dimensional patch, the device trade-off, the
  hard-axis region, the penalty test, the exploitability table and the live-lane parity. Each page states
  the question as it was declared, the method, the measurement with its numbers, what bounds it (an
  optimum, an upper bound from an explicit trajectory, or a rigorous lower bound), and what it does not
  show, including the regions excluded from a claim rather than averaged into it. A test holds every
  page to naming its artifact and being listed in the index.

## [0.13.000] - 2026-09-22

### Added
- **Exploitability descriptors per material** (backlog BL-026), and the Experiments tab that reads them.
  Every material in the database reduced to what decides whether it is worth switching: its Larmor time,
  its infinite-time cost floor, the cost and the hardware demands at three reference switching times,
  the region where a hard axis pays at its damping, and how many exchange-coupled sites room-temperature
  retention needs. The database spans a real trade: Cr2Ge2Te6 switches for the lowest cost and the
  gentlest peak field (0.132 T) and needs 30,317 sites to retain, while FePS3 retains with 97 and demands
  29.3 T. One anisotropy sets both.
- **The thermal front per material** (the last piece of BL-032), measured at a stability factor of three,
  where the bare pulse does lose copies: it recovers 0.883 to 1.000 and charges 2.53 times the optimal
  cost. The block is a function of the damping alone in reduced units, so materials sharing a damping
  share it exactly; the artifact says so and a test holds it, rather than presenting seven identical rows
  as seven measurements.
- A twelfth browser gate, `e2e/exploitability.mjs`.

### Changed
- The retention counts are declared optimistic where they are shown: they assume a coherent reversal,
  and this product's own results (C19 to C22) measure the cheaper route, a domain wall whose barrier
  saturates instead of growing with the volume.
- C16 records a second search for its missing parameters (2026-09-22). The room-temperature resonance
  study gives a moment, an intrinsic damping of 0.0476 and an ordering temperature of 310 K on one
  crystal, but its anisotropy is the easy plane itself, so there is still no bistable state to switch and
  the case stays planned.

## [0.12.000] - 2026-09-22

### Fixed
- **The stabilizing longitudinal field was applied with the wrong sign**, and it reached a published
  manuscript. The engine's linearized analysis calls a positive `B_r` stabilizing, and at one anisotropy
  field it duly reported the instability gone, while the ensemble it was meant to predict was run with
  that field pointing the other way and got worse. Every reliability number the product has shipped came
  from that path: the R12 rung, case C09, `novel.json`, and both measured tables of manuscript M1.
  Corrected in spinoct 0.18.000 and rebaked here. What changes: at a stability factor of twenty the
  success rate is now unity at every field (it dipped to 0.958 at one anisotropy field before), and the
  field buys more where the bare pulse is fragile, lifting the success rate at a stability factor of one
  from 0.735 to 0.985 rather than to 0.860. The added cost, which is analytic, does not move.
- M1 is republished as version 4 (10.5281/zenodo.22902338), with both tables corrected and the
  "counterintuitive success dip" removed: there is no dip, and version 3 had explained an artefact of
  the sign as physics, attributing it to the source study.

### Added
- **Does the penalty predict the ensemble?** (backlog BL-020), the test that found the defect. The
  engine offers a deterministic hyperbolicity integral and claims it predicts the Monte-Carlo success
  rate without an ensemble; nothing had checked it. Over five fields by six stability factors at 1,000
  copies per cell, five rows separate their ends by more than both confidence intervals, and on the
  corrected engine the prediction holds in all five. On the old sign it held in none of six, which is
  what exposed the sign.
- The Experiments page gains the tab and `e2e/penalty.mjs`, taking the gates to eleven.

## [0.11.000] - 2026-09-22

### Added
- **Where the hard axis pays**, the whole region rather than one line (backlog BL-035, finding F-011).
  196 numerical solves over hard-axis ratio, damping and switching time, drawn as a heatmap. Each cell
  is divided by its own control, the same solver reproducing the uniaxial system whose closed form is
  already known, and a cell where that control drifts by more than 5 per cent or the solve does not
  converge is crossed out and counted apart: 51 of 196. Of the 145 that remain, the hard axis pays in
  80, all at short switching times, the best 4.32 times at ratio 4, alpha 0.001 and T = 2 tau0.
- **The device trade-off front (R14)**, baked per material and surfaced (BL-025). The cost and the peak
  field fall like 1/T, but the 99 per cent spectral width does not: 11 pairs have the slower protocol
  demanding the wider band, the worst widening it 1.54 times between 3.10 and 4.02 tau0. The widths hold
  to four digits from 2,048 to 131,072 samples, so that is the pulse family and not the transform.
- **The live lane's parity fixture** (BL-008): K(m) from SciPy over a grid reaching m = 0.999, and the
  closed-form protocol from spinoct over the case's sweep. The Implementation page recomputes both in
  the browser and shows the worst deviation, measured at 2.4e-16 and 1.3e-16.
- Three browser gates, `parity`, `pareto` and `hard-axis`, taking the suite to ten.

### Fixed
- **No browser gate ran anywhere.** The 2026-09-21 CI sweep removed the gate steps but left the
  Playwright install and the screenshot upload, so CI installed a browser, ran nothing and uploaded an
  empty folder. The gates run again, once, in CI, which is what ADR-0074 rule 6 allows.
- The chain crossover chart printed its y axis in the browser's locale ("0,8" beside a legend's
  "0.8353").

### Changed
- The engine pin moves to spinoct 0.17.0, whose `recommended_images` resolves a minimum energy path to
  the wall it follows.
- **C21 at W = 32 has its floor.** The path there was not unconverged for want of iterations: at 33
  images, with a wall 1.12 sites wide travelling 32 sites, neighbouring images sat further apart than
  the wall itself, so the climbing image hopped between lattice positions. At the resolved 87 images it
  converges in about a thousand iterations and 30 seconds. The floor enters a patch record in one place,
  and the control search computes its own start, so the recorded costs are untouched.

## [0.10.000] - 2026-09-18

### Added
- **C20 and C21, the chain's crossover on two-dimensional patches**, baked (23 of 26). The free optimal
  control search runs on square W x W patches (sides 4 to 32) at J/K = 10 and 2.5, on spinoct 0.16's
  `SpinPatch`, from three starts with the minimum-energy-path floor, in a separate checkpointed bake
  (`run_patch_ocp.py`, `data/artifacts/patch_ocp.json`). At J/K = 10 the smallest patch reverses
  uniformly and a non-uniform reversal is cheaper from W = 8; at J/K = 2.5, with a wall half as wide, it
  is already cheaper at W = 4.
- **C21's declared expectation is refuted.** It expected the narrower wall to push the crossover to larger
  patches; the measurement moves it to smaller ones, and the case records both.
- Experiments gains a Two-dimensional patch tab: a readout, the crossover chart per regime with the floor
  and the uniform line, the column-averaged reversal map and the table of all twelve patches. A new
  browser gate (`e2e/patch.mjs`) checks the crossover sentence against the artifact, the chart width
  when built in a hidden tab, locale-free ticks, the table order, reactivity, and that a withheld floor
  says so.

### Changed
- The engine pin moves to spinoct 0.16.0 (the lattice interface that makes the string method and the
  control solver run on a patch as on a chain).
- The chain crossover chart's y axis no longer follows the browser locale ("0,8" beside "0.8353").

### Notes
- On the largest patches the control searches stop at their iteration cap, so each ratio stays an upper
  bound but above W = 12 it no longer falls steadily with size (it rises between some sides); the true
  optimum is bracketed between it and the floor, not located.
- For J/K = 2.5 at W = 32 the minimum energy path did not converge within 200,000 iterations (23 minutes).
  An unconverged string's top energy is not the saddle, so that patch reports no floor and no barrier,
  and the artifact checker now rejects a floor from an unconverged path.

## [0.09.000] - 2026-09-18

### Added
- **C22, the continuum cross-check**, baked (21 of 26). The free-chain results rest on the
  minimum-energy-path barrier of a discrete chain, and in the continuum limit that barrier must become the
  Bloch-wall energy `2 sqrt(2 J K)`. Over one to twelve sites per wall width the lattice barrier approaches
  it from below, 0.9547 to 0.9997 of it, and the deficit falls as one over the width squared (deficit
  times width squared between 0.0425 and 0.0453). The plan asked for agreement with a micromagnetic code;
  a closed-form limit is a stronger reference, with no discretization of its own.
- The pulse view reads a declared x axis and declared series, so a case that is not a pulse (a barrier,
  drawn against its path coordinate with the continuum energy beside it) is never labelled as time or as
  a field.

### Changed
- The engine pin moves to spinoct 0.15.0, whose string method converges for wide walls; before it, the
  solver diverged above J/K of about 24 and still returned a barrier (43 times the continuum value at
  J/K = 40), and C22's sweep reaches J/K = 288.

### Fixed
- **Text was drawn over text on every case with a note, live since 0.07.000.** The pulse chart sized
  itself from a box it shared with the "about the drawn path" note, so its legend covered the note. The
  chart now sizes from a box of its own, and the observable gate checks, on every case in the Pulse and
  Trajectory views, that no legend, caption or note overlaps another; it fails on the old build for all
  six affected cases.
- The pulse chart printed decimals in the browser's locale ("0,05"); it now formats numbers explicitly.
- A case that is not a single-moment reversal carries no universal floor or static-field reduction, and
  the TypeScript contract now says so: those fields were declared always present, so the compiler could
  not see the readout formatting an absent floor, which stopped the workbench from rendering C22.

## [0.08.000] - 2026-09-17

### Added
- C23, C24 and C25 baked, taking the matrix to 20 of 26 cases and leaving two blocked. They had been
  blocked on a measured engine defect (finding F-014): the constrained solvers did not converge, so the
  cost they reported was an optimizer artifact rather than the price of a physical constraint. The engine
  was fixed instead of the cases being baked anyway (spinoct 0.13.000, which drives all three on the
  exact adjoint gradient), and the cases now measure what they were declared to measure:
  - **C23, the price of bandwidth.** The cost falls monotonically with the number of harmonics, 2.17 at
    one to 1.14 at eight, against the closed-form optimum. The floor of about 14 per cent is what a pulse
    that must be band limited and must vanish at both ends of the window costs.
  - **C24, the amplitude cap.** No reversal at all below about 0.45 anisotropy fields per component; 1.08
    times the optimum at 0.5, and 1.003 once the cap stops binding. The impossible points report no cost
    with the reason, which is the answer rather than a gap.
  - **C25, field against current.** The share of the weighted cost carried by the field falls from 0.96
    at a current price of 0.1 to 0.11 at 1e-4, and the field cost itself to 0.4 per cent of the
    field-only optimum, so the crossover is inside the swept window. The declared
    sweep (0.1 to 30) had sat entirely on the field-dominated side and was corrected from measurement.
- **C08, the chirped spin-orbit-torque current, a published replication that does not reproduce.**
  The source reports switching probabilities of 0.89, 0.97 and about 1 at 0.17, 0.18 and 0.20 j0 for
  its simplified constant-amplitude, linearly chirped current at a thermal stability factor of 60. Over
  1,000 stochastic copies per point the engine gives 0.009, 0.043 and 0.22, and 0.90 at 0.25 j0: the
  same curve shifted by about 1.4 in amplitude. Rotation sense, starting tilt, coupling convention,
  chirp tuning, thermal noise, pulse length and a factor of two in the time unit were each ruled out.
  The artifact carries the published value and the gap at each reported amplitude, the chart draws
  both, and a test fails if the gap disappears from the data.
- **C17, CrBr3 against CrCl3: a bit and a non-bit.** CrBr3 enters Contract 1 from an inelastic neutron
  scattering fit (D_z = -0.02 meV on spin operators, 0.045 meV per site, flagged as a fit below the
  instrument resolution) and bakes as the weakest easy axis of the family. CrCl3 is refused: its easy
  plane is dipolar shape anisotropy with no measurable preference inside the plane, so it has no
  bistable state to switch, and the case says why instead of producing a number.
- A case declares which rung produces its number, so a constrained case reports what ITS solver costs
  with the closed form kept alongside as the reference the constraint is priced against, and the drawn
  pulse is the realizable one rather than the unconstrained optimum.

### Changed
- The engine pin moves to spinoct 0.14.0, whose spin-orbit-torque integrator now solves the Gilbert-form
  equation it cites; it had used the couplings directly as explicit coefficients, 2 to 22 per cent off.
  C25 is baked on the corrected equation.
- C16 (Fe5GeTe2) stays planned with its premise corrected from the primary sources: its anisotropy is
  not one number (an easy plane at 290 K in bulk resonance, a weak perpendicular anisotropy in
  magnetometry and flakes, in-plane canting below six layers), and the declared "weaker perpendicular
  anisotropy" held only in some regimes.
- Every cell is solved once per release. The constrained solvers take tens of seconds and the release
  asks for the same cell up to three times (its cost row, its drawn pulse, and the method matrix); the
  solvers are deterministic and seeded, so the answer is remembered for the run.

### Fixed
- **A shipped artifact was not valid JSON.** A C24 point whose pulse could not reverse the moment
  carried `over_analytic: Infinity`, which Python writes by default and browsers refuse, so the whole
  case failed to load in the app and every browser gate that opened it crashed. A ratio to a cost that
  was never produced is now `null`, every artifact writer refuses non-finite numbers
  (`allow_nan=False`), and a test parses every shipped file with those constants rejected.
- A switching probability was drawn on a logarithmic axis, which stretched the tail near zero and
  crushed the region near one, where the published replication targets sit. A bounded fraction is now
  drawn on a linear 0 to 1 axis, and either axis goes logarithmic only when its values span more than a
  factor of twenty. The chart also draws a replication case's published values beside the engine's.
- The barrier floors behind the free-chain map and manuscript M2 come from a minimum-energy-path solver
  that reports non-convergence but still returns a barrier (it returned 43 times the true value on a
  wide wall, fixed in the engine at 0.15.000). A test now recomputes the barrier of every chain the
  product ships and requires convergence and agreement: all nine converge and reproduce.

## [0.07.001] - 2026-09-18

### Fixed
- Both manuscripts are at version 3 in the repository, matching the published records (M1
  10.5281/zenodo.22822132, M2 10.5281/zenodo.22822159). The repository still held the version 2
  sources, whose bodies narrated their own corrections.
- M1 misread its own reliability table, and the app repeated it. The added cost of the longitudinal
  field is 2.5 times the bare switching cost at one anisotropy field and 15.8 times at 2.5, not below
  it; and at the front's stability factor of 20 the bare pulse already reverses every copy, so the field
  buys no reliability there (case C07 shows it pays only below a factor of about ten). The Experiments
  page and the artifact's note now say so.
- The artifact's note under the two-mode lattice comparison still stated manuscript M2 version 1's
  withdrawn conclusion as fact. It now says what that comparison shows and why the free search
  overturns it.

### Added
- Three tests pin M1 to its artifacts: both of its tables reproduce from the committed data, and the
  cost multiples it quotes must match. They fail on the version 1 source.

## [0.07.000] - 2026-09-17

### Added
- Four more cases baked, taking the matrix to 15 of 26. **C01, the free-moment oracle**: the free limit
  is reached by making the switching time short compared with the Larmor time rather than by setting the
  anisotropy to zero, which the engine refuses; both the closed form and the numerical solver return the
  free cost, within one part in a million up to 0.2 tau0. **C03, the spin-orbit-torque oracle**, which
  reports a current, not a field cost. **C06, the search family**: the six seeds find two distinct
  converged paths, 1.5206e-11 and 2.0250e-11 T^2 s, a spread of 33 per cent, and three of the six land on
  the expensive one, which is exactly why every biaxial bake here runs a multi-seed search. **C07, the
  single-site thermal success rate**, where the zero-temperature optimum is measurably not the most
  reliable pulse.
- A case now declares the **observable** it reports (its key, label, unit, and whether it is a field
  cost), and the app plots and reads the declaration instead of assuming every number is a cost in
  T^2 s. On a case that does not report a field cost the field-derived ratios are not carried at all; the
  closed-form field cost stays under `field_cost_reference` with a note saying it is there for scale.
- **The live lane is real.** C03 is the first case the lane gate puts in the live lane, and the web now
  carries its own implementation of that closed form (the complete elliptic integral by the
  arithmetic-geometric mean, and Eqs. 8, 9, 11 and 12 of Phys. Rev. B 105, 134404), written independently
  of the engine's path through SciPy. The workbench recomputes the case in the browser and shows the
  agreement with the committed artifact; the two agree exactly today.
- Rungs R11 (the finite-temperature success rate over a stochastic ensemble) and R12 (the same pulse with
  a longitudinal field, the reliability it buys and its added cost) run in stage `infer`.
- A sixth browser gate (`e2e/observable.mjs`): a non-cost observable is never shown in T^2 s, a case says
  so when it does not report a field cost, the page and the manifest agree about the lane, the live
  recompute matches the artifact to better than a part in a million, and the drawn-path note appears
  exactly where the artifact declares one.
- A Python test refuses a manifest that puts a case in the live lane without a browser implementation of
  its methods, so the gate's verdict and the app cannot drift apart.

### Changed
- C04 and C06 draw the solver's own path on its own image grid instead of the closed-form uniaxial path.
  Both cases are ABOUT the numerical path, so drawing the analytic one showed the same picture for two
  different answers.
- C07's declared window moved from a stability factor of 10 to 80 down to 1 to 20, from measurement:
  above ten the zero-temperature pulse already succeeds essentially always and the case would have been a
  flat line. C01's sweep moved to 0.02 to 1 tau0 for the same reason, that being where the free limit is.
- The artifact schema is 2.1.0, and the loader now refuses an artifact whose major version differs from
  the one the app reads. The TypeScript mirror had been left at 1.0.0 while the Python side was at 2.0.0.
- The case list is bounded and scrolls. With 15 cases baked it had grown to 39 per cent of the App
  surface at 1360x900 and pushed the instrument onto the footer; the registry has 26 cases, so chips in
  wrapping rows do not scale.

### Fixed
- **Both charts were formatting their x axis as dates.** uPlot treats x as a time axis by default, so a
  switching time of 2 tau0 and a pulse time of 33 ps were labelled with times in 1969. Live on the site
  until now.
- **A chart built while its sub-tab panel was hidden stayed that size.** The cost curve rendered 90 px
  wide inside a 1000 px stage, and the layout gate passed it because the sliver still filled the height.
  Both charts now observe their container, the flex item takes a zero basis so a narrow chart cannot pin
  its own container narrow, and the layout gate measures the painted WIDTH against the instrument too.
- **An uncaught exception in a chart formatter was invisible to every gate.** uPlot passes null for a
  tick it cannot place, the formatter threw, and the throw aborted the redraw that would have resized the
  plot. It never reached `console.error`, so no gate saw it; all six gates now fail on an uncaught page
  error as well.
- The layout gate counted content clipped inside a scroll region as overlapping the footer. It now
  intersects each element with its clipping ancestors and measures what is actually visible.
- The footer, the architecture modal and the Implementation page said the web never recomputes. One case
  now does, and all three say so.

## [0.06.000] - 2026-09-17

### Added
- C26, the amortized policy, is baked as a real case (`amortized-policy`): the learned policy emits a
  pulse with no optimization at inference, and the sweep runs over a damping range deliberately wider
  than the range it trained on, so the limit of amortization is measured rather than implied. Inside the
  training range the pulse reverses the moment at 0.99 to 1.11 times the analytic optimum; at a damping
  of 0.1 it costs 1.86 times the optimum; at 0.2 and 0.5 it does not reverse the moment at all, and the
  artifact says so.
- The result schema now carries a cost of `null` with a reason, in the Python contract and in the
  TypeScript mirror, so a method that ran and did not switch is a recorded outcome rather than a missing
  cell. The workbench marks those points "no reversal" instead of dropping them from the curve.
- Rungs R08 (GRAPE under an amplitude cap), R09 (CRAB, band-limited), R13 (the joint field-plus-current
  optimum) and R15 (the amortized policy) run in stage `infer`.

### Changed
- C23 (band-limited bandwidth) and C24 (amplitude cap) move from planned to blocked, with the
  measurement that blocks them: the engine's constrained solvers optimize with Nelder-Mead, which does
  not converge at this parameter count. Measured 2026-09-17, 90 to 230 seconds per solve and a cost 2.2
  times the analytic optimum at two harmonics rising to 14 times at six, where more harmonics should
  cost less. Baking them would publish optimizer artifacts as the price of a physical constraint. They
  wait on the engine moving those solvers to a gradient method.
- C25 (field plus current) stays planned and now records what a first solve measured: the moment
  reverses and 95 per cent of the weighted cost sits on the field at equal prices, at five minutes per
  solve.

### Fixed
- The sphere trajectory sized itself from the panel width alone, so at 1360x900 it grew past the stage
  and its scrubber and caption overflowed onto the footer. The sphere is now a square inscribed in the
  measured drawing box, and the ADR-0071 layout gate is green on every sub-tab at both viewports in both
  themes.

## [0.05.001] - 2026-09-17

### Fixed
- The App surface now meets the measured ADR-0071 floor on every sub-tab. The sub-tab chain did not pass
  the stage height down, so the Context panel sat at 42 per cent of the surface at 1600x1000; the charts
  used a fixed height instead of the stage; and the first attempt at the fix overrode the shell's
  `[hidden]` rule, which laid out the inactive panels and pushed the visible one down the page. Painted
  content now fills 84 to 89 per cent on every tab at both viewports.
- The Context tab carries the case's design, its release evidence (lane, cells produced, artifact hash)
  and its sources next to the prose, instead of leaving the stage half empty.

### Added
- A fifth browser gate (`e2e/app-layout.mjs`) measuring the App surface at two viewports in both themes:
  the share of the surface the PAINTED content fills (not the stretched container, which a half-empty box
  would satisfy), no overlap with the footer, no horizontal scroll, and the readout column width.

## [0.05.000] - 2026-09-17

### Added
- The nine named stages of ADR-0057 and ADR-0069, with one orchestrator and a command line
  (`python data-pipeline/run.py all|<stage>`): ingest, preprocess, dataset, features, train, infer,
  evaluate, export, validate. Every method a case declares now runs over every variant into one result
  schema, or says why it cannot; a method the pipeline cannot run raises rather than leaving a gap.
- Contract 2: per-case manifests in `manifests/` binding each artifact to the engine version, the seed,
  the split, every result row, the artifact's size and sha256, the measured lane verdict and the
  completeness counts, plus the Contract 1 flags of the parameters it used. `validate` recomputes the
  hash and refuses a release that does not match, which a test proves on a mutated copy.
- A measured live-versus-precompute gate (`espiralab/core/gate.py`): closed form, runtime under 250 ms
  and artifact under 512 kB, or the case is precompute with the failing reasons recorded. Every baked
  case is precompute today, and the manifests say why in measured terms.
- A model registry (`models/registry.json`) for the amortized policy: version, engine, license, lane,
  checkpoint, training materials, held-out materials, and the acceptance rule with the scores.
- The Benchmark page shows the real method x case x variant matrix and the release evidence (lane,
  completeness, artifact hash), with a fourth browser gate checking both against the artifact.

### Changed
- The learned policy trains over a damping RANGE with the held-out materials' dampings excluded, instead
  of the training materials' damping values alone. Four of six materials carry the same assumed damping
  of 0.01, so the old split trained at a single point and the policy could not reach the one material
  with a measured damping of 7e-4: it emitted pulses that did not switch. It now passes its gate, every
  held-out case reversing within 1.6 per cent of the analytic optimum.
- The bake and the pipeline take the image count from `spinoct.ImageOCPSolver.recommended_images` rather
  than a fixed 60, and the engine (0.12.000) minimizes with L-BFGS. The numerical optimum was 20 per cent
  above the closed form at the longest switching time; it is now within 1 per cent at every baked
  variant.

## [0.04.000] - 2026-09-17

### Added
- The full 26-case registry of the validated plan, in six categories, with a model that makes the case
  contract explicit (ADR-0069 section 4): a variant family of at least six values with its own label and
  unit, a seed, a split, a ground-truth class, the surface it is shown on, what a domain expert should
  see, and the kill criterion that would make it a failure. Every case carries an honest status: `baked`
  (committed artifacts), `planned` (declared and runnable, not computed), or `blocked` (naming what is
  missing, as for the Cloudflare-blocked kickoff paper and the undigitized published figures).
- Two exact oracles are now baked cases of the product rather than engine tests: C02, the analytic
  uniaxial optimum, and C04, the hard-axis sweep. Both run on a declared synthetic reference macrospin
  whose values are definitional and marked as such.
- Cases may sweep something other than time. C04 sweeps the hard-axis ratio at fixed switching time; the
  artifact, the variant bar, the cost chart and the docs all read the declared axis.
- Experiments gains a Coverage tab: all 26 declared cases with status, variants, methods and ground
  truth, and the blocked reasons in full. A third browser gate checks it against the committed index.
- The wiki's case section is generated from the registry: a page per case (status, kill criterion,
  system, variants, design, sources) plus the coverage matrix, and a test fails when they drift.

### Changed
- **C04's declared expectation was refuted by its own measurement and corrected.** The hard-axis benefit
  is not monotone: at the reference damping and switching time the cost falls to a minimum near a
  hard-axis ratio of one (1.81 times cheaper than the uniaxial optimum) and rises again beyond it, and at
  long switching time the hard axis is purely harmful. Verified stable across solver budgets. Cases now
  report the reduction against the uniaxial optimum, which is the measure the mechanism is about.
- The FePS3 negative control has the six variants the case contract requires, not three.
- The artifact schema is 2.0.0: a declared `axis` block replaces the implicit switching-time list, the
  case block carries its code, kill criterion, ground truth, split, status and methods, and the index
  carries the whole registry with coverage counts.

## [0.03.000] - 2026-09-17

### Added
- Contract 1, the ingestion gate for material parameters (`data/materials/materials.csv`,
  `data/materials/parameters.csv`, `espiralab/io/contract.py`, stages `ingest` and `preprocess`). One row
  per value with the unit and basis it was published in, the conversion inputs, a provenance class
  (measured, computed, derived, assumed), the method, the DOIs and a note. Bad rows are rejected with a
  reason, assumed values and wide damping bands are flagged, and the canonical bake refuses any rejection.
  Conversions from spin operators (K = D S^2) and from volume anisotropy (through a unit cell or through
  the saturation magnetization) are explicit and tested. docs/architecture/02_data-contracts.md.
- The App workbench shows the provenance of every parameter: class badge, published form, method, note and
  DOI links, with a count of assumed values; the Experiments materials table badges assumed damping.
- The negative-control case (FePS3) carries a banner saying its numbers are not predictions.
- Browser gates committed to the repository (`frontend/e2e/`): the free chain tab and the workbench
  provenance panel, both across two themes and two languages against a served build.

### Changed
- **Corrected material parameters after an audit against primary sources** (programme dossier 07). FePS3
  anisotropy 2.0 meV became 10.64 meV (wrong value, and the S^2 conversion was missing); CrI3 0.7 meV,
  cited to a paper that does not report it, became 0.495 meV from the neutron fit; Cr2Ge2Te6 anisotropy
  0.05 meV became 0.0341 meV, its moment 3.0 became 2.80 mu_B and its ordering temperature 40 K became
  61 K; Fe3GeTe2's moment 1.82 mu_B (which belonged to Fe3GaTe2) became the measured 1.58 mu_B and its
  anisotropy is now derived from the measured K_u. Every per-case artifact was rebaked. novel.json is
  unchanged, so manuscript M1 is unaffected. Damping remains assumed for four of six materials.
- The case selector no longer labels the negative control as synthetic: every case runs on published
  parameters.
- Pipeline writers pin LF newlines, so an artifact does not change bytes with the machine that baked it.

## [0.02.002] - 2026-09-14

### Changed
- The repository no longer carries the product template outside the web app and the bakes: the SIR
  tests, the SIR data contract and example, the template blueprint, the VPS scaffolds and the template
  wiki pages are gone. `app/` is the dormant FastAPI lane of the frozen base with an Espira README.
- The wiki describes the real system: architecture overview and deploy, the spinoct framework page with a
  runnable example, the bake guide, and the case coverage matrix against the validated 26-case plan with
  per-case pages generated from the registry.
- CI runs ruff, the tests, and the artifact checker, in addition to the guards and the frontend build.
  Before this release the ci workflow had failed on every push since 0.01.000.

### Added
- Tests: material traceability and physical ranges, the registry, artifact invariants with corrupted-copy
  checks proving the checker fails, artifacts current with the database, manuscript facts recomputed from
  the shipped map, a sandboxed bake smoke against the committed artifact, generated docs current, relative
  links, and version consistency. The FePS3 case is a strict expected failure until it has six variants.

## [0.02.001] - 2026-09-14

### Fixed
- Deep links answered HTTP 404: GitHub Pages served every route except the landing page through
  404.html, so the app mounted but the document status was 404. A postbuild step now writes one HTML
  entry per route in App.tsx (experiments.html and siblings), which Pages serves with 200.

## [0.02.000] - 2026-09-14

### Added
- The free chain optimal control crossover map (`data-pipeline/run_lattice_ocp.py`, artifact
  `data/artifacts/lattice_ocp.json`): 61 chains (J/K = 10; alpha 0.5 over T = 10 to 160 tau0 and N = 4
  to 32; alpha 0.1 over T = 20 to 300 tau0 and N = 8 to 24), each solved over every site's trajectory
  from three starts with spinoct 0.10.0, with the minimum-energy-path floor. 28 cases reverse more
  cheaply through a domain wall than by uniform rotation, up to a 51 percent saving (N = 24,
  T = 160 tau0, alpha = 0.5). Parallel and checkpointed.
- Experiments, "Free chain optimal control" tab: damping, time and length selectors with a readout,
  an interactive uPlot crossover chart with the floor, a hover-readout s_z(t, site) reversal map, and the
  full case table. The two-mode tab is marked superseded.

## [0.01.000] - 2026-09-13

### Added
- The material parameter database (`espiralab.materials`): six van der Waals magnets (CrSBr, Fe3GeTe2,
  Fe3GaTe2, CrI3, Cr2Ge2Te6, FePS3), each transcribed from a primary source with a verified DOI, an
  uncertainty, a sign convention, and the disputes named where sources disagree.
- The case matrix (`espiralab.cases`): field-driven reversal on four materials, the low-damping floor
  case, and the FePS3 negative control.
- The canonical bake (`espiralab.bake`): drives the spinoct engine to compute, per case, the analytic
  cost curve with a damping uncertainty band, the reference pulse and sphere trajectory, the static
  baseline reduction factor, and for CrSBr the numerical biaxial hard-axis reduction. Output is
  committed, checksummable JSON that the web replays.
- The six-page companion web app: Introduction, Theory (KaTeX, tabbed), Implementation, App
  (a real workbench with a material selector driving a 3D sphere trajectory, an interactive cost
  curve and pulse chart, and a live parameter readout), Experiments, and Benchmark. Bilingual EN/ES,
  light/dark, on the shared CAOS shell, with inline citations to verified DOIs.
- Consumes spinoct 0.03.000 (the analytic and numerical optimal control paths, baselines, SOT, and
  the constrained solvers).

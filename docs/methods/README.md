# The method ladder

Every case in this product declares which methods it runs, and every row of every artifact carries its
result under a rung code: `R00`, `R05`, `R07`, and so on. Those codes appear in the coverage matrix, in
the workbench provenance strip, in the case pages and in the committed JSON, and this page is what they
mean.

The ladder is ordered by what a method assumes, not by when it was written. A conventional baseline
assumes a constant field and asks how much that costs. A closed form assumes a uniaxial macrospin and
gives the exact answer. A numerical solver assumes nothing about the anisotropy and pays for it in
compute. A constrained solver assumes a hardware limit and measures what that limit costs. Reading down
the ladder is reading the assumptions being removed one at a time.

**The physics of each method, with its equations and its sources, is in the engine's theory pages**
(https://github.com/fsantibanezleal/CAOS_SpinOCT/tree/main/docs/theory). This page is the product side:
what the rung computes here, which cases use it, what it writes into an artifact, and what it does not
claim.

| Rung | What it is | Cases | Reports |
|---|---|---|---|
| R00 | Constant-field baseline | C11 to C18 | field cost, `over_optimal` |
| R04 | Chirped spin-orbit-torque baseline | C08 | current cost in reduced units |
| R05 | Closed-form uniaxial optimal control | 14 cases | field cost, `cost_over_free`, `cost_over_floor`, peak and mean amplitude |
| R06 | Closed-form spin-orbit-torque optimal control | C03 | current cost in reduced units, forbidden-ratio flag |
| R07 | Numerical image-based optimal control path | C01, C02, C04, C06, C11, C19 to C21 | field cost, `over_analytic`, convergence, image count |
| R08 | GRAPE under an amplitude cap | C24 | field cost or none, peak amplitude, infidelity |
| R09 | CRAB at a bandwidth | C23 | field cost or none, harmonics, peak amplitude, infidelity |
| R11 | Stochastic reliability of a protocol | C05, C07, C09 | success rate over an ensemble |
| R12 | The cost-reliability front of a longitudinal field | C07, C09 | added cost, reliability bought |
| R13 | Joint field and current co-optimization | C25 | field cost, current cost, field fraction |
| R15 | Amortized policy, evaluated | C26 | cost ratio to the closed form, predicted against true |
| R16 | Lattice reversal and its barrier | C19 to C22 | barrier, cost floor, wall or uniform verdict |

Rungs that exist in the engine but are not a per-case rung here are listed at the end, with the reason.

---

## R00, the constant-field baseline

A static field of 1.2 times the Stoner-Wohlfarth switching field, held for the whole switching window,
integrated with the same equation of motion as everything else. It is the protocol a device would use
if nobody had done any optimal control, and it is on the ladder to keep the comparison honest: every
reduction this product reports is a reduction against this, not against a strawman of zero field.

It reports the cost it paid, whether the moment actually reversed, and `over_optimal`, the ratio to the
closed-form optimum at the same switching time.

## R04, the chirped current baseline

The spin-orbit-torque analogue of R00: a current whose frequency follows the precession rather than a
constant drive. Its cost is a current integral in the reference's reduced units, not a field cost in
T^2 s, and the artifact says so on the row rather than letting it be averaged into a field comparison.

## R05, the closed-form uniaxial optimal control path

The exact solution for a uniaxial macrospin: the pulse, its cost, and the elliptic-function machinery
behind it. Where it applies it is not an approximation, which is why it is the reference every
numerical solver in this product is accepted against before it is trusted anywhere else.

It reports the cost, the ratio to the free-macrospin cost (`cost_over_free`, the same reversal with no
anisotropy to fight), the ratio to the infinite-time floor (`cost_over_floor`, what the reversal costs
if time is free), and the mean and peak amplitudes a device would have to supply.

**One case uses it differently.** C10 sweeps the kickoff paper's own switching times in picoseconds
rather than this product's Larmor units, and reports the peak field beside the published value, so that
the comparison is against the numbers as printed.

## R06, the closed-form spin-orbit-torque optimal control path

The current-driven counterpart of R05, at the ideal balance between field-like and damping-like torque.
Its cost is a current integral in reduced units and is **never** mixed into a field cost: the case
declares a different observable, and a browser gate fails the build if a non-cost observable is ever
shown in T^2 s. It also reports whether the requested switching time falls in the forbidden region
where the protocol does not exist.

This is the one rung cheap enough to run in the browser, so C03 is the live-lane case: the page
evaluates the closed form in TypeScript and shows its agreement with the committed artifact.

## R07, the numerical optimal control path

Direct minimization of the discretized cost over a chain of images on the sphere, for systems with no
closed form (a hard axis, a lattice). The image count is chosen by resolution rather than fixed, and
the solve runs from several seeds because multiple optimal paths coexist in the biaxial case and a
single seed reports whichever basin it landed in.

It reports the cost, `over_analytic` (the ratio to the closed form, which is the acceptance gate where
one exists), whether it converged, how many images it used and how long it took. One case, C04, makes
the seed the variant, so the spread across seeds is visible in the artifact instead of being collapsed
by the multi-seed search.

## R08, GRAPE under an amplitude cap

A piecewise-constant pulse optimized on the exact adjoint gradient, under a cap on the peak amplitude.
The cap is the case's variant, in units of the anisotropy field, and the rung is how this product
measures the price of realizability: what a real amplifier's ceiling costs.

A capped run that does not reverse the moment reports **no cost and the reason**, rather than a cost
for a pulse that failed. That is deliberate: a cheap non-reversal is not a cheap protocol.

## R09, CRAB at a bandwidth

The same idea against a different hardware limit: the pulse is expanded in a fixed number of harmonics,
so the bandwidth is the constraint. The harmonic count is the case's variant. It reports the cost, the
peak amplitude, the infidelity and the bandwidth it was given, and like R08 it reports a non-reversal
as a non-reversal.

## R11, the stochastic reliability of a protocol

The same pulse under thermal fluctuations, over an ensemble, at a stability factor `K/kT` that is the
case's variant. It reports the fraction of copies that reversed.

**Equilibration is part of the method, not a detail.** Reaching a Boltzmann distribution takes a
dissipation time, `tau0/alpha`, so the equilibration stage scales with the damping; a fixed one that
suffices at `alpha = 0.1` is ten times too short at 0.01 and produces an ensemble that cannot fail.
Cases record the equilibrium spread they start from for exactly that reason (see
[../results/10_published-replications.md](../results/10_published-replications.md)).

## R12, the cost-reliability front

The same pulse plus a longitudinal field along the instantaneous moment. The field does no work on the
trajectory in the ideal case, but it stabilizes it against fluctuations, and the functional charges for
it. The rung measures both: the reliability bought and the cost added.

The sign of that field is load-bearing, and it was wrong once: the engine's own analysis called a
positive `B_r` stabilizing while the simulation applied it the other way, which the prediction test
caught (spinoct 0.18.000).

## R13, joint field and current

Field and spin-orbit torque co-optimized, with a price on the current relative to the field. The price
is the case's variant, and the rung reports how the optimizer splits the work (`field_fraction`) as the
relative price changes.

## R15, the amortized policy

A trained policy that emits a pulse for a system it was not solved for, evaluated against the closed
form. It reports the cost ratio and both the predicted and the true parameter, so a policy that is
confidently wrong is visible as such rather than as a number.

## R16, lattice reversal

Past the macrospin: a chain or a square patch, where the reversal can be a uniform rotation or a
travelling domain wall. The rung computes the minimum energy path, the barrier, and the cost floor that
follows from it, and reports which mode won. One case sweeps the lattice spacing to recover the
continuum limit.

---

## Rungs that are not a per-case rung here

- **R01, R02, R03**: further conventional baselines implemented in the engine (precessional and
  Sun-Wang protocols among them). No Espira case declares them; R00 carries the baseline role here, and
  adding them would repeat a comparison the product already makes.
- **R10, the adjoint gradient**: not a protocol but the exact gradient the constrained solvers optimize
  on, so it runs inside R08, R09 and R13 rather than producing a row of its own.
- **R14, the device trade-off front**: computed across a whole sweep rather than per case, so it is a
  cross-case bake (`pareto.json`) and appears as the Device trade-offs tab, not as a rung in a case's
  cost curve.

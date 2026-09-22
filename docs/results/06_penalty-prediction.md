# Does the deterministic penalty predict the ensemble?

Artifact: `data/artifacts/penalty_test.json`, written by the main bake (about half a minute: 30
ensembles of 1,000 copies). Shown in Experiments, "Penalty against ensemble". Backlog BL-020,
finding F-023.

## The question

Reliability is measured by integrating many stochastic trajectories, which is the expensive part of this
product. The engine offers a cheap substitute and states it as a claim in its own docstring: the
hyperbolicity integral along the path,

    P = integral of max(0, -w1 w2) dt,

comes from the same Hessian the optimal-control solver already has, needs no ensemble, and is supposed
to predict the Monte-Carlo success rate. Nothing in the product had tested it.

## The method

The grid is the one where the claim can fail: five longitudinal fields (0 to 1 anisotropy field, which
is what removes the hyperbolicity the penalty integrates) against six thermal stability factors (1 to
20, which decides whether any copy fails at all), 1,000 copies per cell, on CrSBr at ten Larmor times.
The ensembles run through the engine's own front (`br_cost_reliability_front`) rather than through a
field written in the bake, so the analysis and the simulation cannot disagree about what B_r means.

A row can only decide the question when its two ends separate by more than both confidence intervals.

## What it found first

On spinoct 0.17.000 and earlier the test measured the **opposite** of the claim at every stability
factor: driving the penalty to zero raised the failure rate, rank correlation -0.6 to -0.7, zero of six
rows agreeing. The penalty was not at fault. The engine's analysis calls a positive B_r stabilizing,
while its simulation applied that field along the nominal moment, which in that codebase points the
other way, so the analysis reported a stabilized path while the ensemble got worse.

Measured on CrSBr at stability factor one: 0.780 success bare, 0.530 with the old sign, 0.958 with the
corrected one. Two trajectories integrated side by side separate 8.8-fold over the pulse under the old
sign, 2.9-fold with no longitudinal field at all, and 1.2-fold under the corrected one. Corrected in
spinoct 0.18.000; every reliability number the product had shipped, and both measured tables of
manuscript M1, were rebaked.

## The measurement, on the corrected engine

The claim splits in two, and only one half holds.

- **At the ends of the sweep it holds.** Where the analysis says the instability is gone, the ensemble
  fails less, in all five rows that can decide. The sixth, at a stability factor of 20, has nothing to
  predict: neither end fails.
- **Ranking the whole sweep, the integral fails.** The failure rate falls monotonically with the field in
  all six rows, but the penalty does not: it rises from 4.27 to 8.36 (in units of the cost floor) between
  zero and a quarter of an anisotropy field, where the measured failure rate has already fallen, and only
  then falls to zero. It ranks **none** of the six rows.
- **The hyperbolic fraction does rank it.** The fraction of the path that is unstable falls monotonically
  (0.50, 0.42, 0.33, 0.23, 0.00) like the failures do, and ranks every row that is not tied at zero
  failures (three of six).

The cheap predictor that works is how much of the path is unstable, not how unstable it is.

## What it does not show

One material, one switching time and one damping. The ranking statement rests on five decidable rows;
rows where nothing fails are counted as undecidable rather than as agreement, which is why the verdict
reports both counts.

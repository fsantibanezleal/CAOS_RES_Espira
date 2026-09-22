# The cost of reliability: the longitudinal-field front

Artifacts: `data/artifacts/novel.json` (the front at one stability factor) and
`data/artifacts/thermal-success-rate.json` (case C07, the stability-factor sweep). Shown in Experiments,
"Reliability (R12)". Manuscript M1, version 4, `10.5281/zenodo.22902338`.

## The question

The optimal pulse is always perpendicular to the moment. That is what makes it efficient, and it also
means the pulse exerts no restoring torque on the transverse perturbations thermal noise excites: a
large part of a bare reversal is dynamically unstable. A longitudinal field parallel to the moment
removes that instability and does no work at leading order, so it is often described as free. It is not:
it adds `integral B_r^2 dt` to the switching cost. What does that reliability cost, and where does it
buy anything?

## The method

The bare optimal pulse plus a longitudinal component, integrated over a stochastic ensemble at
temperature, against two sweeps: the field strength at a fixed stability factor (rung R12, `novel.json`)
and the stability factor at a fixed field (case C07). The linearized analysis supplies the hyperbolic
fraction of the path, the deterministic quantity the ensemble is supposed to follow.

## The measurement

- The hyperbolic fraction falls from one half at zero field to zero once the field reaches one
  anisotropy field, as the linearized analysis predicts.
- At a stability factor of 20 the bare pulse already reverses every copy, so the field buys nothing and
  costs a great deal. The front there measures a price and no gain.
- Where the bare pulse is fragile the field buys a great deal: at a stability factor of one it lifts the
  success rate from 0.735 to 0.985, removing 94 per cent of the failures, and reaches unity within the
  interval from a factor of two upward.
- The price is analytic and steep: one anisotropy field costs 2.5 times the bare optimal switching cost,
  two cost 10.1 times it, two and a half cost 15.8 times.

## The correction in version 4

Versions 1 to 3 of M1 were computed with the stabilizing field applied in the direction opposite to the
one the module's own linearized analysis assumes (see
[06_penalty-prediction.md](06_penalty-prediction.md) and finding F-023). Version 3 therefore printed a
success rate dipping to 0.958 near one anisotropy field and explained the dip as physics, attributing it
to the source study. There is no dip. Version 4 corrects both measured tables and that reading; the
added-cost column, being analytic, did not move.

## What it does not show

Single-site temperatures here are sub-kelvin because one site of CrSBr carries an anisotropy of 1.7 K in
temperature units; device-grade stability comes from the exchange-coupled volume, not from one site (see
[07_exploitability.md](07_exploitability.md)). The cost is in tesla-squared-seconds and is not converted
to joules without a circuit model.

# The staged pipeline

One command runs the release, and each stage is a pure function of its inputs and the declared seeds:

```bash
python data-pipeline/run.py all [artifacts_dir] [manifests_dir]
```

| Stage | Input | Output |
|---|---|---|
| `ingest` | `data/materials/*.csv` | the Contract 1 report: accepted values, rejections with reasons, flags |
| `preprocess` | that report | the canonical material records (strict: one rejection stops the release) |
| `dataset` | the registry | the split (which materials train, which are held out) and the declared method x case x variant cells |
| `features` | a case and a variant | the dimensionless coordinates (damping, log switching time, hard-axis ratio) the learned policy consumes |
| `train` | the training split | the amortized policy, its checkpoint and its registry entry, with the acceptance gate it passed |
| `infer` | a case | every declared method over every variant, in one result schema |
| `evaluate` | those results | per-method scores against the oracle and the completeness of the matrix |
| `export` | all of it | the artifacts, the Contract 2 manifests, and `benchmark.json` |
| `validate` | the written release | the problems; any problem refuses the release |

Individual stages run alone for inspection: `python data-pipeline/run.py ingest`, `dataset`, `train`,
`validate`. The cross-case novel results (`run_novel.py`), the free chain crossover map
(`run_lattice_ocp.py`) and the two-dimensional patch sweep (`run_patch_ocp.py`) are separate entry points because they carry a Monte-Carlo or multi-hour cost.

## The result schema, and why a missing cell is a failure

Every method returns the same row: the method, the variant, the cost (or `null`), whether the moment
reversed, whether the method was applicable, the reason when it was not, and its own metrics. A method a
case declares that the `infer` stage cannot run raises rather than skipping, and `evaluate` counts
produced plus not-applicable against declared. `validate` refuses a release with a missing cell, so an
incomplete matrix cannot be averaged away into a shorter table.

Two honest "not comparable" cases are marked rather than hidden. The spin-orbit-torque protocol (R06)
reports a current integral in reduced units, which is not a field cost in T^2 s, so its cost is `null`
and its metrics carry the current. R06 is not applicable at all on a material with no measured
spin-orbit couplings, which is recorded as the reason.

## The declared observable: a case reports the quantity it was asked about

Most cases report the field switching cost in T^2 s, and the free-macrospin cost and the universal floor
are meaningful references for it. Two cases report something else, and quoting either in T^2 s would be
a units failure rather than a rounding one:

| Case | Observable | Unit |
|---|---|---|
| C03, the spin-orbit-torque oracle | the average optimal current | reduced units `j0` |
| C07, the thermal case | the switching success rate | fraction of an ensemble of 600 copies |

A case also declares which rung produces its number. Most report the closed form (R05); the constrained
cases report what THEIR solver costs (R08 under an amplitude cap, R09 band limited, R13 the joint
field-plus-current optimum), with the closed form kept alongside as the reference the constraint is
priced against. Where the constraint makes the reversal impossible, as under a tight amplitude cap, the
cost is `null` with the reason, because that is the answer and not a gap.

So a case declares an `observable` (its key in the cost-curve row, its label, its unit, and whether it
is a field cost), the artifact carries the declaration, and the app plots and reads what the case
declared instead of assuming every number is a cost. On such a case the field-derived ratios are not
carried at all: the closed-form field cost of the same reversal stays in the row under
`field_cost_reference` with a note saying it is there for scale only. A browser gate
(`e2e/observable.mjs`) fails the build if a non-cost observable is ever shown in T^2 s.

The same rule applies to the drawn trajectory. Three cases draw a path that is not literally the object
they measure (the spin-orbit-torque case maps onto the field problem at the ideal ratio, the thermal case
draws the zero-temperature path behind a stochastic ensemble, the learned case draws the emitted pulse),
and each carries a `pulse_note` saying so, which the same gate checks is displayed. The two cases whose
answer IS a numerical path, the hard-axis sweep and the search family, draw the solver's own path on its
own image grid rather than the closed-form one, because there the shape of the path is the result.

## The lane gate

`espiralab/core/gate.py` decides live against precompute by measurement, never by hand: a case may run
live in the browser only if every method it runs has a closed form cheap enough for the browser, its
measured runtime is under 250 ms, and its artifact is under 512 kB. The verdict, the measured runtime,
the artifact size and the failing reasons go into the manifest. Nothing in the product is labelled live
without those numbers.

Two cases pass: C03, the spin-orbit-torque oracle, and C10, the replication of the kickoff paper's
peak fields; the methods of both are closed forms. A verdict of `live`
would be a label rather than a fact if nothing on the client could evaluate it, so the web carries its
own implementation of each (`frontend/src/engine/sotAnalytic.ts` and
`frontend/src/engine/uniaxialAnalytic.ts`, the complete elliptic integral by the arithmetic-geometric
mean, written independently of the engine's path through SciPy). Writing the second one caught two
defects, one on each side: the engine reported as the peak the pulse's value at its start and midpoint,
up to 27 per cent below the real peak, and the browser's
own shape-parameter bracket was high by one part in ten thousand at short switching times (findings
F-028 and F-029).
The case ships the constants it needs in `live_inputs`, the workbench recomputes it in the browser and
shows the agreement with the committed artifact, and two gates hold the two sides together: a Python test
refuses a manifest that puts a case in the live lane without a browser implementation of its methods, and
the browser gate fails the build if the two implementations disagree by more than a part in a million.
They currently agree exactly. Every other baked case is `precompute` and its manifest says why (the
numerical solver has no browser closed form, and the runtimes are seconds to minutes).

## Contract 2: the manifest

`manifests/<case>.json` binds an artifact to how it was produced: the case and its declared contract, the
engine and its version, the seed, the split, the methods and every result row, the artifact's byte size
and sha256, the lane verdict, the completeness counts, and the Contract 1 flags of the parameters it used
(so an artifact built on assumed damping says so). `validate` recomputes the hash from the artifact on
disk; a tampered or stale artifact fails the release, and a test proves the check fails on a mutated copy.

## The model registry

`models/registry.json` records the one learned method (R15, the amortized policy): its version, engine,
license, lane, checkpoint, the materials it trained on, the held-out materials, and the acceptance rule
with the scores that passed it. The policy trains over a damping range with the held-out materials'
dampings excluded, because four of the six materials share the same assumed damping and a material-level
split alone would not hold anything out in the policy's actual input space.

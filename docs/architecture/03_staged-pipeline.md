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
`validate`. The cross-case novel results (`run_novel.py`) and the free chain crossover map
(`run_lattice_ocp.py`) are separate entry points because they carry a Monte-Carlo or multi-hour cost.

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

## The lane gate

`espiralab/core/gate.py` decides live against precompute by measurement, never by hand: a case may run
live in the browser only if every method it runs has a closed form cheap enough for the browser, its
measured runtime is under 250 ms, and its artifact is under 512 kB. The verdict, the measured runtime,
the artifact size and the failing reasons go into the manifest. Today every baked case is `precompute`,
and the manifests say why (the numerical solver has no browser closed form, and the runtimes are tens of
seconds). Nothing in the product is labelled live without those numbers.

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

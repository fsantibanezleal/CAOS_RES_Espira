# Espira wiki

Espira computes the least-cost magnetic-field pulses that reverse the magnetization of van der Waals
magnets, extends that optimal control past the single-moment (macrospin) limit, and publishes every
result from committed artifacts. This wiki explains how the repository works; the physics of every
method is documented with its equations and sources in the engine's theory pages
(https://github.com/fsantibanezleal/CAOS_SpinOCT/tree/main/docs/theory).

## Map

| Section | What it covers |
|---|---|
| [architecture/01_overview.md](architecture/01_overview.md) | The two repositories, the lanes, the data flow from parameters to the web, and what is not yet on the staged base |
| [architecture/02_data-contracts.md](architecture/02_data-contracts.md) | Contract 1 (published parameters into the engine, with provenance and conversions) and Contract 2 (the bake into the web) |
| [architecture/03_staged-pipeline.md](architecture/03_staged-pipeline.md) | The named stages, the result schema, the measured lane gate, Contract 2 manifests and the model registry |
| [architecture/07_deploy.md](architecture/07_deploy.md) | How the static site is built and published, and how a release is verified |
| [frameworks/spinoct/](frameworks/spinoct/README.md) | The engine: what it implements, how it is pinned, a runnable example |
| [guides/01_run-the-bake.md](guides/01_run-the-bake.md) | Set up, bake, check, and serve locally |
| [cases/](cases/README.md) | The case taxonomy, the coverage matrix against the validated 26-case plan, and each baked case |
| [results/](results/README.md) | The results that span cases: the reliability front, the free chain and patch crossovers, the device trade-off, the hard-axis region, the penalty test, the exploitability table and the live-lane parity |

## Honesty and data policy

- There is no public experimental dataset of shaped-pulse switching in these materials. The real data
  is the set of spin-Hamiltonian parameters, each transcribed with a DOI, an uncertainty and a
  convention ([../data/README.md](../data/README.md)).
- The switching cost is an integral of the squared applied field, in tesla-squared-seconds. It is not an
  energy and is never presented as joules without an explicit circuit model.
- Every number in the web app and the manuscripts is read from `data/artifacts/`, produced by the offline
  bake. Tests never write that directory.
- Where a result is a bound rather than an optimum (the free chain costs are upper bounds on the true
  optimum; the barrier floor is a lower bound), the text says so.

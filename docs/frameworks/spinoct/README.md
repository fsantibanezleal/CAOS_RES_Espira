# spinoct, the engine

**What.** A Python library for optimal control of magnetization switching: the least-cost applied-field
(or current) pulse that reverses a magnetic moment, from the closed-form macrospin solution to the free
optimal control path of a spin chain. Source: https://github.com/fsantibanezleal/CAOS_SpinOCT. License:
MIT. Distribution: PyPI `spinoct`.

**Why this engine.** No open implementation of optimal control for classical magnetization dynamics
existed (research dossier 05, finding F-005 of the programme). The two differentiable micromagnetic codes
(`magnum.np`, `neuralmag`) target inverse design of geometry and material, not a time-dependent drive.
`spinoct` reimplements the published lineage and validates every numerical method against the analytic
positive controls before it is trusted.

## Install and pin

```bash
pip install spinoct==0.10.0     # pinned in data-pipeline/requirements.txt
```

Pure numpy and scipy. The unit-constant gate in the engine repository asserts the unit of every literal
in the solvers.

## What Espira uses

| Engine module | Used by | Theory page |
|---|---|---|
| `spinoct.analytic.UniaxialOptimalControl`, `cost_free_macrospin`, `cost_infinite_time` | per-case bake: pulses, cost curves, floors | [01](https://github.com/fsantibanezleal/CAOS_SpinOCT/blob/main/docs/theory/01-the-optimal-control-path.md), [03](https://github.com/fsantibanezleal/CAOS_SpinOCT/blob/main/docs/theory/03-what-the-cost-functional-measures.md) |
| `spinoct.numeric.ImageOCPSolver` | CrSBr biaxial reduction | [05](https://github.com/fsantibanezleal/CAOS_SpinOCT/blob/main/docs/theory/05-numerical-optimal-control-path.md) |
| `spinoct.control.static_switching_field` | static baseline | [06](https://github.com/fsantibanezleal/CAOS_SpinOCT/blob/main/docs/theory/06-baselines-and-metrics.md) |
| `spinoct.thermal.br_cost_reliability_front` | reliability front (M1) | [07](https://github.com/fsantibanezleal/CAOS_SpinOCT/blob/main/docs/theory/07-thermal-and-reliability.md) |
| `spinoct.lattice.compare_reversal_modes` | two-mode lattice comparison | [08](https://github.com/fsantibanezleal/CAOS_SpinOCT/blob/main/docs/theory/08-beyond-the-macrospin.md) |
| `spinoct.lattice.LatticeOCPSolver`, `minimum_energy_path`, `cost_floor_from_barrier` | free chain crossover map (M2 v2) | [12](https://github.com/fsantibanezleal/CAOS_SpinOCT/blob/main/docs/theory/12-free-chain-optimal-control-and-the-barrier-floor.md) |

Not yet surfaced in the product (backlog BL-032): GRAPE and CRAB with the price of realizability, the
discrete adjoint, the field-plus-current hybrid, the Pareto front, the amortized policy.

## A runnable example

```python
from spinoct.analytic import UniaxialOptimalControl
from spinoct.dynamics import MacrospinSystem
from spinoct.lattice import SpinChain, minimum_energy_path, cost_floor_from_barrier
from spinoct.units import bohr_magnetons_to_j_per_t, mev_to_joules

mu, K = bohr_magnetons_to_j_per_t(3.0), mev_to_joules(0.15)   # a CrSBr-like site
system = MacrospinSystem(mu=mu, anisotropy_j=K, alpha=0.01)
pulse = UniaxialOptimalControl.for_switching_time(system, system.switching_time_from_tau0(20.0))
print(pulse.cost(), "T^2 s")                                     # the minimum switching cost

chain = SpinChain(n_sites=24, mu=mu, anisotropy_j=K, exchange_j=10 * K, alpha=0.1)
barrier = minimum_energy_path(chain).barrier
print(barrier / K, cost_floor_from_barrier(barrier, mu, 0.1, chain.gamma))   # 8.87 K and its cost floor
```

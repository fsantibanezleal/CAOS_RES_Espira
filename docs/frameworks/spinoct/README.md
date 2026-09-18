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
pip install spinoct==0.16.0     # pinned in data-pipeline/requirements.txt
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
| `spinoct.analytic.sot.SOTOptimalControl`, `ideal_sot_ratio_beta` | C03, the spin-orbit-torque oracle, and the browser's live lane | [09](https://github.com/fsantibanezleal/CAOS_SpinOCT/blob/main/docs/theory/09-hybrid-field-and-current.md), [source](https://doi.org/10.1103/PhysRevB.105.134404) |
| `spinoct.thermal.switching_success_rate` | C07, the single-site thermal success rate | [07](https://github.com/fsantibanezleal/CAOS_SpinOCT/blob/main/docs/theory/07-thermal-and-reliability.md) |
| `spinoct.amortized.evaluate_policy` | C26, the amortized policy and its limit | [11](https://github.com/fsantibanezleal/CAOS_SpinOCT/blob/main/docs/theory/11-amortized-policy.md) |

| `spinoct.control.CRABSolver`, `GRAPESolver`, `HybridSolver` | C23, C24 and C25, the price of realizability | [13](https://github.com/fsantibanezleal/CAOS_SpinOCT/blob/main/docs/theory/13-constrained-control-and-the-price-of-realizability.md) |

Still not surfaced: the discrete adjoint as a rung of its own (R10) and the Pareto front (R14), backlog
BL-032. The adjoint itself is what drives the constrained solvers.

## The engine defect this product found

The three constrained rungs ran and did not converge, which is not the same as working. Espira's C23
declares that the cost must fall as the bandwidth grows, because more harmonics is a strictly larger
feasible set; measured against that, the engine returned 2.2 times the analytic optimum at two harmonics
and 14 times at six, at 90 to 230 seconds per solve. The cases were held at `blocked` with the
measurement rather than baked, and the engine was fixed (spinoct 0.13.000): all three solvers now run on
the exact adjoint gradient through their linear control bases, and CRAB falls monotonically from 2.15 to
1.13 times the optimum across one to six harmonics. Two further defects surfaced in the fixing, both
recorded on theory page 13.

## The one method the browser implements itself

The lane gate lets a case run live in the browser only when every method it declares is a closed form
under the runtime and size budgets. C03 passes, so the web carries its own implementation of that closed
form in `frontend/src/engine/sotAnalytic.ts`: the complete elliptic integral by the arithmetic-geometric
mean, and Eqs. 8, 9, 11 and 12 of Phys. Rev. B 105, 134404. It is written independently of the engine's
path (which goes through SciPy), so the agreement between the two is a check rather than a copy. The
workbench shows the agreement on the case, and a browser gate fails the build if it ever exceeds a part
in a million. They currently agree exactly.

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

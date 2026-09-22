# Results

The case pages ([../cases/](../cases/README.md)) answer one declared question each. These pages cover
the results that span cases: what was measured, by which method, what bounds it, and which committed
artifact carries it. Every number here is read from `data/artifacts/` and is reproducible by rerunning
the bake that wrote it.

| Page | Question | Artifact | Where it is shown |
|---|---|---|---|
| [01_reliability-front.md](01_reliability-front.md) | What does reliability cost, and where does it buy anything? | `novel.json`, `thermal-success-rate.json` | Experiments, Reliability (R12) |
| [02_free-chain-crossover.md](02_free-chain-crossover.md) | When does a chain stop reversing coherently? | `lattice_ocp.json` | Experiments, Free chain optimal control |
| [03_two-dimensional-patch.md](03_two-dimensional-patch.md) | Does that carry over to a patch, and how does the wall width move it? | `patch_ocp.json` | Experiments, Two-dimensional patch |
| [04_device-trade-offs.md](04_device-trade-offs.md) | What must the hardware supply, and what does a shorter deadline cost? | `pareto.json` | Experiments, Device trade-offs (R14) |
| [05_hard-axis-region.md](05_hard-axis-region.md) | Over what region does a hard axis actually reduce the cost? | `hard_axis_map.json` | Experiments, Where the hard axis pays |
| [06_penalty-prediction.md](06_penalty-prediction.md) | Can a deterministic penalty replace the stochastic ensemble? | `penalty_test.json` | Experiments, Penalty against ensemble |
| [07_exploitability.md](07_exploitability.md) | Which material is worth switching at all? | `descriptors.json` | Experiments, Exploitability by material |
| [08_live-lane-parity.md](08_live-lane-parity.md) | Does the browser compute the same thing as the engine? | `live_parity.json` | Implementation, Live-lane parity |

## What a result page states

Each page follows the same shape, because the product's failures have come from skipping one of these:

1. **The question**, as the case or the backlog item declared it before anything was computed.
2. **The method**, naming the engine rung and the parameters that were swept.
3. **The measurement**, with its numbers and its uncertainty.
4. **What bounds it**: whether a quantity is an optimum, an upper bound from an explicit trajectory, or
   a rigorous lower bound, and which.
5. **What it does not show**, including any region where the method is not trustworthy and is therefore
   excluded from the claim rather than averaged into it.

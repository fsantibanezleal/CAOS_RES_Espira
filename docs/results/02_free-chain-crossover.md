# When a chain stops reversing coherently

Artifact: `data/artifacts/lattice_ocp.json`. Bake: `python data-pipeline/run_lattice_ocp.py` (hours,
parallel and checkpointed). Shown in Experiments, "Free chain optimal control". Case C19, manuscript M2
(`10.5281/zenodo.22822159`). The continuum check is case C22.

## The question

The optimal-control literature this product builds on treats the magnet as a single moment. Its authors
state the open question in print: under what conditions does nonuniform reversal become the
energy-efficient mechanism? Answering it needs a search over every site's trajectory, with no assumed
mode.

## The method

`spinoct.lattice.LatticeOCPSolver` minimizes the switching cost over the trajectory of every site of a
chain, from three starts: the uniform optimum with a symmetry-breaking perturbation, a tanh domain wall,
and the minimum energy path. The cheapest is kept. The minimum energy path itself comes from the
climbing-image string method, and its barrier gives the cost floor `4 alpha dE / (gamma mu)`.

## What each number is

- **Each ratio is an upper bound.** It is the cost of an explicit feasible trajectory on the same grid as
  the uniform bound, so it is valid even where the optimizer stopped at its iteration cap; the true
  optimum can only be lower.
- **The floor is a rigorous lower bound**, at every switching time, from the barrier of the minimum
  energy path.

The true optimum lies between them, and the product never states it as located when it is only bracketed.

## The measurement

Above a crossover length and at long switching time the optimal reversal is a domain wall, strictly
cheaper than uniform rotation, by up to 51 per cent over the swept grid. Below that length, or at short
switching times, uniform rotation is optimal and the search returns it. This supersedes the conclusion of
the earlier two-mode comparison, which fixed the two modes in advance and therefore could not find the
crossover.

The barrier behind the floor was checked against the continuum limit (case C22): over one to twelve
sites per wall width the lattice barrier approaches the Bloch-wall energy `2 sqrt(2 J K)` from below,
0.9547 to 0.9997 of it, with the deficit falling as one over the width squared (deficit times width
squared between 0.0425 and 0.0453).

## What it does not show

The chain is a one-dimensional lattice with nearest-neighbour exchange and uniaxial anisotropy, in
reduced units: it converts to a material only through an exchange and an anisotropy measured together,
which none of this product's materials has. The two-dimensional extension is
[03_two-dimensional-patch.md](03_two-dimensional-patch.md).

# FePS3, negative control

Case `feps3-negative-control`, category `negative-control`. Generated from the registry by `scripts/gen_case_docs.py`.

## Why it is in the matrix

An Ising antiferromagnet where uniform ferromagnetic-macrospin reversal is not the relevant switching mode. Included to show the machinery's honest limit.

## What a domain expert should see

The macrospin optimal-control numbers are computed but flagged as not physically representative of the true antiferromagnetic switching; a number is not the same as a result.

## Material: FePS3

| Parameter | Value |
|---|---|
| Family | Ising antiferromagnet |
| Spin | 2 |
| Moment per site | 4 Bohr magnetons |
| Anisotropy per site | 2 meV |
| Hard-axis ratio | 0 |
| Gilbert damping | 0.01 (range 0.005 to 0.02) |
| Ordering temperature | 118 K |
| Easy axis | out-of-plane (very strong Ising) |

The negative control. An Ising antiferromagnet (Neel temperature 118 K), where uniform field-driven reversal of a single sublattice is not the relevant switching mode. Included so the product can show what the optimal-control machinery says when its own assumptions (a single ferromagnetic macrospin) do not hold, rather than silently producing a number.

Sources:

- https://doi.org/10.1103/PhysRevB.94.214407

## Variants

Switching times, in units of the Larmor timescale tau0: 5, 20, 50.

## What the bake computes

For every variant: the analytic optimal pulse, its trajectory on the sphere, and its cost against the
free-macrospin cost and the universal floor (with the band from the damping range). A static-field
baseline at the longest switching time. Numerical biaxial solve: No: the material is treated as uniaxial, where the analytic optimum is exact.

Artifact: `data/artifacts/feps3-negative-control.json`.

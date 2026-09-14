# CrI3, field-driven reversal

Case `cri3-field`, category `real-material-field`. Generated from the registry by `scripts/gen_case_docs.py`.

## Why it is in the matrix

The archetypal two-dimensional magnet and the clean strong-uniaxial extreme.

## What a domain expert should see

Large anisotropy: a fast, high-amplitude optimal pulse; the analytic solution is exact.

## Material: CrI3

| Parameter | Value |
|---|---|
| Family | semiconductor |
| Spin | 1.5 |
| Moment per site | 3 Bohr magnetons |
| Anisotropy per site | 0.7 meV |
| Hard-axis ratio | 0 |
| Gilbert damping | 0.01 (range 0.005 to 0.02) |
| Ordering temperature | 45 K |
| Easy axis | out-of-plane (strong uniaxial, Ising-like) |

The archetypal two-dimensional magnet. Large uniaxial (Ising-like) anisotropy, the clean uniaxial extreme of the family, where the analytic optimal control path applies directly. Monolayer Tc about 45 K.

Sources:

- https://doi.org/10.1038/nature22391

## Variants

Switching times, in units of the Larmor timescale tau0: 2, 5, 10, 20, 50, 100.

## What the bake computes

For every variant: the analytic optimal pulse, its trajectory on the sphere, and its cost against the
free-macrospin cost and the universal floor (with the band from the damping range). A static-field
baseline at the longest switching time. Numerical biaxial solve: No: the material is treated as uniaxial, where the analytic optimum is exact.

Artifact: `data/artifacts/cri3-field.json`.

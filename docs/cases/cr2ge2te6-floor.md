# Cr2Ge2Te6, the low-damping floor

Case `cr2ge2te6-floor`, category `damping-extreme`. Generated from the registry by `scripts/gen_case_docs.py`.

## Why it is in the matrix

The record-low-damping member, which sets the best-case universal floor because that floor is linear in the damping.

## What a domain expert should see

The lowest universal floor of the family; a wide uncertainty band because the floor tracks the measured damping range directly.

## Material: Cr2Ge2Te6

| Parameter | Value |
|---|---|
| Family | semiconductor |
| Spin | 1.5 |
| Moment per site | 3 Bohr magnetons |
| Anisotropy per site | 0.05 meV |
| Hard-axis ratio | 0 |
| Gilbert damping | 0.0007 (range 0.0004 to 0.001) |
| Ordering temperature | 40 K |
| Easy axis | out-of-plane (weak, near-Heisenberg) |

The low-damping extreme: a record-low Gilbert damping of 4 to 10 x 10^-4 measured by spin pumping (Nat. Commun. 2023). Because the universal energy floor is linear in the damping, this material sets the best-case reachable floor of the whole family. Weak, near-Heisenberg anisotropy.

Sources:

- https://doi.org/10.1038/s41467-023-39529-8

## Variants

Switching times, in units of the Larmor timescale tau0: 2, 5, 10, 20, 50, 100.

## What the bake computes

For every variant: the analytic optimal pulse, its trajectory on the sphere, and its cost against the
free-macrospin cost and the universal floor (with the band from the damping range). A static-field
baseline at the longest switching time. Numerical biaxial solve: No: the material is treated as uniaxial, where the analytic optimum is exact.

Artifact: `data/artifacts/cr2ge2te6-floor.json`.

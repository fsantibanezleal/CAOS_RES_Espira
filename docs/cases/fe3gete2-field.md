# Fe3GeTe2, field-driven reversal

Case `fe3gete2-field`, category `real-material-field`. Generated from the registry by `scripts/gen_case_docs.py`.

## Why it is in the matrix

An itinerant metal with strong perpendicular anisotropy, cleanly uniaxial.

## What a domain expert should see

Uniaxial: the analytic optimal control path applies and the cost cannot beat the free-macrospin floor.

## Material: Fe3GeTe2

| Parameter | Value |
|---|---|
| Family | itinerant metal |
| Spin | 1 |
| Moment per site | 1.82 Bohr magnetons |
| Anisotropy per site | 0.3 meV |
| Hard-axis ratio | 0 |
| Gilbert damping | 0.01 (range 0.003 to 0.03) |
| Ordering temperature | 130 K |
| Easy axis | out-of-plane c axis (strong perpendicular anisotropy) |

Itinerant ferromagnet with strong perpendicular magnetic anisotropy. Moments and exchange from DFT plus Wannier plus TB2J (Ruiz 2024); the ordered moment is disputed between sources (1.82 average vs 2.64/1.47 per inequivalent Fe site), and that disagreement is propagated rather than hidden. Monolayer Tc falls to about 130 K. Damping is not firmly pinned in the literature reviewed; the band is wide on purpose.

Sources:

- https://doi.org/10.1021/acs.nanolett.4c01019

## Variants

Switching times, in units of the Larmor timescale tau0: 2, 5, 10, 20, 50, 100.

## What the bake computes

For every variant: the analytic optimal pulse, its trajectory on the sphere, and its cost against the
free-macrospin cost and the universal floor (with the band from the damping range). A static-field
baseline at the longest switching time. Numerical biaxial solve: No: the material is treated as uniaxial, where the analytic optimum is exact.

Artifact: `data/artifacts/fe3gete2-field.json`.

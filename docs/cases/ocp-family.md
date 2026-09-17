# The optimal control path family (several coexisting optima)

Case `ocp-family` (C06), category B. Published replication. Baked: committed artifacts, replayed by the web app.

Generated from the registry by `scripts/gen_case_docs.py`.

## Why it is in the matrix

At a biaxial ratio of four and moderate damping, several distinct optimal control paths coexist at the same switching time. A single-seed solver reports one of them and calls it the optimum, which is the failure this case exists to expose.

## What a domain expert should see

A multi-seed search finds more than one distinct converged path, and they are NOT close together. Measured 2026-09-17 at a hard-axis ratio of four, a damping of 0.2 and ten tau0: two families, one passing near the easy plane at 1.5206e-11 T^2 s and one climbing over the hard axis at 2.0250e-11, a spread of 33 per cent. Three of the six seeds land on the expensive family, so a single-seed solver has an even chance of reporting a cost a third too high and calling it the optimum. The cheapest is what the product reports everywhere else, which is why every biaxial bake in this repository runs a multi-seed search.

## Kill criterion

If every seed converges to the same path, either the search is not exploring or the family does not exist at these parameters; both change what the product may claim. A seed that converges BELOW the cheapest family would mean the converged flag is not trustworthy.

## System: a synthetic reference macrospin

This case tests mathematics, not a material, so it pins no parameter row. The reference system is a
moment of 3 Bohr magnetons with an easy-axis anisotropy of 0.15 meV per
site, a Gilbert damping of 0.2 and a hard-axis ratio of 4: the scale of the
van der Waals family, so the oracle is comparable with the real cases. These values are definitional.

## Variants

Search seed (index): 0, 1, 2, 3, 4, 5.

## Design

| Field | Value |
|---|---|
| Methods | R07 |
| Ground truth | published |
| Split | control |
| Seed | 0 |
| Surface | workbench |

## Sources

- https://doi.org/10.1103/PhysRevB.107.214448

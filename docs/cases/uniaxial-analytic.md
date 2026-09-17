# Uniaxial macrospin, the analytic optimum

Case `uniaxial-analytic` (C02), category A. Exact oracles. Baked: committed artifacts, replayed by the web app.

Generated from the registry by `scripts/gen_case_docs.py`.

## Why it is in the matrix

The closed-form uniaxial optimal control path in Jacobi elliptic functions, the exact result the whole product is built on.

## What a domain expert should see

The pulse reverses the moment exactly at T, its cost sits between the infinite-time floor and the free-macrospin cost, and the numerical solver converges onto it from above.

## Kill criterion

A cost below the universal floor 4 alpha K / (gamma mu), or a pulse that does not reverse the moment, falsifies the implementation.

## System: a synthetic reference macrospin

This case tests mathematics, not a material, so it pins no parameter row. The reference system is a
moment of 3 Bohr magnetons with an easy-axis anisotropy of 0.15 meV per
site, a Gilbert damping of 0.1 and a hard-axis ratio of 0: the scale of the
van der Waals family, so the oracle is comparable with the real cases. These values are definitional.

## Variants

Switching time (tau0): 2, 5, 10, 20, 50, 100.

## Design

| Field | Value |
|---|---|
| Methods | R05, R07 |
| Ground truth | analytic |
| Split | control |
| Seed | 0 |
| Surface | workbench |

## Sources

- https://doi.org/10.1103/PhysRevLett.126.177206

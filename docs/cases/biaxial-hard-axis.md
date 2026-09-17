# Biaxial anisotropy, the hard-axis cost reduction

Case `biaxial-hard-axis` (C04), category A. Exact oracles. Baked: committed artifacts, replayed by the web app.

Generated from the registry by `scripts/gen_case_docs.py`.

## Why it is in the matrix

A hard axis lets the internal torque do part of the work, which is the one mechanism in this literature that beats the free-macrospin cost. The sweep over the hard-axis ratio is the mechanism's signature and has no closed form.

## What a domain expert should see

The benefit is not monotone. The cost falls to a minimum at a hard-axis ratio of order one (at this damping and switching time, about 45 per cent below the uniaxial optimum) and rises again for a stronger hard axis, which adds an in-plane barrier the moment must cross. Measured 2026-09-17; the location of the minimum moves with the damping.

## Kill criterion

A cost below the universal floor means the internal torque is being double counted. A benefit that survives at long switching time would also be wrong: as the switching time grows the uniaxial cost saturates at the floor while the hard axis keeps charging for the in-plane barrier, so the mechanism must turn harmful there.

## System: a synthetic reference macrospin

This case tests mathematics, not a material, so it pins no parameter row. The reference system is a
moment of 3 Bohr magnetons with an easy-axis anisotropy of 0.15 meV per
site, a Gilbert damping of 0.2 and a hard-axis ratio of 0: the scale of the
van der Waals family, so the oracle is comparable with the real cases. These values are definitional.

## Variants

Hard-axis ratio (xi): 0.5, 1, 2, 3, 4, 5.

## Design

| Field | Value |
|---|---|
| Methods | R07 |
| Ground truth | provisional |
| Split | control |
| Seed | 0 |
| Surface | workbench |

## Sources

- https://doi.org/10.1103/PhysRevB.107.214448

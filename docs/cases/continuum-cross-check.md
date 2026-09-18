# Continuum cross-check: the lattice wall barrier against the closed form

Case `continuum-cross-check` (C22), category D. Beyond the macrospin. Baked: committed artifacts, replayed by the web app.

Generated from the registry by `scripts/gen_case_docs.py`.

## Why it is in the matrix

The free-chain results rest on the minimum-energy-path barrier of a discrete chain. In the continuum limit that barrier must become the energy of a Bloch wall, 2 sqrt(2 J K) for a chain with exchange J and anisotropy K per site (the continuum wall energy 4 sqrt(A K) written in lattice units), and the lattice must approach it from below as the wall spans more sites. The plan asked for agreement with an established micromagnetic code; a closed-form limit is a stronger reference than a second code, because it has no discretization of its own.

## What a domain expert should see

The barrier converges onto the continuum wall energy from below, and the deficit falls as one over the wall width squared, the leading discreteness correction. Measured 2026-09-18 over one to twelve sites per wall width (J/K from 2 to 288, chains of twelve widths): 0.9547, 0.9891, 0.9973, 0.9988, 0.9993 and 0.9997 of the continuum value, with the deficit times the width squared between 0.0425 and 0.0453 throughout. Before engine 0.15.000 the solver diverged above J/K of about 24 and still returned a barrier, 43 times the continuum value at J/K = 40; the sweep reaches far past that on purpose.

## Kill criterion

A barrier above the continuum wall energy, an unconverged path reported as a barrier, or a deficit that does not shrink like the width squared: any of them means the lattice energy, the string method or the continuum limit is wrong.

## System: a synthetic reference macrospin

This case tests mathematics, not a material, so it pins no parameter row. The reference system is a
moment of 3 Bohr magnetons with an easy-axis anisotropy of 0.15 meV per
site, a Gilbert damping of 0.1 and a hard-axis ratio of 0: the scale of the
van der Waals family, so the oracle is comparable with the real cases. These values are definitional.

## Variants

Sites per wall width (sites): 1, 2, 4, 6, 8, 12.

## Design

| Field | Value |
|---|---|
| Methods | R16 |
| Ground truth | analytic |
| Split | control |
| Seed | 0 |
| Surface | workbench |

## Sources

- https://doi.org/10.1063/1.2720838
- https://doi.org/10.1016/j.cpc.2015.07.001

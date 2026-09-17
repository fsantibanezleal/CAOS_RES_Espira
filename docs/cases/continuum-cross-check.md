# Continuum cross-check against a micromagnetic solver

Case `continuum-cross-check` (C22), category D. Beyond the macrospin. Planned: declared and runnable, not yet computed.

Generated from the registry by `scripts/gen_case_docs.py`.

## Why it is in the matrix

Our lattice solver and an established micromagnetic code should agree in the continuum limit. Agreement is evidence; disagreement is a finding either way.

## What a domain expert should see

Wall energies and reversal costs agree within the discretization error once the lattice spacing is small against the wall width.

## Kill criterion

A disagreement that does not shrink with the lattice spacing means one of the two energy functionals is wrong.

## System

Declared without a system: the case is not computed yet, and its system is chosen when it is.

## Variants

Sites per wall width (sites): 1, 2, 4, 6, 8, 12.

## Design

| Field | Value |
|---|---|
| Methods | R16 |
| Ground truth | provisional |
| Split | control |
| Seed | 0 |
| Surface | workbench |

## Sources

No external reference: the case is checked against the engine's own oracles.

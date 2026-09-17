# A two-dimensional CrSBr patch, size sweep

Case `patch-2d-crsbr` (C20), category D. Beyond the macrospin. Planned: declared and runnable, not yet computed.

Generated from the registry by `scripts/gen_case_docs.py`.

## Why it is in the matrix

A chain is one dimension; a real element is a patch. The crossover length in two dimensions is the quantity a device designer actually needs.

## What a domain expert should see

The same barrier argument applies with a two-dimensional wall, so the crossover moves to a different length scale.

## Kill criterion

A two-dimensional result that contradicts the one-dimensional limit at small width would mean the lattice generalization is wrong.

## System

Declared without a system: the case is not computed yet, and its system is chosen when it is.

## Variants

Patch width (sites): 4, 8, 12, 16, 24, 32.

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

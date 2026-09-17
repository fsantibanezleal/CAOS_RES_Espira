# CrCl3 against CrBr3, the anisotropy-sign contrast

Case `crcl3-crbr3-contrast` (C17), category C. Real materials. Planned: declared and runnable, not yet computed.

Generated from the registry by `scripts/gen_case_docs.py`.

## Why it is in the matrix

Two members of one chemical family with opposite anisotropy character, easy-plane against easy-axis. The optimal control problem changes qualitatively between them.

## What a domain expert should see

The easy-plane member has no barrier along the field axis in the macrospin picture, so the product must refuse the uniaxial machinery rather than produce a number.

## Kill criterion

Producing a switching cost for an easy-plane material through the easy-axis solution would be exactly the error the negative control exists to catch.

## System

Declared without a system: the case is not computed yet, and its system is chosen when it is.

## Variants

Switching time (tau0): 2, 5, 10, 20, 50, 100.

## Design

| Field | Value |
|---|---|
| Methods | R00, R05 |
| Ground truth | provisional |
| Split | test |
| Seed | 0 |
| Surface | workbench |

## Sources

No external reference: the case is checked against the engine's own oracles.

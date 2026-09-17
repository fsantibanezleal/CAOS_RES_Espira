# Spin-orbit torque, the analytic optimum

Case `sot-analytic` (C03), category A. Exact oracles. Planned: declared and runnable, not yet computed.

Generated from the registry by `scripts/gen_case_docs.py`.

## Why it is in the matrix

The current-driven counterpart: the closed-form optimal spin-orbit-torque protocol, with its ideal field-like to damping-like ratio.

## What a domain expert should see

The optimal ratio xi_D = -alpha xi_F reproduces the published protocol; the cost falls with switching time like the field case.

## Kill criterion

A reversal at the forbidden ratio xi_F = alpha xi_D, where the torque cannot drive the moment over the barrier, would mean the spin-orbit torque enters with the wrong sign.

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
| Methods | R06 |
| Ground truth | analytic |
| Split | control |
| Seed | 0 |
| Surface | workbench |

## Sources

- https://doi.org/10.1103/PhysRevB.105.134404

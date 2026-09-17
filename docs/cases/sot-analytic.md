# Spin-orbit torque, the analytic optimum

Case `sot-analytic` (C03), category A. Exact oracles. Baked: committed artifacts, replayed by the web app.

Generated from the registry by `scripts/gen_case_docs.py`.

## Why it is in the matrix

The current-driven counterpart: the closed-form optimal spin-orbit-torque protocol, with its ideal field-like to damping-like ratio.

## What a domain expert should see

At the ideal ratio xi_D = -alpha xi_F the current torque points entirely along the switching direction, the average current follows Eq. 8 exactly, and the fast-switching cost asymptote falls as 1/T like the field case. At the forbidden ratio xi_F = alpha xi_D the protocol is reported as forbidden rather than returning a finite cost. The reported quantity is a current integral in the reference reduced units, NOT a field cost in T^2 s, and the case declares that so it is never mixed into a field-cost comparison.

## Kill criterion

A reversal at the forbidden ratio xi_F = alpha xi_D, where the torque cannot drive the moment over the barrier, would mean the spin-orbit torque enters with the wrong sign. A mean current that disagrees with the closed form of Eq. 8, or a reduced-unit cost quoted in T^2 s, is equally a failure.

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

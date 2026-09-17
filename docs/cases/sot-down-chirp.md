# Spin-orbit torque, the simplified down-chirp protocol

Case `sot-down-chirp` (C08), category B. Published replication. Planned: declared and runnable, not yet computed.

Generated from the registry by `scripts/gen_case_docs.py`.

## Why it is in the matrix

The published simplified current protocol, which trades a little cost for a pulse a circuit can actually produce.

## What a domain expert should see

The simplified protocol costs more than the exact optimum by a modest factor and still reverses the moment.

## Kill criterion

A simplified protocol that beats the exact optimum would mean the optimum is not optimal, and the analytic derivation is wrong.

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
| Methods | R06, R04 |
| Ground truth | published |
| Split | control |
| Seed | 0 |
| Surface | workbench |

## Sources

- https://doi.org/10.1103/PhysRevB.105.134404

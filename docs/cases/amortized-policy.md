# The amortized policy on held-out materials

Case `amortized-policy` (C26), category F. Screening and learned. Planned: declared and runnable, not yet computed.

Generated from the registry by `scripts/gen_case_docs.py`.

## Why it is in the matrix

Every solver here re-optimizes from scratch. A policy that emits a near-optimal pulse instantly is the useful object, and the uniaxial optimum is known, so its claim is checkable.

## What a domain expert should see

On materials it never trained on, the emitted pulse reverses the moment and costs within ten per cent of the analytic optimum.

## Kill criterion

A policy that cannot reach the analytic optimum where the optimum is known has no business being trusted anywhere else; that is the pre-declared acceptance gate.

## System

Declared without a system: the case is not computed yet, and its system is chosen when it is.

## Variants

Damping (alpha): 0.005, 0.01, 0.05, 0.1, 0.2, 0.5.

## Design

| Field | Value |
|---|---|
| Methods | R15 |
| Ground truth | analytic |
| Split | test |
| Seed | 0 |
| Surface | workbench |

## Sources

No external reference: the case is checked against the engine's own oracles.

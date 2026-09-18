# Spin-orbit torque, the simplified down-chirp protocol

Case `sot-down-chirp` (C08), category B. Published replication. Baked: committed artifacts, replayed by the web app.

Generated from the registry by `scripts/gen_case_docs.py`.

## Why it is in the matrix

At the ideal ratio of the spin-orbit-torque couplings the optimal current rotates at the precession frequency and reverses its rotation at the barrier crossing. The source replaces it by a current a circuit can produce: constant amplitude, frequency swept linearly from 1.4 times the resonant frequency to minus that (its Eq. 15), and reports the switching probability at a thermal stability factor of 60. Those probabilities are the published ground truth.

## What a domain expert should see

The source reports a switching probability of 0.89 at 0.17 j0, 0.97 at 0.18 j0 and practically one at 0.20 j0. Measured 2026-09-18 with 1,000 stochastic copies per point, this engine does NOT reproduce them: 0.009 at 0.17 j0, 0.043 at 0.18, 0.22 at 0.20, 0.59 at 0.22 and 0.90 at 0.25, the same curve shifted up by about 1.4 in amplitude, with a zero-temperature threshold of 0.21 j0. Ruled out: the rotation sense, the starting tilt, the coupling convention, the chirp tuning, thermal noise, the pulse length and a factor of two in the time unit. The case is a recorded non-replication, not a hidden one; the sweep extends past the published amplitudes so the engine's own curve is visible.

## Kill criterion

Quoting the source's probabilities as reproduced when the engine does not reproduce them. Equally, a chirped pulse that switches in the counter-rotating sense would mean the spin-orbit torque enters with the wrong handedness.

## System: a synthetic reference macrospin

This case tests mathematics, not a material, so it pins no parameter row. The reference system is a
moment of 3 Bohr magnetons with an easy-axis anisotropy of 0.15 meV per
site, a Gilbert damping of 0.1 and a hard-axis ratio of 0: the scale of the
van der Waals family, so the oracle is comparable with the real cases. These values are definitional.

## Variants

Current amplitude (j0): 0.17, 0.18, 0.2, 0.22, 0.25, 0.3.

## Design

| Field | Value |
|---|---|
| Methods | R04 |
| Ground truth | published |
| Split | control |
| Seed | 0 |
| Surface | workbench |

## Sources

- https://doi.org/10.1103/PhysRevB.105.134404

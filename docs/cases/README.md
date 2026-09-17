# Cases

A case is a scientific question the product answers: a system, a variant family, and a
pre-declared expectation with the kill criterion that would make it a failure. The 26 cases of the
validated plan are all declared here, so a missing one cannot hide behind the ones that are baked.

**10 baked, 14 planned, 2 blocked.** Baked cases
have committed artifacts; planned cases are declared and runnable but not yet computed; blocked
cases name what is missing. This page and the per-case pages are generated from the registry
(`python scripts/gen_case_docs.py`).

## A. Exact oracles

Closed-form or exactly-known answers every numerical method must reproduce.

| Case | Status | Variants | Methods | Ground truth |
|---|---|---|---|---|
| C01 [Free macrospin, no anisotropy](free-macrospin.md) | planned | 6 x switching time | R05 | analytic |
| C02 [Uniaxial macrospin, the analytic optimum](uniaxial-analytic.md) | baked | 6 x switching time | R05, R07 | analytic |
| C03 [Spin-orbit torque, the analytic optimum](sot-analytic.md) | planned | 6 x switching time | R06 | analytic |
| C04 [Biaxial anisotropy, the hard-axis cost reduction](biaxial-hard-axis.md) | baked | 6 x hard-axis ratio | R07 | provisional |

## B. Published replication

Figures and tables of the lineage papers, reproduced or refuted.

| Case | Status | Variants | Methods | Ground truth |
|---|---|---|---|---|
| C05 [Biaxial numerical optimal control (Phys. Rev. B 107, 214448, figures 3 and 7)](prb107-biaxial-figures.md) | blocked (The published figure values have not been digitized from the...) | 6 x switching time | R07 | published |
| C06 [The optimal control path family (several coexisting optima)](ocp-family.md) | planned | 6 x search seed | R07 | published |
| C07 [Thermal success rate against switching time](thermal-success-rate.md) | planned | 6 x thermal stability factor | R11 | published |
| C08 [Spin-orbit torque, the simplified down-chirp protocol](sot-down-chirp.md) | planned | 6 x switching time | R06, R04 | published |
| C09 [Longitudinal stabilization, the cost of reliability](longitudinal-stabilization.md) | baked | 6 x longitudinal field | R11, R12 | published |
| C10 [The kickoff paper's own switching energies](kickoff-replication.md) | blocked (The full text is behind a Cloudflare challenge and has not b...) | 6 x switching time | R05, R07 | published |

## C. Real materials

Each van der Waals magnet from primary-source parameters, with a negative control.

| Case | Status | Variants | Methods | Ground truth |
|---|---|---|---|---|
| C11 [CrSBr, field-driven reversal](crsbr-field.md) | baked | 6 x switching time | R00, R05, R07 | provisional |
| C12 [Fe3GeTe2, field-driven reversal](fe3gete2-field.md) | baked | 6 x switching time | R00, R05 | provisional |
| C13 [Fe3GaTe2, field-driven reversal](fe3gate2-field.md) | baked | 6 x switching time | R00, R05 | provisional |
| C14 [CrI3, field-driven reversal](cri3-field.md) | baked | 6 x switching time | R00, R05 | provisional |
| C15 [Cr2Ge2Te6, the low-damping floor](cr2ge2te6-floor.md) | baked | 6 x switching time | R00, R05 | provisional |
| C16 [Fe5GeTe2, the near-room-temperature metal](fe5gete2-field.md) | planned | 6 x switching time | R00, R05 | provisional |
| C17 [CrCl3 against CrBr3, the anisotropy-sign contrast](crcl3-crbr3-contrast.md) | planned | 6 x switching time | R00, R05 | provisional |
| C18 [FePS3, negative control](feps3-negative-control.md) | baked | 6 x switching time | R00, R05 | provisional |

## D. Beyond the macrospin

Chains, patches and the continuum limit, where the single-moment picture fails.

| Case | Status | Variants | Methods | Ground truth |
|---|---|---|---|---|
| C19 [The spin chain, where uniform rotation stops being optimal](chain-crossover.md) | baked | 9 x chain length | R07, R16 | provisional |
| C20 [A two-dimensional CrSBr patch, size sweep](patch-2d-crsbr.md) | planned | 6 x patch width | R16 | provisional |
| C21 [A two-dimensional Fe3GaTe2 patch, perpendicular anisotropy](patch-2d-fe3gate2.md) | planned | 6 x patch width | R16 | provisional |
| C22 [Continuum cross-check against a micromagnetic solver](continuum-cross-check.md) | planned | 6 x sites per wall width | R16 | provisional |

## E. Constrained and hybrid control

Bandwidth, amplitude and slew limits; field together with current.

| Case | Status | Variants | Methods | Ground truth |
|---|---|---|---|---|
| C23 [Band-limited control, the price of realizability](crab-bandwidth.md) | planned | 6 x harmonics | R09, R05 | analytic |
| C24 [Amplitude and slew-rate limited control](grape-amplitude-slew.md) | planned | 6 x amplitude cap | R08, R05 | analytic |
| C25 [Field together with current, the hybrid cost](field-plus-current.md) | planned | 6 x current price | R13 | provisional |

## F. Screening and learned

The parameter family as a search space, and the amortized policy on held-out materials.

| Case | Status | Variants | Methods | Ground truth |
|---|---|---|---|---|
| C26 [The amortized policy on held-out materials](amortized-policy.md) | planned | 6 x damping | R15 | analytic |

## Surfaces

Baked cases marked `workbench` are selectable in the App; those marked `experiments` are cross-case
results shown on the Experiments page (the reliability front and the free chain crossover map).
Cross-case results never appear in the single-case workbench.

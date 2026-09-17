# The kickoff paper's own switching energies

Case `kickoff-replication` (C10), category B. Published replication. Blocked: something outside this repository is missing.

**What is missing.** The full text is behind a Cloudflare challenge and has not been read. The abstract's 1 to 10 ps rotation window and the press summaries' 126 to 140 ps switching times are in tension, and no number may be quoted until the paper itself is read (programme backlog BL-002).

Generated from the registry by `scripts/gen_case_docs.py`.

## Why it is in the matrix

The paper that started this product reports switching times and energies for three van der Waals magnets. Reproducing them is the most direct external check available.

## What a domain expert should see

Our costs, converted through an explicit circuit model, land in the same range as the published energies for the same materials and switching times.

## Kill criterion

A disagreement larger than the damping uncertainty band would mean either their circuit assumption or our parameter set differs, and the product must say which.

## Material: CrSBr

| Parameter | Value | Provenance | Source |
|---|---|---|---|
| Family | semiconductor | | |
| Spin | 1.5 | | |
| Easy axis | in-plane b axis (triaxial: b easy, z hard) | | |
| Moment per site | 3 Bohr magnetons | derived | [10.1002/advs.202202467](https://doi.org/10.1002/advs.202202467) |
| Anisotropy per site (unit-vector convention) | 0.15 meV | assumed | [10.1002/advs.202202467](https://doi.org/10.1002/advs.202202467) |
| Hard-axis ratio | 3 | assumed | [10.1038/s41524-023-01050-3](https://doi.org/10.1038/s41524-023-01050-3) |
| Gilbert damping | 0.01 (range 0.004 to 0.02) | assumed | [10.1021/acs.nanolett.2c02863](https://doi.org/10.1021/acs.nanolett.2c02863) |
| Ordering temperature | 146 K | measured | [10.1021/acs.nanolett.1c00219](https://doi.org/10.1021/acs.nanolett.1c00219) |

Monolayer, ferromagnetic within a layer, antiferromagnetically stacked in bulk. The exchange Hamiltonian is measured by inelastic neutron scattering (Scheie 2022, S = 3/2), but the anisotropy is below the neutron resolution; the easy-axis scale and the hard-axis ratio used here are assumed and flagged. Triaxiality and its dielectric tunability are computed (Rudenko 2023): the substrate is a knob on the hard axis.

Every value enters through Contract 1 (`data/materials/parameters.csv`); the conversion from the published
unit and each value's note are in that table. Assumed values are not measurements.

## Variants

Switching time (tau0): 2, 5, 10, 20, 50, 100.

## Design

| Field | Value |
|---|---|
| Methods | R05, R07 |
| Ground truth | published |
| Split | control |
| Seed | 0 |
| Surface | workbench |

## Sources

- https://doi.org/10.1002/adma.202523059

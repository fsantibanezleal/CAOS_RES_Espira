# Longitudinal stabilization, the cost of reliability

Case `longitudinal-stabilization` (C09), category B. Published replication. Baked: committed artifacts, replayed by the web app.

Generated from the registry by `scripts/gen_case_docs.py`.

## Why it is in the matrix

A field along the moment is invisible to the optimal pulse dynamics but removes the hyperbolic instability that thermal fluctuations excite. The published work shows the stabilization; what it costs is our own addition, and manuscript M1.

## What a domain expert should see

The success rate rises with the longitudinal field, and the added cost grows with its square, so there is a front rather than a free lunch.

## Kill criterion

A longitudinal field that changes the zero-temperature trajectory would mean it is not longitudinal in the implementation.

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

Longitudinal field (B_r / (K/mu)): 0, 0.5, 1, 1.5, 2, 2.5.

## Design

| Field | Value |
|---|---|
| Methods | R11, R12 |
| Ground truth | published |
| Split | control |
| Seed | 0 |
| Surface | experiments |

## Sources

- https://doi.org/10.48550/arXiv.2312.11293

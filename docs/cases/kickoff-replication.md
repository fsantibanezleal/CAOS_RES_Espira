# The kickoff paper's own peak switching fields

Case `kickoff-replication` (C10), category B. Published replication. Baked: committed artifacts, replayed by the web app.

Generated from the registry by `scripts/gen_case_docs.py`.

## Why it is in the matrix

The paper that started this product reports, for monolayer CrSBr, the peak amplitude of the optimal pulse at named switching times, beside the static antiparallel field a conventional protocol needs at the same time. The peak field of a coherent rotation does not depend on how many spins rotate together, so those numbers are directly comparable with this product's macrospin and are the most direct external check available. The published energies are not replicated: they are extensive, quoted for a 50 x 50 nm^2 element, and their cost functional carries a prefactor c that the source says is proportional to the unit-cell volume and then sets to one, with a device resistance of 1 ohm, so the constant that turns a cost in T^2 s into the joules it prints cannot be reconstructed from the text. The fields carry no such factor.

## What a domain expert should see

Measured 2026-09-22 from the full text, at the damping the database assumes for CrSBr (0.01): 4.47 T against a published 4.6 T at 4 ps, 150.4 mT against 150 mT at 126 ps, and 136.2 mT against 135 mT at 140 ps, so three of the four quoted points reproduce within 3 per cent. The fourth, 9.6 mT at 2 ns, needs a damping near 0.001 to reproduce (we give 19.7 mT at 0.01 and 9.8 mT at 0.001); the paper states a damping range of 0.001 to 0.05 for this family, so the gap is a parameter difference rather than a disagreement about the physics. The source also quotes two different peak fields for the same 126 ps point, 0.11 T in one section and 150 mT in another; this computation lands on 150 mT.

## Kill criterion

A peak field that misses the published value by more than the damping uncertainty band would mean our parameter set or the closed form is wrong. Quoting a joule figure against their energies without their circuit model would be the quieter failure, and the case refuses it.

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

Switching time (ps): 1, 4, 10, 126, 140, 2000.

## Design

| Field | Value |
|---|---|
| Methods | R05 |
| Ground truth | published |
| Split | control |
| Seed | 0 |
| Surface | workbench |

## Sources

- https://doi.org/10.1002/adma.202523059

# CrSBr, field-driven reversal

Case `crsbr-field`, category `real-material-field`. Generated from the registry by `scripts/gen_case_docs.py`.

## Why it is in the matrix

The kickoff material and, because of its triaxial anisotropy, the natural host of the biaxial cost-reduction mechanism.

## What a domain expert should see

The optimal pulse cost falls with switching time toward the universal floor; the hard axis pushes the numerical cost below the free-macrospin floor.

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

Switching times, in units of the Larmor timescale tau0: 2, 5, 10, 20, 50, 100.

## What the bake computes

For every variant: the analytic optimal pulse, its trajectory on the sphere, and its cost against the
free-macrospin cost and the universal floor (with the band from the damping range). A static-field
baseline at the longest switching time. Numerical biaxial solve: Yes: the numerical image-based optimal control path with the hard axis, which has no closed form.

Artifact: `data/artifacts/crsbr-field.json`.

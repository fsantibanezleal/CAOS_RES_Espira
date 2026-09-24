# Thermal success rate against the stability factor

Case `thermal-success-rate` (C07), category B. Published replication. Baked: committed artifacts, replayed by the web app.

Generated from the registry by `scripts/gen_case_docs.py`.

## Why it is in the matrix

An optimal pulse is derived at zero temperature; at finite temperature it sometimes fails. The success rate against the thermal stability factor is the honest reliability statement. The factor is per site: a single CrSBr site carries an anisotropy of 1.7 K in temperature units, so the window where the pulse starts to fail is sub-Kelvin. Device-grade retention comes from the exchange-coupled volume, not from one site, and this case measures the single site.

## What a domain expert should see

The success rate falls as the thermal stability factor falls, and the pulse that is optimal at zero temperature is NOT the most reliable one: the same pulse with a longitudinal field at twice the anisotropy field succeeds more often, at an added cost the case reports. Measured 2026-09-22 on the corrected engine with 600 copies per point: 0.735 against 0.985 at a stability factor of one, 0.810 against 1.000 at two, and 0.983 against 1.000 at ten. (Until spinoct 0.18.000 the field was applied with the wrong sign and this text quoted 0.952 at two, a field that destabilized the path.) The declared window (10 to 80) was corrected to (1 to 20) from measurement, because above ten the zero-temperature pulse already succeeds essentially always and the case would have shown a flat line.

## Kill criterion

A success rate that does not depend on temperature would mean the thermostat is not actually perturbing the trajectory. A longitudinal field that buys reliability at NO added cost would mean the added cost is not being charged.

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

Thermal stability factor (K/kT): 1, 2, 3, 5, 10, 20.

## Design

| Field | Value |
|---|---|
| Methods | R11, R12 |
| Ground truth | published |
| Split | control |
| Seed | 0 |
| Surface | workbench |

## Sources

- https://doi.org/10.1103/PhysRevB.107.214448

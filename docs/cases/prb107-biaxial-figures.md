# The biaxial paper's thermal-robustness table (Phys. Rev. B 107, 214448, Table I)

Case `prb107-biaxial-figures` (C05), category B. Published replication. Baked: committed artifacts, replayed by the web app.

Generated from the registry by `scripts/gen_case_docs.py`.

## Why it is in the matrix

The lineage paper's own optimal control path for a biaxial particle, checked where it publishes numbers rather than curves. Its Table I reports the measured switching success rate of that protocol under thermal fluctuations at four barrier-to-temperature ratios and two dampings, and Appendix B gives the settings behind it: a switching time of two Larmor times, a hard-axis ratio of five, and three stages, equilibration at zero field to reach a Boltzmann distribution, the pulse with the noise on, and a final equilibration. Eight published numbers with a stated protocol are a better comparison than a digitized curve, and they need no digitizing.

## What a domain expert should see

Measured 2026-09-22 over 1,000 copies per cell: at a barrier of thirty thermal energies, 94.9 per cent against a published 95.3 at damping 0.01 and 96.7 against 96.8 at 0.1, both inside the Monte-Carlo interval of about 1.3 points. The same protocol at a shorter equilibration reports a spurious 100 per cent at the lower damping, which is this case's own trap rather than the paper's: reaching a Boltzmann distribution takes a dissipation time, and that time is ten times longer at a tenth of the damping.

## Kill criterion

A success rate outside the Monte-Carlo interval of the published value, at a cell where both are far from unity, would mean our optimal path or our thermostat differs from theirs. An ensemble that never fails where the paper reports failures is the quieter version of the same problem, and the case reports the equilibrium spread it starts from so it cannot hide.

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

Barrier over thermal energy (K/kT): 20, 30, 40, 50, 60, 70, 80.

## Design

| Field | Value |
|---|---|
| Methods | R11 |
| Ground truth | published |
| Split | control |
| Seed | 0 |
| Surface | workbench |

## Sources

- https://doi.org/10.1103/PhysRevB.107.214448

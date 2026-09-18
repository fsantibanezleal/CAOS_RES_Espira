# CrBr3 against CrCl3, a bit and a non-bit

Case `crcl3-crbr3-contrast` (C17), category C. Real materials. Baked: committed artifacts, replayed by the web app.

Generated from the registry by `scripts/gen_case_docs.py`.

## Why it is in the matrix

Two members of one chemical family with opposite anisotropy character. CrBr3 has a weak easy axis (a single-ion term fitted to inelastic neutron scattering, Cai 2021) and is a switchable bit. CrCl3 has an easy PLANE that is the dipolar shape anisotropy barely overcoming the weak spin-orbit coupling of the light ligand, with no measurable preference inside the plane and antiferromagnetic stacking in bulk (Schneeloch 2022): it has no bistable single-domain state at all.

## What a domain expert should see

CrBr3 switches like the rest of the easy-axis family, with the lowest anisotropy of the materials here (0.045 meV per site), so the lowest floor and the longest natural timescale. CrCl3 is refused: with no barrier there is no bit to write, and the product must not produce a switching cost for it. It enters no parameter table, and this case says why.

## Kill criterion

Producing a switching cost for an easy-plane material through the easy-axis solution would be exactly the error the negative control exists to catch. For CrBr3, quoting its anisotropy as resolved when it is a fit below the instrument resolution would overstate it.

## Material: CrBr3

| Parameter | Value | Provenance | Source |
|---|---|---|---|
| Family | semiconductor | | |
| Spin | 1.5 | | |
| Easy axis | out-of-plane c axis (weak) | | |
| Moment per site | 3 Bohr magnetons | derived | [10.1103/PhysRevB.104.L020402](https://doi.org/10.1103/PhysRevB.104.L020402) |
| Anisotropy per site (unit-vector convention) | 0.045 meV | measured | [10.1103/PhysRevB.104.L020402](https://doi.org/10.1103/PhysRevB.104.L020402) |
| Hard-axis ratio | 0 | assumed | none |
| Gilbert damping | 0.01 (range 0.005 to 0.02) | assumed | none |
| Ordering temperature | 32 K | measured | [10.1103/PhysRevB.104.L020402](https://doi.org/10.1103/PhysRevB.104.L020402) |

The easy-axis member of the chromium trihalides. Exchange and a weak single-ion anisotropy from an inelastic neutron scattering fit on bulk single crystals (Cai 2021, S = 3/2, D_z = -0.02 meV on spin operators); the anisotropy lies below the instrument resolution and is a fit, not a resolved gap, so it is flagged. Its easy-plane sibling CrCl3 has no bistable single-domain state (its easy plane is dipolar shape anisotropy, Schneeloch 2022) and is deliberately not in this table. Damping assumed and flagged.

Every value enters through Contract 1 (`data/materials/parameters.csv`); the conversion from the published
unit and each value's note are in that table. Assumed values are not measurements.

## Variants

Switching time (tau0): 2, 5, 10, 20, 50, 100.

## Design

| Field | Value |
|---|---|
| Methods | R00, R05 |
| Ground truth | provisional |
| Split | test |
| Seed | 0 |
| Surface | workbench |

## Sources

- https://doi.org/10.1103/PhysRevB.104.L020402
- https://doi.org/10.1038/s41535-022-00473-3

# CrSBr, field-driven reversal

Case `crsbr-field`, category `real-material-field`. Generated from the registry by `scripts/gen_case_docs.py`.

## Why it is in the matrix

The kickoff material and, because of its triaxial anisotropy, the natural host of the biaxial cost-reduction mechanism.

## What a domain expert should see

The optimal pulse cost falls with switching time toward the universal floor; the hard axis pushes the numerical cost below the free-macrospin floor.

## Material: CrSBr

| Parameter | Value |
|---|---|
| Family | semiconductor |
| Spin | 1.5 |
| Moment per site | 3 Bohr magnetons |
| Anisotropy per site | 0.15 meV |
| Hard-axis ratio | 3 |
| Gilbert damping | 0.01 (range 0.004 to 0.02) |
| Ordering temperature | 146 K |
| Easy axis | in-plane b axis (triaxial: b easy, z hard) |

Monolayer, A-type antiferromagnetic stacking, ferromagnetic within a layer. The exchange Hamiltonian is measured by inelastic neutron scattering (Scheie 2022, eighth-neighbour set, convention +sum J S.S, S=3/2). Anisotropy is below the neutron resolution and is triaxial and dielectric-tunable (Rudenko 2023): the substrate is a knob on the hard-axis ratio. The macrospin anisotropy here is an effective easy-axis scale, not a micromagnetic constant.

Sources:

- https://doi.org/10.1002/advs.202202467
- https://doi.org/10.48550/arXiv.2302.12672
- https://doi.org/10.1002/adma.202523059

## Variants

Switching times, in units of the Larmor timescale tau0: 2, 5, 10, 20, 50, 100.

## What the bake computes

For every variant: the analytic optimal pulse, its trajectory on the sphere, and its cost against the
free-macrospin cost and the universal floor (with the band from the damping range). A static-field
baseline at the longest switching time. Numerical biaxial solve: Yes: the numerical image-based optimal control path with the hard axis, which has no closed form.

Artifact: `data/artifacts/crsbr-field.json`.

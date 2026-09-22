# Fe5GeTe2, the near-room-temperature metal

Case `fe5gete2-field` (C16), category C. Real materials. Planned: declared and runnable, not yet computed.

Generated from the registry by `scripts/gen_case_docs.py`.

## Why it is in the matrix

A metallic member whose ordering temperature is near room temperature (310 K in bulk single crystals), which would move the family into the regime a device operates in.

## What a domain expert should see

Not computable yet, because the material's anisotropy is not one number. Bulk ferromagnetic resonance at 290 K finds an easy PLANE with no uniaxial anisotropy inside it (Bera 2024), which leaves no bistable state to switch between; bulk magnetometry and flake measurements report a weak perpendicular anisotropy, and flakes thinner than six layers cant in-plane (ACS Nano 2022, layer-dependent domains). The declared premise, a weaker perpendicular anisotropy than Fe3GeTe2, holds only in some of those regimes. The case bakes once a primary source gives a quantitative perpendicular anisotropy, a moment and a damping measured in the same regime. Searched again 2026-09-22 and the block stands: the room-temperature resonance study does give a moment (saturation magnetization 0.36 T, effective 4 pi M of 3,340 Oe), an intrinsic damping of 0.0476 once the eddy-current contribution is removed, and an ordering temperature of 310 K, all on one bulk crystal, but its anisotropy IS the easy plane: the hard axis lies along c and no uniaxial anisotropy is reported inside the plane, so there is still no bistable state to switch. Flake work reports a perpendicular easy axis below about 200 K and through imaging, without a quantitative anisotropy constant beside a damping on one sample.

## Kill criterion

Parameters that cannot be traced to a primary source must not enter; a case without provenance is not a case. Mixing an anisotropy from one temperature or thickness with a damping from another would be the same failure in a quieter form.

## System

Declared without a system: the case is not computed yet, and its system is chosen when it is.

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

- https://doi.org/10.1103/PhysRevB.110.224401
- https://doi.org/10.1021/acsnano.2c01948
- https://doi.org/10.1088/2053-1583/ac2028

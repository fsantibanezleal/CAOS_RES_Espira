# The data contracts

Two contracts govern how data moves through Espira: Contract 1 from the published literature into the
engine, Contract 2 from the bake into the web app.

## Contract 1, material parameters into the engine

**Where.** The tables `data/materials/materials.csv` (one row per material) and
`data/materials/parameters.csv` (one row per value); the module `data-pipeline/espiralab/io/contract.py`;
the stages `stages/ingest.py` and `stages/preprocess.py`. `espiralab.materials` loads nothing else.

**Why a contract.** The spin-Hamiltonian literature writes the same physics in incompatible forms: exchange
with either sign and with or without the one-half double-counting factor; anisotropy on spin operators or on
unit vectors, per ion, per formula unit, per volume, or as a field. A number moved between two forms without
conversion is silently wrong by a factor such as S squared. The contract makes the published form explicit
and does the conversion in code.

### A row

| Column | Meaning |
|---|---|
| `material`, `parameter` | which value (`moment`, `anisotropy`, `hard_axis_ratio`, `damping`, `ordering_temperature`) |
| `value`, `unit`, `basis` | the number as published and what it refers to |
| `spin_length` | for anisotropy on spin operators |
| `ions_per_cell`, `cell_volume_nm3` | for a volume anisotropy converted through the unit cell |
| `ms_emu_per_cm3`, `moment_for_density_bohr` | for a volume anisotropy converted through the saturation magnetization |
| `low`, `high` | an optional band (used for damping) |
| `provenance` | `measured`, `computed` (first principles), `derived` (a stated relation applied to sourced inputs), or `assumed` |
| `method`, `source_doi`, `note` | how it was obtained, one or more DOIs, and the caveat |

### Canonical form and conversions

The engine's macrospin Hamiltonian is `E = -K s_z^2` on unit vectors, with K in meV per magnetic ion.

| Published as | Conversion | Example |
|---|---|---|
| meV, unit-vector | none | Fe3GaTe2, 0.31 meV per Fe (DFT) |
| meV, spin-operator, term `-D (S^z)^2` | `K = D S^2` | CrI3, D_z = 0.22 meV with S = 3/2 gives 0.495 meV |
| erg/cm3, volume, through the unit cell | `K = 0.1 K_u / (ions / (V 1e-27))`, in J, then meV | Cr2Ge2Te6, 3.95e5 erg/cm3 over six Cr in 0.8301 nm3 gives 0.0341 meV |
| erg/cm3, volume, through the magnetization | ion density `n = 1000 M_s / (m mu_B)` | Fe3GeTe2, 1.46e7 erg/cm3 with 376 emu/cm3 at 1.58 mu_B gives 0.355 meV |

The constants (Bohr magneton, the meV) come from `spinoct.units`, the same CODATA values the solvers use.

### Rejected, with the reason recorded

Unknown material or parameter; a missing, non-numeric or non-finite value; a unit or basis not accepted
for the parameter; missing conversion inputs; an unknown provenance class; a measured, computed or derived
value without a well-formed DOI; an assumed value without a written justification; a canonical value
outside its physical range (a moment above 10 mu_B, an anisotropy above 50 meV, a damping of one or more, an
ordering temperature above 1500 K, or any non-positive value where zero is unphysical); a band that does not
contain its value; a duplicate row; a material missing any required parameter. The canonical bake is
strict: one rejection stops it.

### Accepted with a flag

Every assumed value; a damping band wider than a factor of four; a value converted from another unit or
basis. Flags travel into the artifacts. The web app's parameter panel shows each value's class, its
published form, method, note and DOI links, and counts the assumed values.

### What the audit found

Building the contract required a source for every value, and the check against primary sources
(programme dossier 07, 2026-09-14) corrected earlier values: FePS3's anisotropy (2.0 meV became 10.64 meV,
a wrong value and a missing S squared), CrI3's (0.7 meV, cited to a paper that does not report it, became
0.495 meV), Cr2Ge2Te6's anisotropy, moment and Curie temperature, and Fe3GeTe2's moment (1.82 mu_B belonged
to Fe3GaTe2). Damping is assumed for four of the six materials. Because the universal floor is linear in
the damping, their floors are scales, not measurements, and the web and docs say so.

## Contract 2, the bake into the web

The artifacts in `data/artifacts/` carry a schema version; `frontend/src/data/contract.ts` mirrors their
shapes, so a drift fails the type-check. `scripts/check_artifacts.py` checks the index against the case
files, the per-variant completeness of each case, and the bound invariants of the free chain map, and the
test suite checks that each artifact is current with the parameter tables. Per-case manifests with hashes,
seeds, the engine version and the measured lane verdict arrive with the staged pipeline (unit U4).

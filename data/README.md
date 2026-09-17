# data/, what Espira computes from and what it ships

## Layout

| Path | What | Git |
|---|---|---|
| `artifacts/` | The canonical, committed results the web app replays: `index.json`, one `<case>.json` per case, `novel.json` (the reliability front and the two-mode lattice comparison), `lattice_ocp.json` (the free chain crossover map) | committed |
| `raw/` | Private or large inputs, never committed | git-ignored |
| `materials/materials.csv` | One row per material: name, family, spin, easy axis, notes | committed |
| `materials/parameters.csv` | One row per parameter value: published unit and basis, conversion inputs, provenance class, method, DOI(s), note. The only path into the engine | committed |
| `.checkpoints/` | Resumable bake checkpoints; point `ESPIRA_CHECKPOINT_DIR` at `E:\_Temp` for heavy runs | git-ignored |

## Where the real data is

There is no public experimental dataset of shaped-pulse switching in these materials. The real data
Espira depends on is the set of **spin-Hamiltonian parameters** of each van der Waals magnet: magnetic
moment, anisotropy (easy axis and, for CrSBr, the hard-axis ratio), Gilbert damping with its range, and
the ordering temperature. Each value is a row of `materials/parameters.csv` with the unit and basis it was
published in, its provenance class (measured, computed, derived, or assumed) and its DOI, audited against
the primary sources on 2026-09-14 (programme dossier 07). Damping is assumed for four of the six materials,
so their universal floors are scales rather than measurements.

Units matter more than usual in this literature: exchange and anisotropy appear per atom, per formula
unit, per volume, with and without the one-half double-counting factor, and over unit vectors or spin
vectors. Every parameter carries its convention, and the engine's unit-constant gate
(`spinoct`, `scripts/check_unit_constants.py`) asserts the unit of every literal.

## The two contracts, and their state

- **Contract 1, ingestion.** `data-pipeline/espiralab/io/contract.py`, run by the `ingest` stage: units,
  bases and explicit conversions, physical ranges, provenance classes, DOIs, bands; bad rows are rejected
  with a reason, assumed values and wide damping bands are flagged, and the canonical bake refuses any
  rejection. Full description: [../docs/architecture/02_data-contracts.md](../docs/architecture/02_data-contracts.md).
- **Contract 2, artifacts.** The JSON shapes of `artifacts/` are mirrored by the TypeScript types in
  `frontend/src/data/contract.ts`, so a drift fails the web build. Per-case manifests with hashes,
  seeds, engine version and the measured lane verdict arrive with the staged pipeline (U4).

## Provenance and license

The artifacts are derived from published parameters by the MIT-licensed `spinoct` engine and are
released with the product under MIT. The switching cost in every artifact is in tesla-squared-seconds,
not joules.

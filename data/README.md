# data/, what Espira computes from and what it ships

## Layout

| Path | What | Git |
|---|---|---|
| `artifacts/` | The canonical, committed results the web app replays: `index.json`, one `<case>.json` per case, `novel.json` (the reliability front and the two-mode lattice comparison), `lattice_ocp.json` (the free chain crossover map) | committed |
| `raw/` | Private or large inputs, never committed | git-ignored |
| `examples/` | Reserved for the material parameter sample that passes the ingestion contract (U2 of the rebuild) | committed, currently empty |
| `.checkpoints/` | Resumable bake checkpoints; point `ESPIRA_CHECKPOINT_DIR` at `E:\_Temp` for heavy runs | git-ignored |

## Where the real data is

There is no public experimental dataset of shaped-pulse switching in these materials. The real data
Espira depends on is the set of **spin-Hamiltonian parameters** of each van der Waals magnet: magnetic
moment, anisotropy (easy axis and, for CrSBr, the hard-axis ratio), Gilbert damping with its range, and
the ordering temperature. Each value is transcribed from a primary source with a DOI and lives today in
`data-pipeline/espiralab/materials/__init__.py`, with its sign convention and the disputes named where
sources disagree (research dossier 03 in the CAOS programme).

Units matter more than usual in this literature: exchange and anisotropy appear per atom, per formula
unit, per volume, with and without the one-half double-counting factor, and over unit vectors or spin
vectors. Every parameter carries its convention, and the engine's unit-constant gate
(`spinoct`, `scripts/check_unit_constants.py`) asserts the unit of every literal.

## The two contracts, and their state

- **Contract 1, ingestion.** A schema with units, ranges, sign convention, DOI and uncertainty per
  parameter row, rejecting bad rows with a reason and flagging suspicious ones. **Not yet implemented as
  a module**: the parameters are curated in code today. It is unit U2 of the rebuild
  (CAOS programme backlog BL-011).
- **Contract 2, artifacts.** The JSON shapes of `artifacts/` are mirrored by the TypeScript types in
  `frontend/src/data/contract.ts`, so a drift fails the web build. Per-case manifests with hashes,
  seeds, engine version and the measured lane verdict arrive with the staged pipeline (U4).

## Provenance and license

The artifacts are derived from published parameters by the MIT-licensed `spinoct` engine and are
released with the product under MIT. The switching cost in every artifact is in tesla-squared-seconds,
not joules.

"""Generate docs/cases/<case>.md from the case registry and the Contract 1 material records.

The per-case pages restate registry and parameter values; hand-copying them drifts. Run this after any
registry or parameter change; tests/test_docs.py fails when the committed pages differ from a fresh
generation.

Usage: python scripts/gen_case_docs.py [--check]
"""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "data-pipeline"))

from espiralab.cases import CASES  # noqa: E402
from espiralab.materials import get_material  # noqa: E402

OUT = ROOT / "docs" / "cases"

LABELS = {
    "moment": ("Moment per site", lambda m: f"{m.moment_bohr:.3g} Bohr magnetons"),
    "anisotropy": ("Anisotropy per site (unit-vector convention)", lambda m: f"{m.anisotropy_mev:.4g} meV"),
    "hard_axis_ratio": ("Hard-axis ratio", lambda m: f"{m.hard_axis_ratio:g}"),
    "damping": ("Gilbert damping", lambda m: f"{m.damping:g} (range {m.damping_low:g} to {m.damping_high:g})"),
    "ordering_temperature": ("Ordering temperature", lambda m: f"{m.curie_kelvin:g} K"),
}


def parameter_rows(m) -> str:
    rows = [
        f"| Family | {m.family} | | |",
        f"| Spin | {m.spin:g} | | |",
        f"| Easy axis | {m.easy_axis} | | |",
    ]
    for name, (label, fmt) in LABELS.items():
        record = m.provenance[name]
        sources = ", ".join(f"[{doi}](https://doi.org/{doi})" for doi in record["sources"]) or "none"
        rows.append(f"| {label} | {fmt(m)} | {record['provenance']} | {sources} |")
    return "\n".join(rows)


def page(slug: str) -> str:
    case = CASES[slug]
    m = get_material(case.material)
    variants = ", ".join(f"{t:g}" for t in case.switching_times_tau0)
    biaxial = (
        "Yes: the numerical image-based optimal control path with the hard axis, which has no closed form."
        if case.includes_biaxial
        else "No: the material is treated as uniaxial, where the analytic optimum is exact."
    )
    return f"""# {case.title}

Case `{slug}`, category `{case.category}`. Generated from the registry by `scripts/gen_case_docs.py`.

## Why it is in the matrix

{case.reason}

## What a domain expert should see

{case.expectation}

## Material: {m.name}

| Parameter | Value | Provenance | Source |
|---|---|---|---|
{parameter_rows(m)}

{m.notes}

Every value enters through Contract 1 (`data/materials/parameters.csv`); the conversion from the published
unit and each value's note are in that table. Assumed values are not measurements.

## Variants

Switching times, in units of the Larmor timescale tau0: {variants}.

## What the bake computes

For every variant: the analytic optimal pulse, its trajectory on the sphere, and its cost against the
free-macrospin cost and the universal floor (with the band from the damping range). A static-field
baseline at the longest switching time. Numerical biaxial solve: {biaxial}

Artifact: `data/artifacts/{slug}.json`.
"""


def main() -> int:
    check = "--check" in sys.argv
    stale = []
    for slug in CASES:
        path = OUT / f"{slug}.md"
        text = page(slug)
        if check:
            if not path.exists() or path.read_text(encoding="utf-8") != text:
                stale.append(path.name)
        else:
            path.write_text(text, encoding="utf-8", newline="\n")
    if check and stale:
        print(f"stale case pages: {stale}; run python scripts/gen_case_docs.py")
        return 1
    print("case pages up to date" if check else f"wrote {len(CASES)} case pages")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

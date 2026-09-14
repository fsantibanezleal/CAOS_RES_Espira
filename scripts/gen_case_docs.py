"""Generate docs/cases/<case>.md from the case registry and the material database.

The per-case pages restate registry and parameter values; hand-copying them drifts. Run this after any
registry or material change; tests/test_docs.py fails when the committed pages differ from a fresh
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


def page(slug: str) -> str:
    case = CASES[slug]
    m = get_material(case.material)
    sources = "\n".join(f"- https://doi.org/{doi}" for doi in m.sources)
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

| Parameter | Value |
|---|---|
| Family | {m.family} |
| Spin | {m.spin:g} |
| Moment per site | {m.moment_bohr:g} Bohr magnetons |
| Anisotropy per site | {m.anisotropy_mev:g} meV |
| Hard-axis ratio | {m.hard_axis_ratio:g} |
| Gilbert damping | {m.damping:g} (range {m.damping_low:g} to {m.damping_high:g}) |
| Ordering temperature | {m.curie_kelvin:g} K |
| Easy axis | {m.easy_axis} |

{m.notes}

Sources:

{sources}

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

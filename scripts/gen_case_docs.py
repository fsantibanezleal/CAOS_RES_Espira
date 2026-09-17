"""Generate the case wiki from the registry: one page per case, plus the coverage matrix.

The pages restate registry, parameter and status values; hand-copying them drifts, and a case that was
quietly dropped would keep its page. Run this after any registry, material or status change;
tests/test_docs.py fails when the committed pages differ from a fresh generation.

Usage: python scripts/gen_case_docs.py [--check]
"""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "data-pipeline"))

from espiralab.cases import CASES, CATEGORIES, coverage_counts  # noqa: E402
from espiralab.materials import get_material  # noqa: E402

OUT = ROOT / "docs" / "cases"

LABELS = {
    "moment": ("Moment per site", lambda m: f"{m.moment_bohr:.3g} Bohr magnetons"),
    "anisotropy": ("Anisotropy per site (unit-vector convention)", lambda m: f"{m.anisotropy_mev:.4g} meV"),
    "hard_axis_ratio": ("Hard-axis ratio", lambda m: f"{m.hard_axis_ratio:g}"),
    "damping": ("Gilbert damping", lambda m: f"{m.damping:g} (range {m.damping_low:g} to {m.damping_high:g})"),
    "ordering_temperature": ("Ordering temperature", lambda m: f"{m.curie_kelvin:g} K"),
}
STATUS_TEXT = {
    "baked": "Baked: committed artifacts, replayed by the web app.",
    "planned": "Planned: declared and runnable, not yet computed.",
    "blocked": "Blocked: something outside this repository is missing.",
}


def system_section(case) -> str:
    if case.material is not None:
        m = get_material(case.material)
        rows = [
            f"| Family | {m.family} | | |",
            f"| Spin | {m.spin:g} | | |",
            f"| Easy axis | {m.easy_axis} | | |",
        ]
        for name, (label, fmt) in LABELS.items():
            record = m.provenance[name]
            sources = ", ".join(f"[{doi}](https://doi.org/{doi})" for doi in record["sources"]) or "none"
            rows.append(f"| {label} | {fmt(m)} | {record['provenance']} | {sources} |")
        table = "\n".join(rows)
        return f"""## Material: {m.name}

| Parameter | Value | Provenance | Source |
|---|---|---|---|
{table}

{m.notes}

Every value enters through Contract 1 (`data/materials/parameters.csv`); the conversion from the published
unit and each value's note are in that table. Assumed values are not measurements."""
    if case.synthetic is not None:
        s = case.synthetic
        return f"""## System: a synthetic reference macrospin

This case tests mathematics, not a material, so it pins no parameter row. The reference system is a
moment of {s.moment_bohr:g} Bohr magnetons with an easy-axis anisotropy of {s.anisotropy_mev:g} meV per
site, a Gilbert damping of {s.damping:g} and a hard-axis ratio of {s.hard_axis_ratio:g}: the scale of the
van der Waals family, so the oracle is comparable with the real cases. These values are definitional."""
    return """## System

Declared without a system: the case is not computed yet, and its system is chosen when it is."""


def page(slug: str) -> str:
    case = CASES[slug]
    variants = ", ".join(f"{v:g}" for v in case.axis.values)
    blocked = f"\n\n**What is missing.** {case.blocked_reason}" if case.blocked_reason else ""
    sources = (
        "\n".join(f"- https://doi.org/{doi}" for doi in case.sources)
        if case.sources
        else "No external reference: the case is checked against the engine's own oracles."
    )
    return f"""# {case.title}

Case `{slug}` ({case.code}), category {case.category}. {STATUS_TEXT[case.status]}{blocked}

Generated from the registry by `scripts/gen_case_docs.py`.

## Why it is in the matrix

{case.reason}

## What a domain expert should see

{case.expectation}

## Kill criterion

{case.kill_criterion}

{system_section(case)}

## Variants

{case.axis.label} ({case.axis.unit}): {variants}.

## Design

| Field | Value |
|---|---|
| Methods | {", ".join(case.methods)} |
| Ground truth | {case.ground_truth} |
| Split | {case.split} |
| Seed | {case.seed} |
| Surface | {case.surface} |

## Sources

{sources}
"""


def coverage() -> str:
    counts = coverage_counts()
    lines = [
        "# Cases",
        "",
        "A case is a scientific question the product answers: a system, a variant family, and a",
        "pre-declared expectation with the kill criterion that would make it a failure. The 26 cases of the",
        "validated plan are all declared here, so a missing one cannot hide behind the ones that are baked.",
        "",
        f"**{counts['baked']} baked, {counts['planned']} planned, {counts['blocked']} blocked.** Baked cases",
        "have committed artifacts; planned cases are declared and runnable but not yet computed; blocked",
        "cases name what is missing. This page and the per-case pages are generated from the registry",
        "(`python scripts/gen_case_docs.py`).",
        "",
    ]
    for category, purpose in CATEGORIES.items():
        lines += [f"## {category}", "", purpose, "", "| Case | Status | Variants | Methods | Ground truth |", "|---|---|---|---|---|"]
        for case in CASES.values():
            if case.category != category:
                continue
            status = case.status if not case.blocked_reason else f"blocked ({case.blocked_reason.split(';')[0][:60]}...)"
            lines.append(
                f"| {case.code} [{case.title}]({case.slug}.md) | {status} | {len(case.axis.values)} x {case.axis.label.lower()} "
                f"| {', '.join(case.methods)} | {case.ground_truth} |"
            )
        lines.append("")
    lines += [
        "## Surfaces",
        "",
        "Baked cases marked `workbench` are selectable in the App; those marked `experiments` are cross-case",
        "results shown on the Experiments page (the reliability front and the free chain crossover map).",
        "Cross-case results never appear in the single-case workbench.",
        "",
    ]
    return "\n".join(lines)


def main() -> int:
    check = "--check" in sys.argv
    wanted = {f"{slug}.md": page(slug) for slug in CASES} | {"README.md": coverage()}
    stale = []
    for name, text in wanted.items():
        path = OUT / name
        if check:
            if not path.exists() or path.read_text(encoding="utf-8") != text:
                stale.append(name)
        else:
            path.write_text(text, encoding="utf-8", newline="\n")
    if not check:
        for path in OUT.glob("*.md"):
            if path.name not in wanted:
                path.unlink()
                print(f"removed {path.name} (no longer in the registry)")
    if check and stale:
        print(f"stale case pages: {stale}; run python scripts/gen_case_docs.py")
        return 1
    print("case pages up to date" if check else f"wrote {len(wanted)} pages")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

"""The wiki stays true to its sources: generated case pages are current, every baked case has a page and
a row in the coverage matrix, and relative links resolve."""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

from espiralab.cases import CASES

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"


def test_generated_case_pages_are_current() -> None:
    result = subprocess.run(
        [sys.executable, str(ROOT / "scripts" / "gen_case_docs.py"), "--check"],
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, result.stdout + result.stderr


def test_every_case_is_in_the_coverage_matrix() -> None:
    """All 26 declared cases appear with their status, so a planned or blocked one cannot hide."""
    matrix = (DOCS / "cases" / "README.md").read_text(encoding="utf-8")
    for slug, case in CASES.items():
        assert f"]({slug}.md)" in matrix, slug
        assert case.code in matrix
    assert (DOCS / "cases" / f"{slug}.md").exists()


def test_a_blocked_case_states_what_is_missing_on_its_page() -> None:
    for slug, case in CASES.items():
        if case.status == "blocked":
            page = (DOCS / "cases" / f"{slug}.md").read_text(encoding="utf-8")
            assert "What is missing" in page and case.blocked_reason[:40] in page


def test_relative_links_resolve() -> None:
    link = re.compile(r"\]\((?!https?://|#)([^)#\s]+)")
    broken = []
    for page in DOCS.rglob("*.md"):
        for target in link.findall(page.read_text(encoding="utf-8")):
            if not (page.parent / target).resolve().exists():
                broken.append(f"{page.relative_to(ROOT)} -> {target}")
    assert not broken, broken


def test_every_results_page_names_its_artifact_and_is_indexed() -> None:
    """The results wiki is only useful while each page still points at the artifact it describes, and
    while the section index lists every page. A result whose artifact was renamed, or a page nobody
    links to, is how a wiki starts drifting from the product."""
    results = ROOT / "docs" / "results"
    pages = sorted(p for p in results.glob("*.md") if p.name != "README.md")
    assert len(pages) >= 8, "one page per cross-case result"
    index = (results / "README.md").read_text(encoding="utf-8")
    artifacts = {p.name for p in (ROOT / "data" / "artifacts").glob("*.json")}
    for page in pages:
        assert page.name in index, f"{page.name} is not in the results index"
        text = page.read_text(encoding="utf-8")
        named = {a for a in artifacts if a in text}
        assert named, f"{page.name} names no artifact"
    assert "results/README.md" in (ROOT / "docs" / "README.md").read_text(encoding="utf-8")


def test_every_method_a_case_declares_is_documented() -> None:
    """The rung codes (R00, R05, R07) are in the coverage matrix, the provenance strip, the case pages
    and the committed JSON, so a reader meets them everywhere. The method ladder is where they are
    explained, and a rung a case runs but the ladder never names is a code with no meaning attached."""
    page = (DOCS / "methods" / "README.md").read_text(encoding="utf-8")
    declared = {method for case in CASES.values() for method in case.methods}
    assert declared, "the registry declares no methods"
    for method in sorted(declared):
        assert re.search(rf"\b{method}\b", page), f"{method} runs in a case but the ladder does not name it"
    # The reverse direction, so the ladder cannot keep describing a rung that was removed: every rung
    # the page gives a section to is either declared by a case or listed as not being a per-case rung.
    sections = set(re.findall(r"^## (R\d\d),", page, flags=re.MULTILINE))
    assert sections <= declared, f"the ladder documents rungs no case runs: {sorted(sections - declared)}"
    assert "methods/README.md" in (DOCS / "README.md").read_text(encoding="utf-8")


def test_the_documented_engine_pin_matches_the_pipeline() -> None:
    """The engine guide tells a reader which spinoct to install. It said 0.16.0 for three engine
    releases while the pipeline pinned something newer, so anyone following it installed an engine the
    committed artifacts were never baked with. The two now have to agree."""
    requirements = (ROOT / "data-pipeline" / "requirements.txt").read_text(encoding="utf-8")
    pinned = re.search(r"^spinoct==([0-9.]+)$", requirements, flags=re.MULTILINE)
    assert pinned, "the pipeline does not pin spinoct"
    guide = (DOCS / "frameworks" / "spinoct" / "README.md").read_text(encoding="utf-8")
    documented = re.findall(r"pip install spinoct==([0-9.]+)", guide)
    assert documented, "the engine guide documents no install pin"
    assert set(documented) == {pinned.group(1)}, (
        f"the guide says {sorted(set(documented))}, the pipeline pins {pinned.group(1)}"
    )


def test_the_overview_states_the_coverage_the_index_has() -> None:
    """The architecture overview states the case counts in prose so it reads on its own. It said
    "10 baked, 14 planned and 2 blocked" for five releases after the index had moved on, which is the
    failure a stated number invites. It now has to match the committed index."""
    import json

    coverage = json.loads((ROOT / "data" / "artifacts" / "index.json").read_text(encoding="utf-8"))["coverage"]
    overview = (DOCS / "architecture" / "01_overview.md").read_text(encoding="utf-8")
    baked = re.search(r"(\d+) are\s+baked", overview)
    assert baked, "the overview no longer states how many cases are baked"
    assert int(baked.group(1)) == coverage["baked"], (
        f"the overview says {baked.group(1)} baked, the index says {coverage['baked']}"
    )
    if coverage["blocked"] == 0:
        assert "none is blocked" in overview
    else:
        assert f"{coverage['blocked']} are blocked" in overview


def test_every_page_lists_what_it_cites() -> None:
    """A page that cites a work in its text lists it in its reference block, and every cited id exists
    in the citations table. Three pages cited works they never listed (Experiments and the
    Introduction had no reference block at all), and an id missing from the table renders as a raw
    "[id]" in the page rather than as a citation."""
    source = ROOT / "frontend" / "src"
    table = (source / "content" / "citations.ts").read_text(encoding="utf-8")
    known = set(re.findall(r"id:\s*'([^']+)'", table))
    problems = []
    for page in sorted((source / "pages").glob("*.tsx")):
        text = page.read_text(encoding="utf-8")
        cited = set(re.findall(r'<Cite id="([^"]+)"', text))
        listed = set()
        for block in re.findall(r"<Refs ids=\{\[([^\]]*)\]\}", text):
            listed |= set(re.findall(r"'([^']+)'", block))
        if cited - listed:
            problems.append(f"{page.name} cites {sorted(cited - listed)} without listing them")
        if (cited | listed) - known:
            problems.append(f"{page.name} uses ids missing from the table: {sorted((cited | listed) - known)}")
    assert not problems, problems


def test_every_experiments_view_sits_in_exactly_one_group() -> None:
    """The Experiments page shows its views grouped by question (ADR-0071 section 5). A view defined but
    left out of every group would still compile and simply never appear; a view in two groups would
    appear twice. Both are held here, and no group may grow past the six-peer bound it exists for."""
    page = (ROOT / "frontend" / "src" / "pages" / "Experiments.tsx").read_text(encoding="utf-8")
    table = page[page.index("export const EXPERIMENT_GROUPS") : page.index("export function Experiments(")]
    grouped = re.findall(r"views: \[([^\]]*)\]", table)
    members = [m for g in grouped for m in re.findall(r"'([^']+)'", g)]
    views_block = page[page.index("const views: Record") : page.index(".map((view) => [view.id, view])")]
    defined = re.findall(r"^\s{6}  id: '([^']+)',", views_block, flags=re.MULTILINE)
    assert defined, "no views found; the page structure changed and this test must follow it"
    assert sorted(members) == sorted(set(members)), f"a view is in two groups: {members}"
    assert set(members) == set(defined), (
        f"grouped but undefined: {sorted(set(members) - set(defined))}; "
        f"defined but in no group: {sorted(set(defined) - set(members))}"
    )
    assert len(grouped) <= 6 and all(len(re.findall(r"'", g)) // 2 <= 6 for g in grouped)


#: The registry's axis units that are real units, printed after a value ("20 tau0", "126 ps"). Every
#: unit the registry declares must be here or in the frontend's DIMENSIONLESS_AXIS_UNITS; a new one
#: has to be classified before it can print.
PHYSICAL_AXIS_UNITS = {"tau0", "ps", "sites", "K/kT", "K/mu", "B_r / (K/mu)", "C_j / C_b", "j0"}


def test_every_axis_unit_is_either_printed_or_known_dimensionless() -> None:
    """The workbench and the Materials table print a variant as "value unit". Four registry units name
    a dimensionless quantity instead of a unit (alpha, xi, count, index) and printed as "4 count" and
    "Damping = 0.1 alpha" until the frontend learned to drop them. A unit nobody has classified would
    reintroduce that, so each one has to be in exactly one of the two sets."""
    units_ts = (ROOT / "frontend" / "src" / "data" / "units.ts").read_text(encoding="utf-8")
    block = re.search(r"DIMENSIONLESS_AXIS_UNITS = new Set\(\[([^\]]*)\]\)", units_ts)
    assert block, "the frontend no longer declares its dimensionless axis units"
    dimensionless = set(re.findall(r"'([^']+)'", block.group(1)))
    declared = {case.axis.unit for case in CASES.values()}
    unclassified = declared - dimensionless - PHYSICAL_AXIS_UNITS
    assert not unclassified, f"axis units nobody classified: {sorted(unclassified)}"
    assert not dimensionless & PHYSICAL_AXIS_UNITS, "a unit cannot be both"


def test_every_registry_label_the_interface_shows_has_a_spanish_form() -> None:
    """The six case categories head the coverage matrix and group the case selector, and the axis
    labels name controls and chart axes. On the Spanish page they printed in English until the
    interface got a table for them; a category or axis added to the registry later has to be added
    there too, or it reaches the Spanish page untranslated."""
    table = (ROOT / "frontend" / "src" / "content" / "registry-es.ts").read_text(encoding="utf-8")

    def keys(name: str) -> set[str]:
        block = table[table.index(f"export const {name}") :]
        block = block[: block.index("};")]
        return set(re.findall(r"^\s+'?([^':]+?)'?:\s*'", block, flags=re.MULTILINE))

    categories = {case.category for case in CASES.values()}
    labels = {case.axis.label for case in CASES.values()}
    assert categories <= keys("CATEGORY_ES"), f"untranslated categories: {sorted(categories - keys('CATEGORY_ES'))}"
    assert labels <= keys("AXIS_LABEL_ES"), f"untranslated axis labels: {sorted(labels - keys('AXIS_LABEL_ES'))}"


#: Words an untagged diagram label may carry because they read the same in both languages: names of
#: codes and formats, and the symbols of the cost integral.
_LANGUAGE_NEUTRAL = {"phi", "integral", "dt", "spinoct", "json", "spirit", "gneb", "vampire", "heun", "doi"}


def test_every_architecture_diagram_label_is_tagged_or_language_neutral() -> None:
    """The modal draws each label twice, l-en and l-es, and the shell shows one. A label with neither
    class shows in both languages: "DOI + units", "OCP engine", "this page" and "Energy (J)" did, on the
    Spanish modal, through 0.15.004, and the modal gate compared the tagged lines only."""
    source = (ROOT / "frontend" / "src" / "content" / "architecture.ts").read_text(encoding="utf-8")
    labels = re.findall(r"<text([^>]*)>([^<]*)</text>", source)
    assert len(labels) > 40
    untagged = [text for attrs, text in labels if 'class="l-en"' not in attrs and 'class="l-es"' not in attrs]
    for text in untagged:
        words = {w.lower() for w in re.findall(r"[A-Za-z]{2,}", text)}
        assert words <= _LANGUAGE_NEUTRAL, f"untagged diagram label in one language: {text!r}"

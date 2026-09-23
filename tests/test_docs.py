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

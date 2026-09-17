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

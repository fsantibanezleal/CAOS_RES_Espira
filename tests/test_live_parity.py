"""The live-lane parity fixture: current with its sources, and wide enough to be a check.

The browser gate compares the web's own implementation against this fixture. That is only evidence if
the fixture itself still equals what SciPy and the engine return now, which is what these tests hold.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest
from scipy.special import ellipk

from espiralab.bake.parity import PARITY_SCHEMA, bake_live_parity
from espiralab.cases import CASES

ROOT = Path(__file__).resolve().parents[1]
FIXTURE = ROOT / "data" / "artifacts" / "live_parity.json"


@pytest.fixture(scope="module")
def committed() -> dict:
    return json.loads(FIXTURE.read_text(encoding="utf-8"))


def test_the_committed_fixture_matches_a_fresh_bake(committed: dict) -> None:
    """A stale fixture would let the browser agree with a value the engine no longer produces."""
    fresh = bake_live_parity()
    assert committed["schema"] == fresh["schema"] == PARITY_SCHEMA
    assert committed["case"] == fresh["case"]
    assert committed["inputs"] == pytest.approx(fresh["inputs"])
    for old, new in zip(committed["elliptic_k"], fresh["elliptic_k"], strict=True):
        assert old["m"] == new["m"]
        assert old["k"] == pytest.approx(new["k"], rel=1e-15)
    for old, new in zip(committed["protocol"], fresh["protocol"], strict=True):
        assert old == pytest.approx(new, rel=1e-12)


def test_the_elliptic_grid_reaches_the_singular_end(committed: dict) -> None:
    """K(m) diverges as m approaches one; an implementation that stops iterating early fails there
    first, so a grid that stopped at m = 0.5 would not be a check at all."""
    moduli = [row["m"] for row in committed["elliptic_k"]]
    assert min(moduli) == 0.0
    assert max(moduli) >= 0.99
    assert len(moduli) == len(set(moduli))
    for row in committed["elliptic_k"]:
        assert row["k"] == pytest.approx(float(ellipk(row["m"])), rel=1e-15)


def test_the_fixture_covers_the_live_case_sweep(committed: dict) -> None:
    case = CASES[committed["case"]]
    assert case.primary_method == "R06", "the fixture pins the method the browser implements"
    assert [row["switching_time_tau0"] for row in committed["protocol"]] == list(case.axis.values)
    for row in committed["protocol"]:
        assert row["mean_current_reduced"] > 0.0
        assert row["characteristic_time_s"] > 0.0


def test_tolerances_are_tighter_than_anything_the_product_claims(committed: dict) -> None:
    assert committed["tolerances"]["elliptic_k"] <= 1e-12
    assert committed["tolerances"]["protocol"] <= 1e-6

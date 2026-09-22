"""The hard-axis map (BL-035): the region claim, and the control that makes it a claim at all."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from espiralab.bake.hard_axis import (
    CONTROL_TOLERANCE,
    DAMPINGS,
    GRID,
    HARD_AXIS_SCHEMA,
    RATIOS,
    SWITCHING_TIMES_TAU0,
)

ROOT = Path(__file__).resolve().parents[1]
ARTIFACT = ROOT / "data" / "artifacts" / "hard_axis_map.json"


@pytest.fixture(scope="module")
def committed() -> dict:
    return json.loads(ARTIFACT.read_text(encoding="utf-8"))


def test_the_map_covers_the_declared_grid(committed: dict) -> None:
    assert committed["schema"] == HARD_AXIS_SCHEMA
    assert committed["axes"] == {
        "ratio": list(RATIOS),
        "damping": list(DAMPINGS),
        "switching_tau0": list(SWITCHING_TIMES_TAU0),
    }
    assert sorted(p["key"] for p in committed["points"]) == sorted(point.key for point in GRID)


def test_a_cell_is_evidence_only_where_the_control_holds(committed: dict) -> None:
    """The map divides by the solver reproducing the closed form it already knows. Where that drifts,
    the cell is not evidence, and nothing may be claimed from it."""
    for point in committed["points"]:
        if point["helped"]:
            assert point["reliable"], f"{point['key']}: helped without its control holding"
            assert point["ratio"] > 0.0
            assert point["reduction_vs_control"] > 1.0
        if point["reliable"]:
            assert abs(1.0 - point["control"]) <= CONTROL_TOLERANCE
            assert point["converged"] and not point["at_floor"]


def test_the_uniaxial_control_column_returns_the_closed_form(committed: dict) -> None:
    """At ratio zero the biaxial system IS the uniaxial one: any departure from one is the numerical
    method's own error, which is why every other cell is divided by it."""
    for point in committed["points"]:
        if point["ratio"] == 0.0:
            assert point["reduction_vs_control"] == pytest.approx(1.0, abs=1e-12)
            assert not point["helped"]


def test_the_benefit_lives_at_short_switching_times(committed: dict) -> None:
    """The measured region the tab describes: the hard axis pays early and stops paying later. A run
    that spread the benefit over every switching time would mean the mechanism was misunderstood."""
    helped = [p for p in committed["points"] if p["helped"]]
    assert helped, "the mechanism has to pay somewhere, or C04 is wrong"
    assert len(helped) < committed["summary"]["reliable"], "and it must not pay everywhere"
    longest_helped = max(p["switching_tau0"] for p in helped)
    shortest_harmed = min(
        (p["switching_tau0"] for p in committed["points"] if p["reliable"] and p["ratio"] > 0 and not p["helped"]),
        default=None,
    )
    assert shortest_harmed is not None
    assert longest_helped >= shortest_harmed, "the two regions must overlap in time, not be disjoint"
    for damping in DAMPINGS:
        at_damping = [p for p in helped if p["damping"] == damping]
        if at_damping:
            assert min(p["switching_tau0"] for p in at_damping) == min(SWITCHING_TIMES_TAU0)


def test_the_summary_counts_match_the_cells(committed: dict) -> None:
    points, summary = committed["points"], committed["summary"]
    assert summary["points"] == len(points) == 196
    assert summary["reliable"] == sum(1 for p in points if p["reliable"])
    assert summary["helped"] == sum(1 for p in points if p["helped"])
    assert summary["unconverged"] == sum(1 for p in points if not p["converged"])
    assert summary["at_floor"] == sum(1 for p in points if p["at_floor"])
    assert summary["control_tolerance"] == CONTROL_TOLERANCE
    best = next(p for p in points if p["key"] == summary["best"]["key"])
    assert best["reliable"] and best["reduction_vs_control"] == pytest.approx(summary["best"]["reduction_vs_control"])

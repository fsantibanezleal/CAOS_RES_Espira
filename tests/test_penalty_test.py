"""The prediction test (BL-020): the penalty against the ensemble, and the sign it caught.

The engine claims its deterministic instability penalty predicts the Monte-Carlo success rate. These
tests hold the committed measurement to what it says, and hold the two implementations of "the
stabilizing field" to meaning the same thing, which is what went wrong in spinoct 0.17.000.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from espiralab.bake.penalty_test import BR_RATIOS, PENALTY_SCHEMA, STABILITY_FACTORS

ROOT = Path(__file__).resolve().parents[1]
ARTIFACT = ROOT / "data" / "artifacts" / "penalty_test.json"


@pytest.fixture(scope="module")
def committed() -> dict:
    return json.loads(ARTIFACT.read_text(encoding="utf-8"))


def test_the_grid_is_the_declared_one(committed: dict) -> None:
    assert committed["schema"] == PENALTY_SCHEMA
    assert committed["axes"] == {
        "br_over_anisotropy": list(BR_RATIOS),
        "stability_factor": list(STABILITY_FACTORS),
    }
    assert len(committed["cells"]) == len(BR_RATIOS) * len(STABILITY_FACTORS)


def test_the_analysis_and_the_ensemble_agree_on_the_stabilising_field(committed: dict) -> None:
    """The heart of it: where the linearized analysis says the instability is gone, the measured
    failure rate must be no worse than without the field. Until spinoct 0.18.000 it was worse, because
    the field was applied with the opposite sign to the one the analysis assumes."""
    for stability in STABILITY_FACTORS:
        row = [c for c in committed["cells"] if c["stability_factor"] == stability]
        bare = next(c for c in row if c["br_over_anisotropy"] == 0.0)
        stabilised = next(c for c in row if c["br_over_anisotropy"] == max(BR_RATIOS))
        assert bare["hyperbolic_fraction"] > 0.2, "the bare path has an instability to remove"
        assert stabilised["hyperbolic_fraction"] < 0.01, "and the analysis says this field removes it"
        assert stabilised["failure_rate"] <= bare["failure_rate"] + bare["confidence95"], (
            f"K/kT = {stability}: the field the analysis calls stabilizing made switching worse"
        )


def test_the_verdict_counts_what_the_rows_say(committed: dict) -> None:
    rows, verdict = committed["per_stability"], committed["verdict"]
    assert verdict["rows"] == len(rows) == len(STABILITY_FACTORS)
    assert verdict["testable_rows"] == sum(1 for r in rows if r["separated"])
    assert verdict["rows_agreeing"] == sum(1 for r in rows if r["separated"] and r["gap"] > 0.0)
    # A test that can never fail is not a test: some row must be able to decide.
    assert verdict["testable_rows"] >= 1


def test_the_prediction_holds_where_the_measurement_can_decide(committed: dict) -> None:
    """The result as shipped: every row that separates agrees with the penalty. If a later change makes
    this fail, the tab's headline sentence flips with it, and the gate checks that it does."""
    verdict = committed["verdict"]
    assert verdict["rows_agreeing"] == verdict["testable_rows"]


def test_a_row_that_cannot_fail_is_not_counted_as_evidence(committed: dict) -> None:
    """At a high stability factor nothing fails with or without the field, so the row cannot decide and
    must not be counted as agreement."""
    quiet = [r for r in committed["per_stability"] if not r["separated"]]
    for row in quiet:
        assert abs(row["gap"]) < 0.05, "a row that cannot decide should also be a small difference"


def test_which_predictor_actually_ranks_the_sweep(committed: dict) -> None:
    """The engine's claim splits in two, and the tab says which half holds.

    The hyperbolicity INTEGRAL weights how unstable the path is, and it peaks at a quarter of an
    anisotropy field where the measured failure rate has already fallen, so it ranks no row. The
    hyperbolic FRACTION falls with the field like the failures do, and ranks every row that is not
    full of ties at zero failures.
    """
    verdict = committed["verdict"]
    assert verdict["rows_failing_monotonically"] == verdict["rows"], "the failures do fall with the field"
    assert verdict["rows_ranked_by_penalty"] == 0, "and the integral does not track that"
    assert verdict["rows_ranked_by_fraction"] > verdict["rows_ranked_by_penalty"]
    peak = max(committed["cells"], key=lambda c: c["penalty_over_floor"])
    assert 0.0 < peak["br_over_anisotropy"] < 1.0, "the integral peaks inside the sweep, not at its start"


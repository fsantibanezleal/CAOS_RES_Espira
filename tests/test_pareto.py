"""The device trade-off front (R14): current with the engine, and the claims the tab makes about it."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from espiralab.bake.pareto import PARETO_SCHEMA, SWITCHING_TIMES_TAU0, bake_pareto_fronts
from espiralab.materials import material_slugs

ROOT = Path(__file__).resolve().parents[1]
ARTIFACT = ROOT / "data" / "artifacts" / "pareto.json"


@pytest.fixture(scope="module")
def committed() -> dict:
    return json.loads(ARTIFACT.read_text(encoding="utf-8"))


def test_the_committed_front_matches_a_fresh_bake(committed: dict) -> None:
    fresh = bake_pareto_fronts()
    assert committed["schema"] == PARETO_SCHEMA
    assert [m["material"] for m in committed["materials"]] == [m["material"] for m in fresh["materials"]]
    for old, new in zip(committed["materials"], fresh["materials"], strict=True):
        assert [p["cost"] for p in old["points"]] == pytest.approx([p["cost"] for p in new["points"]], rel=1e-12)
        assert [p["peak_field_t"] for p in old["points"]] == pytest.approx(
            [p["peak_field_t"] for p in new["points"]], rel=1e-12
        )


def test_every_material_is_covered_over_the_declared_sweep(committed: dict) -> None:
    assert [m["material"] for m in committed["materials"]] == material_slugs()
    for entry in committed["materials"]:
        assert [p["switching_time_tau0"] for p in entry["points"]] == list(SWITCHING_TIMES_TAU0)


def test_counting_the_deadline_makes_the_front_everything(committed: dict) -> None:
    """Every point sweeps a different switching time, so with time as an objective nothing can be
    dominated. The tab says that this framing is empty; this holds it to it, so a later change that
    quietly makes the four-objective front meaningful cannot pass unnoticed."""
    for entry in committed["materials"]:
        assert entry["front_size"] == len(entry["points"])
        assert not any(p["dominated"] for p in entry["points"])


def test_cost_and_peak_field_fall_with_the_budget_but_bandwidth_does_not(committed: dict) -> None:
    """The measured shape of the trade: two objectives reward a longer deadline monotonically and one
    does not, which is what makes the tab's bandwidth statement worth making."""
    for entry in committed["materials"]:
        points = entry["points"]
        for key in ("cost", "peak_field_t"):
            values = [p[key] for p in points]
            assert values == sorted(values, reverse=True), f"{entry['material']}: {key} is not monotone"
        bandwidth = [p["bandwidth_hz"] for p in points]
        assert bandwidth != sorted(bandwidth, reverse=True), f"{entry['material']}: bandwidth is monotone"
        inversions = entry["bandwidth_inversions"]
        assert inversions["count"] >= 1 and inversions["worst"]["ratio"] > 1.0
        assert inversions["worst"]["faster_tau0"] < inversions["worst"]["slower_tau0"]
        # Only the longest budget survives once the deadline is fixed, and the flags must agree.
        assert entry["supply_front_size"] == sum(1 for p in points if not p["dominated_without_time"])
        assert entry["supply_front_size"] >= 1


def test_the_fitted_slopes_are_what_the_tab_claims(committed: dict) -> None:
    """Cost and peak field fall like 1/T; the bandwidth does not, and its residual says so."""
    for entry in committed["materials"]:
        exponents = entry["exponents"]
        assert exponents["cost"]["slope"] == pytest.approx(-1.0, abs=0.05)
        assert exponents["cost"]["max_log_residual"] < 0.1
        assert exponents["peak_field_t"]["slope"] == pytest.approx(-1.0, abs=0.1)
        bandwidth = exponents["bandwidth_hz"]
        assert bandwidth["slope"] > -0.6, "the bandwidth falls far more slowly than 1/T"
        assert bandwidth["max_log_residual"] > 0.2, "and it is not a power law, which the tab says"


def test_a_shared_damping_gives_the_same_reduced_trade(committed: dict) -> None:
    """The family is universal in reduced units at a given damping: materials that share alpha must
    share every fitted slope, and one that does not must differ."""
    by_damping: dict[float, list[dict]] = {}
    for entry in committed["materials"]:
        by_damping.setdefault(entry["damping"], []).append(entry)
    for group in by_damping.values():
        for entry in group[1:]:
            assert entry["exponents"]["cost"]["slope"] == pytest.approx(
                group[0]["exponents"]["cost"]["slope"], rel=1e-9
            )
    assert len(by_damping) > 1, "the database has more than one damping, so this test can fail"

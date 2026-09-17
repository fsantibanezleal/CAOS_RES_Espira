"""Sandboxed bake smoke: regenerate one case and compare it with the committed artifact.

The bake writes only to a temporary directory; the canonical `data/artifacts/` must be untouched. The
comparison is a tolerance, not a byte hash, because floating-point results move across machines and
library builds.
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np

from espiralab.bake import bake_case
from espiralab.cases import get_case

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / "data" / "artifacts"
#: Relative tolerance for a regenerated number against the committed one.
RELATIVE_TOLERANCE = 1e-6


def _numbers(rows: list[dict], key: str) -> np.ndarray:
    return np.array([row[key] for row in rows], dtype=float)


def test_regenerated_case_matches_the_committed_artifact(tmp_path: Path) -> None:
    before = {p.name: p.stat().st_mtime_ns for p in ARTIFACTS.glob("*.json")}
    slug = "fe3gete2-field"
    regenerated = bake_case(get_case(slug))
    (tmp_path / f"{slug}.json").write_text(json.dumps(regenerated), encoding="utf-8")

    committed = json.loads((ARTIFACTS / f"{slug}.json").read_text(encoding="utf-8"))
    assert regenerated["axis"] == committed["axis"]
    for key in ("cost", "cost_free", "cost_floor", "cost_over_floor"):
        np.testing.assert_allclose(
            _numbers(regenerated["cost_curve"], key),
            _numbers(committed["cost_curve"], key),
            rtol=RELATIVE_TOLERANCE,
            err_msg=key,
        )
    for fresh, stored in zip(regenerated["pulses"], committed["pulses"], strict=True):
        np.testing.assert_allclose(fresh["field_amplitude_t"], stored["field_amplitude_t"], rtol=1e-5, atol=1e-12)
        assert fresh["sz"][0] > 0.99 and fresh["sz"][-1] < -0.99

    after = {p.name: p.stat().st_mtime_ns for p in ARTIFACTS.glob("*.json")}
    assert before == after, "the smoke test must not write the canonical artifacts"


def test_optimal_cost_respects_its_physical_bounds() -> None:
    """The analytic optimum can never beat the universal floor, and it approaches the free cost at short T."""
    artifact = bake_case(get_case("cri3-field"))
    for row in artifact["cost_curve"]:
        assert row["cost"] >= row["cost_floor"]
        # The optimal cost rises with damping, so the nominal value sits inside its damping band.
        assert row["cost_low_damping"] <= row["cost"] * (1.0 + 1e-12)
        assert row["cost"] <= row["cost_high_damping"] * (1.0 + 1e-12)
    ratios = [row["cost_over_floor"] for row in artifact["cost_curve"]]
    assert ratios == sorted(ratios, reverse=True), "the cost falls toward the floor as T grows"

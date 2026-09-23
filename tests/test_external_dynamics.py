"""The external dynamics cross-check (BL-013): our half still reproduces, and the comparison is real.

VAMPIRE is GPL-2, is not installed here and is never imported, so its column cannot be recomputed in
this suite. What these tests hold is the half that can be: our own trajectory, integrated now, must
still end where the committed artifact says it did, the comparison must have been made with one
gyromagnetic ratio rather than two, and the row called a reversal must be one.
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pytest

ROOT = Path(__file__).resolve().parents[1]
ARTIFACT = ROOT / "data" / "artifacts" / "external_dynamics_crosscheck.json"


@pytest.fixture(scope="module")
def committed() -> dict:
    return json.loads(ARTIFACT.read_text(encoding="utf-8"))


def _ours(committed: dict, row: dict, times: np.ndarray) -> np.ndarray:
    from spinoct.dynamics import MacrospinSystem
    from spinoct.dynamics.llg import integrate_llg
    from spinoct.units import bohr_magnetons_to_j_per_t

    system = MacrospinSystem(
        mu=bohr_magnetons_to_j_per_t(committed["moment_bohr"]),
        anisotropy_j=committed["anisotropy_j"],
        alpha=row["alpha"],
        gamma=committed["gyromagnetic_ratio_rad_per_s_t"],
    )
    start = np.asarray(row["start"], dtype=float)
    start /= np.linalg.norm(start)
    field = np.asarray(row["applied_field_t"], dtype=float)
    return integrate_llg(start, lambda _t: field, times, system)


def test_our_column_still_reproduces(committed: dict) -> None:
    """If our trajectory moves, the comparison is stale and the agreement it claims is about an old
    number. The grid is rebuilt from the recorded duration and sample count, so this reintegrates the
    same problem without needing VAMPIRE."""
    for row in committed["rows"]:
        times = np.linspace(0.0, row["duration_s"], row["samples"])
        ours = _ours(committed, row, times)
        assert np.allclose(ours[-1], row["final_ours"], atol=2e-6), (
            f"{row['name']}: ends at {ours[-1]} against the committed {row['final_ours']}"
        )
        assert np.allclose(np.linalg.norm(ours, axis=-1), 1.0, atol=1e-12), "the integrator left the sphere"


def test_the_two_codes_agree_within_the_declared_tolerance(committed: dict) -> None:
    assert committed["engines"]["vampire"], "the external engine's version has to be recorded"
    assert committed["tolerance"] <= 1e-4
    worst = max(r["worst_deviation"] for r in committed["rows"])
    assert worst == pytest.approx(committed["worst_deviation"], abs=1e-12)
    assert committed["agrees"] == (worst <= committed["tolerance"])
    assert committed["agrees"], f"the codes disagree at {worst:.2e}, which is a finding, not a tolerance"


def test_the_comparison_used_one_gyromagnetic_ratio(committed: dict) -> None:
    """The two codes do not share this constant: VAMPIRE hard-codes 1.76e11 and the engine defaults to
    the CODATA value. Left alone the difference moves the trajectory by 1e-04, a hundred times the
    level the codes otherwise agree at, so a comparison made with two constants would be measuring the
    constant and not the equation."""
    from spinoct.units import ELECTRON_GYROMAGNETIC_RATIO_RAD_PER_S_T

    used = committed["gyromagnetic_ratio_rad_per_s_t"]
    assert used == 1.76e11
    assert abs(used / ELECTRON_GYROMAGNETIC_RATIO_RAD_PER_S_T - 1.0) > 1e-4, (
        "if the two constants agreed, the note in the artifact would be wrong"
    )
    assert "1.76e11" in committed["gyromagnetic_note"]


def test_the_reversal_row_reversed(committed: dict) -> None:
    """A reversal case below the switching field, or too short to reach the equator, compares two
    codes agreeing that nothing happened. Both earlier attempts at this row did exactly that."""
    reversals = [r for r in committed["rows"] if r["name"].startswith("reversal")]
    assert reversals, "the comparison has to include the motion the product is about"
    for row in reversals:
        assert row["reversal_time_ours_s"] is not None and row["reversal_time_theirs_s"] is not None
        assert row["final_ours"][2] < -0.5, f"{row['name']} ended at m_z = {row['final_ours'][2]}"
        assert row["reversal_time_difference"] < 1e-3, (
            f"{row['name']}: the two codes disagree on when it reversed by "
            f"{row['reversal_time_difference']:.2e}"
        )
        # The field has to beat the anisotropy field, or there is no reversal to time.
        anisotropy_field = 2.0 * committed["anisotropy_j"] / (committed["moment_bohr"] * 9.2740100783e-24)
        assert abs(row["applied_field_t"][2]) > anisotropy_field


def test_the_comparison_covers_more_than_one_damping(committed: dict) -> None:
    """Damping is the term the two integrators treat differently, so one value of it is not a check."""
    dampings = {r["alpha"] for r in committed["rows"]}
    assert len(dampings) >= 3, f"only {sorted(dampings)} compared"

"""The external cross-check (BL-013): our half of it still reproduces, and the verdict is honest.

Spirit is not a dependency of this product and is not installed here, so its column cannot be recomputed
in this suite. What these tests hold is the half that can be: our own barrier, recomputed now, must still
equal the number the committed artifact compared against, and the artifact must record the external
engine's version and its own tolerance rather than asserting agreement in prose.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
ARTIFACT = ROOT / "data" / "artifacts" / "external_crosscheck.json"


@pytest.fixture(scope="module")
def committed() -> dict:
    return json.loads(ARTIFACT.read_text(encoding="utf-8"))


def _lattice(committed: dict, row: dict):
    """Rebuild the chain or the patch the committed row was measured on."""
    from spinoct.lattice import SpinChain, SpinPatch
    from spinoct.units import bohr_magnetons_to_j_per_t, mev_to_joules

    anisotropy = mev_to_joules(committed["anisotropy_mev"])
    shared = {
        "mu": bohr_magnetons_to_j_per_t(committed["moment_bohr"]),
        "anisotropy_j": anisotropy,
        "exchange_j": row["exchange_over_k"] * anisotropy,
        "alpha": 0.5,
    }
    if row["geometry"] == "patch":
        return SpinPatch(width=row["width"], height=row["height"], **shared)
    return SpinChain(n_sites=row["n_sites"], **shared)


def test_our_column_still_reproduces(committed: dict) -> None:
    """If our barrier moves, the comparison is stale and the agreement it claims is about an old number."""
    from spinoct.lattice import minimum_energy_path, recommended_images
    from spinoct.units import mev_to_joules

    anisotropy = mev_to_joules(committed["anisotropy_mev"])
    for row in committed["rows"]:
        lattice = _lattice(committed, row)
        assert recommended_images(lattice) == row["images"]
        path = minimum_energy_path(
            lattice, n_images=row["images"], initial="wall", max_iterations=200000
        )
        assert path.converged
        assert path.barrier / anisotropy == pytest.approx(row["spinoct_barrier_over_k"], rel=1e-9)


def test_the_two_codes_agree_within_the_declared_tolerance(committed: dict) -> None:
    assert committed["engines"]["spirit"], "the external engine's version has to be recorded"
    assert committed["tolerance"] <= 1e-4
    worst = max(r["relative_difference"] for r in committed["rows"])
    assert worst == pytest.approx(committed["worst_relative_difference"], abs=1e-12)
    assert committed["agrees"] == (worst <= committed["tolerance"])
    assert committed["agrees"], f"the codes disagree at {worst:.2e}, which is a finding, not a tolerance"


def test_the_comparison_covers_the_regime_the_floor_is_used_in(committed: dict) -> None:
    """The floor matters where a wall is cheaper than coherent rotation, so the cross-check has to
    include chains long enough for that, not only the short ones where both modes coincide."""
    chains = sorted((r for r in committed["rows"] if r["geometry"] == "chain"), key=lambda r: r["n_sites"])
    sizes = [r["n_sites"] for r in chains]
    assert len(sizes) >= 3 and max(sizes) >= 16
    # The wall barrier saturates with length; coherent rotation would keep rising as N.
    assert chains[-1]["spinoct_barrier_over_k"] < max(sizes), (
        "a barrier at N K would mean the coherent path, not the wall"
    )


def test_the_two_dimensional_patch_is_cross_checked_on_a_wall(committed: dict) -> None:
    """The patch is the geometry the product's device cases use, and the one where a string method can
    be caught out by its own resolution. A patch row whose barrier is the coherent saddle N K would be
    checking the anisotropy convention, not the saddle, so the comparison has to reach below it."""
    patches = [r for r in committed["rows"] if r["geometry"] == "patch"]
    assert len(patches) >= 2, "one patch is an anecdote"
    assert min(r["barrier_over_nk"] for r in patches) < 0.6, (
        "no patch row is deep enough into the wall regime to test the saddle"
    )
    for row in patches:
        assert row["width"] * row["height"] == row["n_sites"]
        assert row["barrier_over_nk"] == pytest.approx(
            row["spinoct_barrier_over_k"] / row["n_sites"], rel=1e-12
        )

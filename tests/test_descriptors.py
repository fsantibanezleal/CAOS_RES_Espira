"""Exploitability descriptors (BL-026): current with the database, and honest about what they assume."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from espiralab.bake.descriptors import (
    DESCRIPTOR_SCHEMA,
    REFERENCE_TIMES_TAU0,
    RETENTION_FACTORS,
    ROOM_TEMPERATURE_K,
    bake_descriptors,
)
from espiralab.materials import get_material, material_slugs

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / "data" / "artifacts"


@pytest.fixture(scope="module")
def committed() -> dict:
    return json.loads((ARTIFACTS / "descriptors.json").read_text(encoding="utf-8"))


def test_the_committed_descriptors_match_a_fresh_bake(committed: dict) -> None:
    fresh = bake_descriptors(ARTIFACTS)
    assert committed["schema"] == fresh["schema"] == DESCRIPTOR_SCHEMA
    assert [m["material"] for m in committed["materials"]] == material_slugs()
    for old, new in zip(committed["materials"], fresh["materials"], strict=True):
        assert old["cost_floor"] == pytest.approx(new["cost_floor"], rel=1e-12)
        assert [r["cost"] for r in old["reference_times"]] == pytest.approx(
            [r["cost"] for r in new["reference_times"]], rel=1e-12
        )


def test_every_descriptor_traces_to_the_database(committed: dict) -> None:
    for entry in committed["materials"]:
        material = get_material(entry["material"])
        assert entry["moment_bohr"] == material.moment_bohr
        assert entry["anisotropy_mev"] == material.anisotropy_mev
        assert entry["damping"] == material.damping
        assert entry["curie_kelvin"] == material.curie_kelvin
        # The ranking is only as measured as the parameter under it.
        assert entry["provenance"]["damping"] == material.provenance["damping"]["provenance"]


def test_no_cost_falls_below_the_material_floor(committed: dict) -> None:
    """The bound the whole product rests on, checked per material at every reference time."""
    for entry in committed["materials"]:
        assert [r["switching_time_tau0"] for r in entry["reference_times"]] == list(REFERENCE_TIMES_TAU0)
        for row in entry["reference_times"]:
            assert row["cost"] >= entry["cost_floor"] * (1 - 1e-12)
            if not row["at_floor"]:
                assert row["peak_field_t"] > 0 and row["bandwidth_hz"] > 0


def test_retention_counts_are_declared_optimistic(committed: dict) -> None:
    """The counts assume a coherent reversal; this product measured the cheaper wall route, so the
    artifact has to carry the caveat rather than printing a bare number."""
    note = committed["retention_note"]
    assert "coherent" in note and "domain wall" in note
    for entry in committed["materials"]:
        assert [r["stability_factor"] for r in entry["retention"]] == list(RETENTION_FACTORS)
        for row in entry["retention"]:
            # A single site holds nothing at room temperature: every material needs many.
            assert row["sites_needed_coherent"] > 1.0
        assert entry["single_site_kelvin"] < ROOM_TEMPERATURE_K


def test_the_database_spans_a_real_trade(committed: dict) -> None:
    """The tab claims the peak field and the site count pull against each other. Hold it to that:
    the material needing the lowest peak field must not also need the fewest sites."""
    index = REFERENCE_TIMES_TAU0.index(10.0)
    gentlest = min(committed["materials"], key=lambda m: m["reference_times"][index]["peak_field_t"])
    fewest = min(committed["materials"], key=lambda m: m["retention"][0]["sites_needed_coherent"])
    assert gentlest["material"] != fewest["material"]


def test_the_reliability_block_is_a_function_of_the_damping_alone(committed: dict) -> None:
    """At a fixed reduced switching time, stability factor and field in anisotropy-field units, nothing
    else about the material enters the stochastic dynamics. Materials sharing a damping must therefore
    share these numbers exactly, and one with a different damping must differ: a reduction the artifact
    states and this holds it to."""
    by_damping: dict[float, list[dict]] = {}
    for entry in committed["materials"]:
        by_damping.setdefault(entry["damping"], []).append(entry)
    assert len(by_damping) > 1, "the database has more than one damping, so this test can fail"
    for group in by_damping.values():
        first = group[0]["reliability"]
        for entry in group[1:]:
            assert entry["reliability"]["bare_success"] == first["bare_success"]
            assert entry["reliability"]["stabilised_success"] == first["stabilised_success"]
    distinct = {g[0]["reliability"]["bare_success"] for g in by_damping.values()}
    assert len(distinct) > 1, "a different damping has to give a different reliability"
    assert "damping alone" in committed["reliability_note"]


def test_the_stabilising_field_buys_reliability_where_the_bare_pulse_is_fragile(committed: dict) -> None:
    """The per-material thermal front (the last piece of BL-032), on the corrected engine: at a stability
    factor where the bare pulse loses copies, the field must recover them, and charge for it."""
    fragile = [m for m in committed["materials"] if m["reliability"]["bare_success"] < 0.99]
    assert fragile, "at this stability factor some material must be losing copies"
    for entry in fragile:
        r = entry["reliability"]
        assert r["stabilised_success"] > r["bare_success"] + r["bare_confidence95"]
        assert r["added_cost_over_optimal"] > 1.0, "and reliability is not free"

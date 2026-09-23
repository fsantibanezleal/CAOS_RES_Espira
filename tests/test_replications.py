"""The two published replications, C05 and C10, against the numbers their sources print.

Both cases exist to be checkable against someone else's published values, so these tests hold the
committed artifacts to the published numbers and to the protocol facts that make the comparison mean
anything. A replication that quietly stops matching, or that starts matching because our own side went
soft, is what they are here to catch.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from espiralab.stages.infer import _C05_PUBLISHED, _C10_PUBLISHED

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / "data" / "artifacts"
#: The Monte-Carlo interval of 1,000 copies at a rate near one, in fractions: about 1.3 points.
_ENSEMBLE_TOLERANCE = 0.02


@pytest.fixture(scope="module")
def kickoff() -> dict:
    return json.loads((ARTIFACTS / "kickoff-replication.json").read_text(encoding="utf-8"))


@pytest.fixture(scope="module")
def biaxial() -> dict:
    return json.loads((ARTIFACTS / "prb107-biaxial-figures.json").read_text(encoding="utf-8"))


def test_c10_reproduces_the_published_peak_fields(kickoff: dict) -> None:
    """Three of the source's four quoted peak fields, at the damping the database assumes."""
    rows = {row["variant"]: row["r05"] for row in kickoff["cost_curve"]}
    for switching_ps in (4.0, 126.0, 140.0):
        row = rows[switching_ps]
        assert row["published_peak_field_t"] == _C10_PUBLISHED[switching_ps]["optimal_t"]
        assert row["ratio_to_published"] == pytest.approx(1.0, abs=0.03), (
            f"{switching_ps} ps: {row['peak_field_t']} T against a published "
            f"{row['published_peak_field_t']} T"
        )


def test_c10_records_the_point_it_does_not_reproduce(kickoff: dict) -> None:
    """The 2 ns point needs a damping near 0.001, inside the paper's stated range but not ours. The
    case must keep showing the gap rather than dropping the point."""
    row = next(r["r05"] for r in kickoff["cost_curve"] if r["variant"] == 2000.0)
    assert row["ratio_to_published"] > 1.5
    assert row["published_peak_field_t"] == 0.0096


def test_c10_keeps_both_of_the_sources_two_values_for_one_point(kickoff: dict) -> None:
    """At 126 ps the paper prints 0.11 T in one section and 150 mT in another. The case carries both and
    lands on one; if a later change made it agree with the other, that has to be visible."""
    row = next(r["r05"] for r in kickoff["cost_curve"] if r["variant"] == 126.0)
    assert row["published_alternative_t"] == 0.11
    assert abs(row["ratio_to_published"] - 1.0) < abs(row["ratio_to_alternative"] - 1.0)


def test_c05_reproduces_every_published_cell(biaxial: dict) -> None:
    rows = {row["variant"]: row["r11"] for row in biaxial["cost_curve"]}
    for (stability, damping), published in _C05_PUBLISHED.items():
        key = f"alpha_{str(damping).replace('.', 'p')}"
        row = rows[stability]
        assert row[f"published_rate_{key}"] == pytest.approx(published / 100.0)
        assert row[f"success_rate_{key}"] == pytest.approx(
            published / 100.0, abs=_ENSEMBLE_TOLERANCE
        ), f"K/kT = {stability}, alpha = {damping}"


def test_c05_starts_from_a_thermal_distribution(biaxial: dict) -> None:
    """The trap this case fell into: at low damping a short equilibration leaves every copy on the pole,
    nothing can fail, and the run reports a spurious hundred per cent. The spread it starts from is
    recorded, and it has to behave like a Boltzmann distribution, falling as the barrier rises."""
    rows = sorted(biaxial["cost_curve"], key=lambda r: r["variant"])
    spreads = [r["r11"]["equilibrium_spread_alpha_0p01"] for r in rows]
    assert spreads == sorted(spreads, reverse=True), "a colder well must sit closer to the pole"
    for row in rows:
        stability = row["variant"]
        spread = row["r11"]["equilibrium_spread_alpha_0p01"]
        # Order of magnitude of the small-tilt Boltzmann width, 1/(2 K/kT), which the hard axis modifies
        # but does not move by an order of magnitude.
        assert 0.2 / stability < spread < 2.0 / stability, f"K/kT = {stability}: spread {spread}"


def test_c05_covers_the_regime_where_the_protocol_can_fail(biaxial: dict) -> None:
    """A table of ones proves nothing. The sweep has to reach a barrier where copies are lost."""
    rates = [row["r11"]["success_rate_alpha_0p01"] for row in biaxial["cost_curve"]]
    assert min(rates) < 0.95, "the sweep must include a cell the protocol does not always survive"
    assert max(rates) > 0.99


def test_the_introduction_states_the_replication_counts_the_artifacts_have(
    kickoff: dict, biaxial: dict
) -> None:
    """The landing page says the kickoff fields reproduce at three of four quoted points and the
    biaxial table in all eight cells. Stated counts go stale the day a rebake moves a point, so the
    page's words are held to the artifacts here, in both languages."""
    quoted = [r["r05"] for r in kickoff["cost_curve"] if r["r05"].get("published_peak_field_t") is not None]
    reproduced = [r for r in quoted if abs(r["ratio_to_published"] - 1.0) <= 0.03]
    cells = [
        (r["r11"][f"success_rate_{key}"], r["r11"][f"published_rate_{key}"])
        for r in biaxial["cost_curve"]
        for key in ("alpha_0p01", "alpha_0p1")
        if r["r11"].get(f"published_rate_{key}") is not None
    ]
    within = [c for c in cells if abs(c[0] - c[1]) <= _ENSEMBLE_TOLERANCE]

    assert len(within) == len(cells), (
        f"{len(within)} of {len(cells)} thermal cells reproduce; the Introduction says all of them"
    )
    # The page states each measured count as a word, in both languages. A count with no word here means
    # the numbers moved and the page has to be rewritten, which is the point of the test.
    number_words = {3: ("three", "tres"), 4: ("four", "cuatro"), 8: ("eight", "ocho")}
    page = (ROOT / "frontend" / "src" / "pages" / "Introduction.tsx").read_text(encoding="utf-8")
    for measured in (len(reproduced), len(quoted), len(cells)):
        assert measured in number_words, f"the Introduction has no wording for a count of {measured}"
        en, es = number_words[measured]
        assert en in page and es in page, f"the Introduction does not state the count {measured} ({en}/{es})"

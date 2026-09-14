"""The material parameter database and the case registry.

Every parameter row must be traceable (a DOI), physical (positive moment and anisotropy, a damping inside
its own stated range) and every case must reference a real material with a sweep of switching-time
variants the ADR-0069 case contract accepts.
"""

from __future__ import annotations

import re

import pytest

from espiralab.cases import CASES, cases_by_category, get_case, validate_registry
from espiralab.materials import MATERIALS, get_material, material_slugs

DOI = re.compile(r"^10\.\d{4,9}/\S+$")


def _materials():
    return list(MATERIALS.values()) if isinstance(MATERIALS, dict) else list(MATERIALS)


@pytest.mark.parametrize("material", _materials(), ids=lambda m: m.slug)
def test_every_material_is_traceable_and_physical(material) -> None:
    assert material.sources, f"{material.slug} has no source"
    for source in material.sources:
        assert DOI.match(source), f"{material.slug}: {source!r} is not a DOI"
    assert material.moment_bohr > 0.0
    assert material.anisotropy_mev > 0.0
    assert material.hard_axis_ratio >= 0.0
    assert 0.0 < material.damping_low <= material.damping <= material.damping_high < 1.0
    assert material.curie_kelvin > 0.0
    assert material.easy_axis


def test_material_slugs_are_unique_and_resolvable() -> None:
    slugs = material_slugs()
    assert len(slugs) == len(set(slugs))
    for slug in slugs:
        assert get_material(slug).slug == slug
    with pytest.raises((KeyError, ValueError)):
        get_material("not-a-material")


def test_registry_references_only_known_materials() -> None:
    validate_registry()
    for case in CASES.values():
        assert case.material in material_slugs()
        assert get_case(case.slug) is case


def test_categories_partition_the_registry() -> None:
    grouped = cases_by_category()
    flat = [c.slug for cases in grouped.values() for c in cases]
    assert sorted(flat) == sorted(CASES)


@pytest.mark.parametrize("case", list(CASES.values()), ids=lambda c: c.slug)
def test_variants_are_a_positive_increasing_sweep(case) -> None:
    times = case.switching_times_tau0
    assert all(t > 0.0 for t in times)
    assert list(times) == sorted(set(times))


@pytest.mark.parametrize(
    "case",
    [
        pytest.param(
            c,
            marks=pytest.mark.xfail(
                strict=True, reason="FePS3 negative control has 3 variants; U3 of the rebuild brings it to 6"
            ),
        )
        if c.slug == "feps3-negative-control"
        else c
        for c in CASES.values()
    ],
    ids=lambda c: c.slug,
)
def test_each_case_has_at_least_six_variants(case) -> None:
    """ADR-0069 section 4: at least six meaningful variants when a physical parameter family exists."""
    assert len(case.switching_times_tau0) >= 6


@pytest.mark.parametrize("case", list(CASES.values()), ids=lambda c: c.slug)
def test_biaxial_cases_have_a_hard_axis(case) -> None:
    if case.includes_biaxial:
        assert get_material(case.material).hard_axis_ratio > 0.0

"""The material parameter database: every row traceable (a DOI) and physical.

The case registry has its own contract in test_registry.py.
"""

from __future__ import annotations

import re

import pytest

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

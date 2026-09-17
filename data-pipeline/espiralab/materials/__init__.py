"""The spin-Hamiltonian parameter database of the baked van der Waals magnets, loaded through Contract 1.

There is no public experimental dataset of shaped-pulse switching in these materials, so the product's
real data is the set of measured and computed spin-Hamiltonian parameters. They live in
``data/materials/parameters.csv``, one row per value with its unit, basis, provenance class, method and
DOI, and enter the engine only through the ingest and preprocess stages. The audit that produced the table
(programme dossier 07, 2026-09-14) corrected several values that earlier versions carried without a source
or with a wrong one; every value that is an assumption rather than a measurement or a calculation is
flagged, and the flags travel into the artifacts.
"""

from __future__ import annotations

from functools import cache

from .model import MaterialParameters

__all__ = ["MATERIALS", "MaterialParameters", "get_material", "load_materials", "material_slugs"]


@cache
def load_materials() -> dict[str, MaterialParameters]:
    """Validate the tables (strict) and return the material records by slug."""
    from ..stages.ingest import ingest
    from ..stages.preprocess import preprocess

    return preprocess(ingest(), strict=True)


def __getattr__(name: str):
    # MATERIALS is built on first access, not at import: the preprocess stage imports this package for
    # the record type, so an eager load here would be circular.
    if name == "MATERIALS":
        return load_materials()
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")


def material_slugs() -> list[str]:
    """The slugs of all materials, in table order."""
    return list(load_materials())


def get_material(slug: str) -> MaterialParameters:
    """Look up a material by slug.

    Raises:
        KeyError: if the slug is not in the database.
    """
    materials = load_materials()
    if slug not in materials:
        raise KeyError(f"unknown material {slug!r}; known: {material_slugs()}")
    return materials[slug]

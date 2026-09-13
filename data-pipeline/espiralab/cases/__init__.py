"""The case registry: the explicit coverage matrix of the product.

A case pins a material, a switching-time sweep, and the methods to run, and declares why it is
included and what a pass or a fail would mean. The registry is grouped by category so the web app can
show one selected case in the workbench while the Experiments and Benchmark pages show cross-case
summaries by category.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from ..materials import MATERIALS, material_slugs

__all__ = ["CASES", "Case", "cases_by_category", "get_case"]


@dataclass(frozen=True)
class Case:
    """One entry in the coverage matrix.

    Attributes:
        slug: the case identifier.
        title: a short display title.
        category: the domain taxonomy group.
        material: the material slug the case runs on.
        switching_times_tau0: the switching times to sweep, in units of tau0.
        reason: why this case is in the matrix (its scientific role).
        expectation: the pre-declared expected behaviour, so a surprise is legible.
        includes_biaxial: whether the case exercises the numerical biaxial optimal control path.
    """

    slug: str
    title: str
    category: str
    material: str
    switching_times_tau0: tuple[float, ...]
    reason: str
    expectation: str
    includes_biaxial: bool = False
    tags: list[str] = field(default_factory=list)


_DEFAULT_SWEEP = (2.0, 5.0, 10.0, 20.0, 50.0, 100.0)


CASES: dict[str, Case] = {
    # Category A: real materials, the field-driven optimal control comparison.
    "crsbr-field": Case(
        slug="crsbr-field",
        title="CrSBr, field-driven reversal",
        category="real-material-field",
        material="crsbr",
        switching_times_tau0=_DEFAULT_SWEEP,
        reason="The kickoff material and, because of its triaxial anisotropy, the natural host of the "
        "biaxial cost-reduction mechanism.",
        expectation="The optimal pulse cost falls with switching time toward the universal floor; the "
        "hard axis pushes the numerical cost below the free-macrospin floor.",
        includes_biaxial=True,
    ),
    "fe3gete2-field": Case(
        slug="fe3gete2-field",
        title="Fe3GeTe2, field-driven reversal",
        category="real-material-field",
        material="fe3gete2",
        switching_times_tau0=_DEFAULT_SWEEP,
        reason="An itinerant metal with strong perpendicular anisotropy, cleanly uniaxial.",
        expectation="Uniaxial: the analytic optimal control path applies and the cost cannot beat the "
        "free-macrospin floor.",
    ),
    "fe3gate2-field": Case(
        slug="fe3gate2-field",
        title="Fe3GaTe2, field-driven reversal",
        category="real-material-field",
        material="fe3gate2",
        switching_times_tau0=_DEFAULT_SWEEP,
        reason="The only above-room-temperature member of the family.",
        expectation="Uniaxial, room-temperature-relevant; the cost curve mirrors Fe3GeTe2 scaled by "
        "its anisotropy and moment.",
    ),
    "cri3-field": Case(
        slug="cri3-field",
        title="CrI3, field-driven reversal",
        category="real-material-field",
        material="cri3",
        switching_times_tau0=_DEFAULT_SWEEP,
        reason="The archetypal two-dimensional magnet and the clean strong-uniaxial extreme.",
        expectation="Large anisotropy: a fast, high-amplitude optimal pulse; the analytic solution is "
        "exact.",
    ),
    # Category B: the damping extremes, which set the reachable energy floor.
    "cr2ge2te6-floor": Case(
        slug="cr2ge2te6-floor",
        title="Cr2Ge2Te6, the low-damping floor",
        category="damping-extreme",
        material="cr2ge2te6",
        switching_times_tau0=_DEFAULT_SWEEP,
        reason="The record-low-damping member, which sets the best-case universal floor because that "
        "floor is linear in the damping.",
        expectation="The lowest universal floor of the family; a wide uncertainty band because the "
        "floor tracks the measured damping range directly.",
    ),
    # Category C: the negative control.
    "feps3-negative-control": Case(
        slug="feps3-negative-control",
        title="FePS3, negative control",
        category="negative-control",
        material="feps3",
        switching_times_tau0=(5.0, 20.0, 50.0),
        reason="An Ising antiferromagnet where uniform ferromagnetic-macrospin reversal is not the "
        "relevant switching mode. Included to show the machinery's honest limit.",
        expectation="The macrospin optimal-control numbers are computed but flagged as not physically "
        "representative of the true antiferromagnetic switching; a number is not the same as a result.",
    ),
}


def get_case(slug: str) -> Case:
    """Look up a case by slug.

    Args:
        slug: the case identifier.

    Returns:
        The :class:`Case`.

    Raises:
        KeyError: if the slug is unknown, or if its material is missing from the database.
    """
    if slug not in CASES:
        raise KeyError(f"unknown case {slug!r}; known: {list(CASES)}")
    case = CASES[slug]
    if case.material not in MATERIALS:
        raise KeyError(f"case {slug!r} references unknown material {case.material!r}")
    return case


def cases_by_category() -> dict[str, list[Case]]:
    """The cases grouped by category, for the cross-case pages.

    Returns:
        A mapping from category to the list of its cases.
    """
    grouped: dict[str, list[Case]] = {}
    for case in CASES.values():
        grouped.setdefault(case.category, []).append(case)
    return grouped


def validate_registry() -> None:
    """Assert every case references a known material. Raises on the first violation."""
    known = set(material_slugs())
    for slug, case in CASES.items():
        if case.material not in known:
            raise ValueError(f"case {slug!r} references unknown material {case.material!r}")

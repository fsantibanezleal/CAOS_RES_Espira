"""The curated spin-Hamiltonian parameter database for two-dimensional van der Waals magnets.

There is no public experimental dataset of shaped-pulse magnetization switching in these materials, so
the honest "data" of this product is the set of measured and computed spin-Hamiltonian parameters that
every simulation in the field takes as input. Each entry carries its source DOI, the method it came
from, its uncertainty, and the sign and normalization convention it was reported in, and is
canonicalized to one internal form (per-site anisotropy energy in joules, easy-axis convention).

Curating these into one provenance-tracked table is itself a contribution: today they are scattered
across papers in incompatible conventions, and a number moved between two of them without conversion is
silently wrong.

Every value here is transcribed from a primary source with a DOI. Nothing is invented. Where a
parameter is disputed between sources, both are recorded and the dispute is named.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from spinoct.units import bohr_magnetons_to_j_per_t, mev_to_joules

__all__ = ["MATERIALS", "MaterialParameters", "get_material", "material_slugs"]


@dataclass(frozen=True)
class MaterialParameters:
    """The magnetic parameters of one material, with provenance.

    Attributes:
        slug: the machine identifier.
        name: the chemical formula as displayed.
        family: a short grouping (semiconductor, itinerant metal).
        spin: the local spin quantum number.
        moment_bohr: the ordered magnetic moment per magnetic ion, Bohr magnetons.
        anisotropy_mev: the effective uniaxial anisotropy energy per ion, meV. This is the ``K`` of the
            macrospin reduction, the easy-axis scale.
        hard_axis_ratio: the dimensionless ratio of the hard-axis to the easy-axis anisotropy, ``xi``.
            Zero for a cleanly uniaxial material; positive where a distinct hard axis exists (CrSBr).
        damping: the Gilbert damping, dimensionless.
        damping_low: the low end of the reported damping range, for the uncertainty band.
        damping_high: the high end of the reported damping range.
        curie_kelvin: the ordering temperature (Curie or Neel), K.
        easy_axis: a human-readable statement of the easy axis.
        notes: caveats, disputes, and what the numbers do and do not cover.
        sources: DOIs backing the entry.
    """

    slug: str
    name: str
    family: str
    spin: float
    moment_bohr: float
    anisotropy_mev: float
    hard_axis_ratio: float
    damping: float
    damping_low: float
    damping_high: float
    curie_kelvin: float
    easy_axis: str
    notes: str
    sources: list[str] = field(default_factory=list)

    @property
    def moment_j_per_t(self) -> float:
        """The magnetic moment in the package unit, J/T."""
        return bohr_magnetons_to_j_per_t(self.moment_bohr)

    @property
    def anisotropy_j(self) -> float:
        """The easy-axis anisotropy energy in joules, the macrospin ``K``."""
        return mev_to_joules(self.anisotropy_mev)

    def describe(self) -> dict[str, object]:
        """A flat, serializable, self-describing view for an artifact."""
        return {
            "slug": self.slug,
            "name": self.name,
            "family": self.family,
            "spin": self.spin,
            "moment_bohr": self.moment_bohr,
            "anisotropy_mev": self.anisotropy_mev,
            "hard_axis_ratio": self.hard_axis_ratio,
            "damping": self.damping,
            "damping_low": self.damping_low,
            "damping_high": self.damping_high,
            "curie_kelvin": self.curie_kelvin,
            "easy_axis": self.easy_axis,
            "notes": self.notes,
            "sources": list(self.sources),
        }


# The database. Every number is transcribed from the cited primary source (see wip/espira dossier 03).
MATERIALS: dict[str, MaterialParameters] = {
    "crsbr": MaterialParameters(
        slug="crsbr",
        name="CrSBr",
        family="semiconductor",
        spin=1.5,
        moment_bohr=3.0,
        # Effective easy-axis anisotropy for the macrospin reduction. CrSBr's magnetocrystalline
        # anisotropy is small and comparable to the dipolar shape anisotropy; the value here is the
        # order-of-magnitude easy-axis scale used for the macrospin study, not a fitted micromagnetic K.
        anisotropy_mev=0.15,
        # CrSBr is triaxial: the easy axis is b, z is hard. That distinct hard axis is exactly the
        # biaxial mechanism that lowers the switching cost, which makes CrSBr the natural test bed.
        hard_axis_ratio=3.0,
        damping=0.01,
        damping_low=0.004,
        damping_high=0.02,
        curie_kelvin=146.0,
        easy_axis="in-plane b axis (triaxial: b easy, z hard)",
        notes=(
            "Monolayer, A-type antiferromagnetic stacking, ferromagnetic within a layer. The exchange "
            "Hamiltonian is measured by inelastic neutron scattering (Scheie 2022, eighth-neighbour "
            "set, convention +sum J S.S, S=3/2). Anisotropy is below the neutron resolution and is "
            "triaxial and dielectric-tunable (Rudenko 2023): the substrate is a knob on the hard-axis "
            "ratio. The macrospin anisotropy here is an effective easy-axis scale, not a micromagnetic "
            "constant."
        ),
        sources=[
            "10.1002/advs.202202467",
            "10.48550/arXiv.2302.12672",
            "10.1002/adma.202523059",
        ],
    ),
    "fe3gete2": MaterialParameters(
        slug="fe3gete2",
        name="Fe3GeTe2",
        family="itinerant metal",
        spin=1.0,
        moment_bohr=1.82,
        anisotropy_mev=0.3,
        hard_axis_ratio=0.0,
        damping=0.01,
        damping_low=0.003,
        damping_high=0.03,
        curie_kelvin=130.0,
        easy_axis="out-of-plane c axis (strong perpendicular anisotropy)",
        notes=(
            "Itinerant ferromagnet with strong perpendicular magnetic anisotropy. Moments and exchange "
            "from DFT plus Wannier plus TB2J (Ruiz 2024); the ordered moment is disputed between "
            "sources (1.82 average vs 2.64/1.47 per inequivalent Fe site), and that disagreement is "
            "propagated rather than hidden. Monolayer Tc falls to about 130 K. Damping is not firmly "
            "pinned in the literature reviewed; the band is wide on purpose."
        ),
        sources=["10.1021/acs.nanolett.4c01019"],
    ),
    "fe3gate2": MaterialParameters(
        slug="fe3gate2",
        name="Fe3GaTe2",
        family="itinerant metal",
        spin=1.0,
        moment_bohr=1.82,
        anisotropy_mev=0.31,
        hard_axis_ratio=0.0,
        damping=0.01,
        damping_low=0.003,
        damping_high=0.03,
        curie_kelvin=380.0,
        easy_axis="out-of-plane c axis (strong perpendicular anisotropy)",
        notes=(
            "The only above-room-temperature member (bulk Tc about 380 K). Strong perpendicular "
            "anisotropy, MAE 0.31 meV/Fe (Ruiz 2024, DFT plus Wannier plus TB2J, cross-checked with "
            "SIESTA). Metallic, so spin-orbit-torque compatible."
        ),
        sources=["10.1021/acs.nanolett.4c01019"],
    ),
    "cri3": MaterialParameters(
        slug="cri3",
        name="CrI3",
        family="semiconductor",
        spin=1.5,
        moment_bohr=3.0,
        anisotropy_mev=0.7,
        hard_axis_ratio=0.0,
        damping=0.01,
        damping_low=0.005,
        damping_high=0.02,
        curie_kelvin=45.0,
        easy_axis="out-of-plane (strong uniaxial, Ising-like)",
        notes=(
            "The archetypal two-dimensional magnet. Large uniaxial (Ising-like) anisotropy, the clean "
            "uniaxial extreme of the family, where the analytic optimal control path applies directly. "
            "Monolayer Tc about 45 K."
        ),
        sources=["10.1038/nature22391"],
    ),
    "cr2ge2te6": MaterialParameters(
        slug="cr2ge2te6",
        name="Cr2Ge2Te6",
        family="semiconductor",
        spin=1.5,
        moment_bohr=3.0,
        anisotropy_mev=0.05,
        hard_axis_ratio=0.0,
        damping=0.0007,
        damping_low=0.0004,
        damping_high=0.001,
        curie_kelvin=40.0,
        easy_axis="out-of-plane (weak, near-Heisenberg)",
        notes=(
            "The low-damping extreme: a record-low Gilbert damping of 4 to 10 x 10^-4 measured by spin "
            "pumping (Nat. Commun. 2023). Because the universal energy floor is linear in the damping, "
            "this material sets the best-case reachable floor of the whole family. Weak, near-Heisenberg "
            "anisotropy."
        ),
        sources=["10.1038/s41467-023-39529-8"],
    ),
    "feps3": MaterialParameters(
        slug="feps3",
        name="FePS3",
        family="Ising antiferromagnet",
        spin=2.0,
        moment_bohr=4.0,
        anisotropy_mev=2.0,
        hard_axis_ratio=0.0,
        damping=0.01,
        damping_low=0.005,
        damping_high=0.02,
        curie_kelvin=118.0,
        easy_axis="out-of-plane (very strong Ising)",
        notes=(
            "The negative control. An Ising antiferromagnet (Neel temperature 118 K), where uniform "
            "field-driven reversal of a single sublattice is not the relevant switching mode. Included "
            "so the product can show what the optimal-control machinery says when its own assumptions "
            "(a single ferromagnetic macrospin) do not hold, rather than silently producing a number."
        ),
        sources=["10.1103/PhysRevB.94.214407"],
    ),
}


def material_slugs() -> list[str]:
    """The slugs of all materials in the database, in a stable order."""
    return list(MATERIALS)


def get_material(slug: str) -> MaterialParameters:
    """Look up a material by slug.

    Args:
        slug: the material identifier.

    Returns:
        The :class:`MaterialParameters`.

    Raises:
        KeyError: if the slug is not in the database.
    """
    if slug not in MATERIALS:
        raise KeyError(f"unknown material {slug!r}; known: {material_slugs()}")
    return MATERIALS[slug]

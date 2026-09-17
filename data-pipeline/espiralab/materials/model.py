"""The engine-facing material record.

Values are canonical (moment in Bohr magnetons per ion, anisotropy in meV per ion in the unit-vector
convention, dimensionless damping, ordering temperature in K). Every value's provenance travels with the
record, so an artifact can say which numbers are measured, computed, derived or assumed.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from spinoct.units import bohr_magnetons_to_j_per_t, mev_to_joules

__all__ = ["MaterialParameters"]


@dataclass(frozen=True)
class MaterialParameters:
    """The magnetic parameters of one material, with provenance.

    Attributes:
        slug: the machine identifier.
        name: the chemical formula as displayed.
        family: a short grouping.
        spin: the local spin quantum number.
        moment_bohr: the magnetic moment per ion, Bohr magnetons.
        anisotropy_mev: the easy-axis anisotropy per ion in the unit-vector convention, meV (the macrospin K).
        hard_axis_ratio: the hard-axis to easy-axis anisotropy ratio; zero when modelled as uniaxial.
        damping: the Gilbert damping.
        damping_low: the low end of the damping band.
        damping_high: the high end of the damping band.
        curie_kelvin: the ordering temperature (Curie or Neel), K.
        easy_axis: a human-readable statement of the easy axis.
        notes: caveats and what the numbers do and do not cover.
        sources: every DOI behind any value.
        provenance: per parameter, the Contract 1 record (class, method, sources, note, input, flags).
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
    provenance: dict[str, dict] = field(default_factory=dict)

    @property
    def moment_j_per_t(self) -> float:
        """The magnetic moment in the engine unit, J/T."""
        return bohr_magnetons_to_j_per_t(self.moment_bohr)

    @property
    def anisotropy_j(self) -> float:
        """The easy-axis anisotropy energy in joules, the macrospin K."""
        return mev_to_joules(self.anisotropy_mev)

    @property
    def flags(self) -> list[str]:
        """Every Contract 1 flag, prefixed by its parameter."""
        return [f"{name}: {flag}" for name, record in self.provenance.items() for flag in record.get("flags", [])]

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
            "provenance": self.provenance,
            "flags": self.flags,
        }

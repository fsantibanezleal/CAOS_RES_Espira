"""Contract 1: the ingestion gate for material parameters (ADR-0057).

Every value the engine consumes enters through this module. A row is one value of one parameter of one
material, with the unit it was published in, the basis that unit refers to, the inputs needed to convert
it, its provenance class, its method, and its source DOI. The contract converts the value to the engine's
canonical form, checks it against physical ranges, and either accepts it, rejects it with a reason, or
accepts it with a flag. Nothing is silently coerced.

Canonical form (the macrospin Hamiltonian ``E = -K s_z^2`` on unit vectors):

| parameter | canonical unit | accepted inputs |
|---|---|---|
| moment | Bohr magnetons per magnetic ion | ``mu_B`` per-ion |
| anisotropy | meV per ion, unit-vector convention | ``meV`` unit-vector; ``meV`` spin-operator (``K = D S^2``); ``erg/cm3`` volume through the ion density from a unit cell or from the saturation magnetization |
| hard_axis_ratio | dimensionless | ``ratio`` |
| damping | dimensionless, with an optional ``low``..``high`` band | ``dimensionless`` |
| ordering_temperature | K | ``K`` |

Rejection policy (the row, or the whole material, is excluded with the reason recorded): unknown
material or parameter; a missing, non-numeric or non-finite value; a unit or basis not accepted for the
parameter; missing conversion inputs; an unknown provenance class; a measured, computed or derived value
without a well-formed DOI; an assumed value without a written justification; a canonical value outside
its physical range; a band that does not contain its value; a duplicate row; a material missing any
required parameter.

Flag policy (accepted, flag carried into the artifacts and shown by the web): every assumed value; a
damping band wider than a factor of four; a value converted from another unit or basis.
"""

from __future__ import annotations

import csv
import math
import re
from dataclasses import dataclass, field
from pathlib import Path

from spinoct.units import BOHR_MAGNETON_J_PER_T, MEV_IN_JOULE

__all__ = [
    "PROVENANCE_CLASSES",
    "REQUIRED_PARAMETERS",
    "AcceptedValue",
    "ContractReport",
    "MaterialRecord",
    "validate_tables",
]

REQUIRED_PARAMETERS = ("moment", "anisotropy", "hard_axis_ratio", "damping", "ordering_temperature")
PROVENANCE_CLASSES = ("measured", "computed", "derived", "assumed")

#: Physical ranges of the canonical values. Each bound is a plausibility limit for a van der Waals magnet,
#: not a fitted number: a moment above 10 mu_B per ion, an anisotropy above 50 meV per ion, a damping of
#: one or more, or an ordering temperature above 1500 K would indicate a unit or convention error.
_RANGES = {
    "moment": (0.0, 10.0),
    "anisotropy": (0.0, 50.0),
    "hard_axis_ratio": (0.0, 100.0),
    "damping": (0.0, 1.0),
    "ordering_temperature": (0.0, 1500.0),
}
#: A damping band wider than this factor (high / low) is accepted but flagged as weakly constrained.
_WIDE_BAND_FACTOR = 4.0

_ACCEPTED_UNITS = {
    "moment": {("mu_B", "per-ion")},
    "anisotropy": {("meV", "unit-vector"), ("meV", "spin-operator"), ("erg/cm3", "volume")},
    "hard_axis_ratio": {("ratio", "none")},
    "damping": {("dimensionless", "none")},
    "ordering_temperature": {("K", "none")},
}

_DOI = re.compile(r"^10\.\d{4,9}/\S+$")
_COLUMNS = (
    "material", "parameter", "value", "unit", "basis", "spin_length", "ions_per_cell", "cell_volume_nm3",
    "ms_emu_per_cm3", "moment_for_density_bohr", "low", "high", "provenance", "method", "source_doi", "note",
)
_MATERIAL_COLUMNS = ("slug", "name", "family", "spin", "easy_axis", "notes")

#: Unit factors. 1 erg/cm^3 = 0.1 J/m^3; 1 emu/cm^3 = 1000 A/m; 1 nm^3 = 1e-27 m^3.
_ERG_PER_CM3_IN_J_PER_M3 = 0.1
_EMU_PER_CM3_IN_A_PER_M = 1000.0
_NM3_IN_M3 = 1e-27


class RowRejected(ValueError):
    """A row fails the contract; the message is the recorded reason."""


@dataclass(frozen=True)
class AcceptedValue:
    """One accepted, canonical parameter value with its provenance."""

    material: str
    parameter: str
    value: float
    low: float | None
    high: float | None
    provenance: str
    method: str
    sources: tuple[str, ...]
    note: str
    input_value: float
    input_unit: str
    input_basis: str
    flags: tuple[str, ...]

    def describe(self) -> dict[str, object]:
        return {
            "value": self.value,
            "low": self.low,
            "high": self.high,
            "provenance": self.provenance,
            "method": self.method,
            "sources": list(self.sources),
            "note": self.note,
            "input": {"value": self.input_value, "unit": self.input_unit, "basis": self.input_basis},
            "flags": list(self.flags),
        }


@dataclass(frozen=True)
class MaterialRecord:
    """A material that passed the contract: descriptive fields plus one accepted value per parameter."""

    slug: str
    name: str
    family: str
    spin: float
    easy_axis: str
    notes: str
    values: dict[str, AcceptedValue]


@dataclass
class ContractReport:
    """The outcome of validating the tables."""

    materials: dict[str, MaterialRecord] = field(default_factory=dict)
    rejected: list[dict[str, str]] = field(default_factory=list)
    flagged: list[dict[str, str]] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return not self.rejected


def _number(text: str, column: str) -> float:
    if text is None or text.strip() == "":
        raise RowRejected(f"missing {column}")
    try:
        number = float(text)
    except ValueError as exc:
        raise RowRejected(f"{column} {text!r} is not numeric") from exc
    if not math.isfinite(number):
        raise RowRejected(f"{column} is not finite")
    return number


def _optional(text: str, column: str) -> float | None:
    return None if text is None or text.strip() == "" else _number(text, column)


def _canonical(row: dict[str, str], value: float) -> float:
    """Convert a value to the canonical unit, raising a reason when the inputs are incomplete."""
    unit, basis = row["unit"], row["basis"]
    if (unit, basis) in {("mu_B", "per-ion"), ("meV", "unit-vector"), ("ratio", "none"),
                         ("dimensionless", "none"), ("K", "none")}:
        return value
    if (unit, basis) == ("meV", "spin-operator"):
        spin = _optional(row.get("spin_length", ""), "spin_length")
        if spin is None or spin <= 0.0:
            raise RowRejected("spin-operator basis needs a positive spin_length")
        return value * spin**2
    if (unit, basis) == ("erg/cm3", "volume"):
        energy_density = value * _ERG_PER_CM3_IN_J_PER_M3
        ions = _optional(row.get("ions_per_cell", ""), "ions_per_cell")
        volume = _optional(row.get("cell_volume_nm3", ""), "cell_volume_nm3")
        ms = _optional(row.get("ms_emu_per_cm3", ""), "ms_emu_per_cm3")
        moment = _optional(row.get("moment_for_density_bohr", ""), "moment_for_density_bohr")
        if ions is not None and volume is not None and ions > 0.0 and volume > 0.0:
            density = ions / (volume * _NM3_IN_M3)
        elif ms is not None and moment is not None and ms > 0.0 and moment > 0.0:
            density = ms * _EMU_PER_CM3_IN_A_PER_M / (moment * BOHR_MAGNETON_J_PER_T)
        else:
            raise RowRejected(
                "volume basis needs ions_per_cell and cell_volume_nm3, or ms_emu_per_cm3 and "
                "moment_for_density_bohr"
            )
        return energy_density / density / MEV_IN_JOULE
    raise RowRejected(f"unit {unit!r} with basis {basis!r} is not convertible")


def _validate_row(row: dict[str, str], known_materials: set[str]) -> AcceptedValue:
    material, parameter = row.get("material", ""), row.get("parameter", "")
    if material not in known_materials:
        raise RowRejected(f"unknown material {material!r}")
    if parameter not in _ACCEPTED_UNITS:
        raise RowRejected(f"unknown parameter {parameter!r}")
    value = _number(row.get("value", ""), "value")
    unit, basis = row.get("unit", ""), row.get("basis", "")
    if (unit, basis) not in _ACCEPTED_UNITS[parameter]:
        raise RowRejected(f"unit {unit!r} with basis {basis!r} is not accepted for {parameter}")

    provenance = row.get("provenance", "")
    if provenance not in PROVENANCE_CLASSES:
        raise RowRejected(f"unknown provenance {provenance!r}")
    sources = tuple(s.strip() for s in row.get("source_doi", "").split(";") if s.strip())
    for doi in sources:
        if not _DOI.match(doi):
            raise RowRejected(f"malformed DOI {doi!r}")
    note = row.get("note", "").strip()
    if provenance != "assumed" and not sources:
        raise RowRejected(f"a {provenance} value needs a source DOI")
    if provenance == "assumed" and not note:
        raise RowRejected("an assumed value needs a written justification")

    canonical = _canonical(row, value)
    lo, hi = _RANGES[parameter]
    if not lo <= canonical <= hi or (parameter in ("moment", "anisotropy", "damping", "ordering_temperature")
                                     and canonical <= lo):
        raise RowRejected(f"{parameter} {canonical:g} is outside its physical range ({lo:g}, {hi:g}]")

    low = _optional(row.get("low", ""), "low")
    high = _optional(row.get("high", ""), "high")
    scale = canonical / value if value != 0.0 else 1.0
    low = None if low is None else low * scale
    high = None if high is None else high * scale
    if (low is None) != (high is None):
        raise RowRejected("a band needs both low and high")
    if low is not None and not low <= canonical <= high:
        raise RowRejected(f"band {low:g}..{high:g} does not contain the value {canonical:g}")

    flags = []
    if provenance == "assumed":
        flags.append("assumed")
    if (unit, basis) not in {("mu_B", "per-ion"), ("meV", "unit-vector"), ("ratio", "none"),
                             ("dimensionless", "none"), ("K", "none")}:
        flags.append(f"converted from {unit} ({basis})")
    if parameter == "damping" and low is not None and low > 0.0 and high / low > _WIDE_BAND_FACTOR:
        flags.append("wide damping band")

    return AcceptedValue(
        material=material,
        parameter=parameter,
        value=canonical,
        low=low,
        high=high,
        provenance=provenance,
        method=row.get("method", "").strip(),
        sources=sources,
        note=note,
        input_value=value,
        input_unit=unit,
        input_basis=basis,
        flags=tuple(flags),
    )


def validate_tables(materials_csv: Path, parameters_csv: Path) -> ContractReport:
    """Validate the material and parameter tables; return accepted materials, rejections and flags.

    Args:
        materials_csv: one row per material (slug, name, family, spin, easy_axis, notes).
        parameters_csv: one row per parameter value.

    Returns:
        The :class:`ContractReport`. A material appears in ``materials`` only if every required parameter
        was accepted.
    """
    report = ContractReport()
    with materials_csv.open(encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        missing = [c for c in _MATERIAL_COLUMNS if c not in (reader.fieldnames or [])]
        if missing:
            report.rejected.append({"row": "materials header", "reason": f"missing columns {missing}"})
            return report
        descriptors = {}
        for row in reader:
            try:
                spin = _number(row["spin"], "spin")
                if spin <= 0.0:
                    raise RowRejected("spin must be positive")
            except RowRejected as reason:
                report.rejected.append({"row": f"material {row.get('slug')}", "reason": str(reason)})
                continue
            descriptors[row["slug"]] = row | {"spin": spin}

    with parameters_csv.open(encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        missing = [c for c in _COLUMNS if c not in (reader.fieldnames or [])]
        if missing:
            report.rejected.append({"row": "parameters header", "reason": f"missing columns {missing}"})
            return report
        accepted: dict[str, dict[str, AcceptedValue]] = {}
        for number, row in enumerate(reader, start=2):
            label = f"line {number} ({row.get('material')}, {row.get('parameter')})"
            try:
                item = _validate_row(row, set(descriptors))
                if item.parameter in accepted.get(item.material, {}):
                    raise RowRejected("duplicate row for this material and parameter")
            except RowRejected as reason:
                report.rejected.append({"row": label, "reason": str(reason)})
                continue
            accepted.setdefault(item.material, {})[item.parameter] = item
            for flag in item.flags:
                report.flagged.append({"row": label, "flag": flag})

    for slug, row in descriptors.items():
        values = accepted.get(slug, {})
        absent = [p for p in REQUIRED_PARAMETERS if p not in values]
        if absent:
            report.rejected.append({"row": f"material {slug}", "reason": f"missing required parameters {absent}"})
            continue
        report.materials[slug] = MaterialRecord(
            slug=slug,
            name=row["name"],
            family=row["family"],
            spin=row["spin"],
            easy_axis=row["easy_axis"],
            notes=row["notes"],
            values=values,
        )
    return report

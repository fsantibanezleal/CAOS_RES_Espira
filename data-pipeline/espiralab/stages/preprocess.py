"""Stage ``preprocess``: turn accepted, canonical contract values into the engine-facing material records.

Input: a :class:`espiralab.io.ContractReport`.
Output: ``dict[slug, MaterialParameters]``, each value in the engine's canonical unit with its provenance.

The canonical bake is strict: any rejected row is an error, because a silently dropped material or value
would ship an incomplete matrix.
"""

from __future__ import annotations

from ..io import ContractReport
from ..materials.model import MaterialParameters

__all__ = ["ContractViolation", "preprocess"]


class ContractViolation(RuntimeError):
    """The tables did not pass Contract 1; the message lists every rejection."""


def preprocess(report: ContractReport, strict: bool = True) -> dict[str, MaterialParameters]:
    """Build the material records.

    Args:
        report: the ingest report.
        strict: raise on any rejection (the canonical bake); otherwise keep only accepted materials.

    Returns:
        The material records by slug, in table order.
    """
    if strict and not report.ok:
        lines = "\n".join(f"  {r['row']}: {r['reason']}" for r in report.rejected)
        raise ContractViolation(f"Contract 1 rejected {len(report.rejected)} row(s):\n{lines}")
    records = {}
    for slug, record in report.materials.items():
        v = record.values
        damping = v["damping"]
        records[slug] = MaterialParameters(
            slug=slug,
            name=record.name,
            family=record.family,
            spin=record.spin,
            moment_bohr=v["moment"].value,
            anisotropy_mev=v["anisotropy"].value,
            hard_axis_ratio=v["hard_axis_ratio"].value,
            damping=damping.value,
            damping_low=damping.low if damping.low is not None else damping.value,
            damping_high=damping.high if damping.high is not None else damping.value,
            curie_kelvin=v["ordering_temperature"].value,
            easy_axis=record.easy_axis,
            notes=record.notes,
            sources=sorted({doi for value in v.values() for doi in value.sources}),
            provenance={name: value.describe() for name, value in v.items()},
        )
    return records

"""Stage ``dataset``: the split assignment and the matrix of cells the release must contain.

Input: the case registry. Output: which materials train and which are held out, and the full
method x case x variant plan. Nothing is computed here; this stage fixes what "complete" means, so a
missing cell later is a failure rather than a silently shorter average.
"""

from __future__ import annotations

from dataclasses import dataclass

from ..cases import CASES, baked_cases

__all__ = ["Plan", "PlannedCell", "plan_matrix", "splits"]


@dataclass(frozen=True)
class PlannedCell:
    """One declared cell of the matrix."""

    case: str
    method: str
    variant: float


@dataclass(frozen=True)
class Plan:
    """What a complete release contains."""

    cells: tuple[PlannedCell, ...]
    train_materials: tuple[str, ...]
    test_materials: tuple[str, ...]

    @property
    def expected(self) -> int:
        return len(self.cells)


def splits() -> dict[str, tuple[str, ...]]:
    """The materials in each split, from the registry (a material is never in two of them)."""
    out: dict[str, set[str]] = {"train": set(), "test": set(), "control": set()}
    for case in CASES.values():
        if case.material:
            out[case.split].add(case.material)
    return {name: tuple(sorted(values)) for name, values in out.items()}


def plan_matrix(surface: str | None = "workbench") -> Plan:
    """The declared method x case x variant cells for the baked cases."""
    cells = [
        PlannedCell(case.slug, method, variant)
        for case in baked_cases(surface).values()
        for method in case.methods
        for variant in case.axis.values
    ]
    by_split = splits()
    return Plan(tuple(cells), by_split["train"], by_split["test"])

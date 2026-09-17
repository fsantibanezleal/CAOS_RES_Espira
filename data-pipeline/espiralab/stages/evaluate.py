"""Stage ``evaluate``: score every method against the oracle and count the matrix.

Where a closed form exists it is the reference: a numerical method is scored by its ratio to the analytic
optimum, which is one when it matches and above one when it is worse. Where none exists (a hard axis) the
reference is the uniaxial optimum of the same system, so the number answers "what did the mechanism buy".
The completeness count is part of the score: a method that ran on four of six variants has not been
evaluated, it has been sampled.
"""

from __future__ import annotations

from dataclasses import dataclass

from ..cases import Case
from ..core.manifest import MethodResult

__all__ = ["CaseScore", "MethodScore", "evaluate_case"]


@dataclass(frozen=True)
class MethodScore:
    """One method's summary over a case's variants."""

    method: str
    cells: int
    produced: int
    not_applicable: int
    switched: int
    best_cost: float | None
    worst_ratio_to_oracle: float | None
    notes: str = ""

    def describe(self) -> dict[str, object]:
        return {
            "method": self.method,
            "cells": self.cells,
            "produced": self.produced,
            "not_applicable": self.not_applicable,
            "switched": self.switched,
            "best_cost": self.best_cost,
            "worst_ratio_to_oracle": self.worst_ratio_to_oracle,
            "notes": self.notes,
        }


@dataclass(frozen=True)
class CaseScore:
    """Every method's summary for one case, plus the completeness of its matrix."""

    case: str
    methods: tuple[MethodScore, ...]
    complete: bool

    def describe(self) -> dict[str, object]:
        return {
            "case": self.case,
            "methods": [m.describe() for m in self.methods],
            "complete": self.complete,
        }


def _oracle_by_variant(results: tuple[MethodResult, ...]) -> dict[float, float]:
    """The analytic cost per variant, when the case has one."""
    return {r.variant: r.cost for r in results if r.method == "R05" and r.cost is not None}


def evaluate_case(case: Case, results: tuple[MethodResult, ...]) -> CaseScore:
    """Score one case's results."""
    oracle = _oracle_by_variant(results)
    scores = []
    for method in case.methods:
        rows = [r for r in results if r.method == method]
        produced = [r for r in rows if r.applicable and (r.cost is not None or r.metrics)]
        costs = [r.cost for r in rows if r.cost is not None]
        ratios = [
            r.cost / oracle[r.variant]
            for r in rows
            if r.cost is not None and oracle.get(r.variant)
        ]
        notes = ""
        if method == "R06":
            notes = "current cost in reduced units; not comparable with a field cost"
        elif method == "R07" and case.axis.name == "hard_axis_ratio":
            notes = "scored against the uniaxial optimum of the same system"
        scores.append(
            MethodScore(
                method=method,
                cells=len(rows),
                produced=len(produced),
                not_applicable=sum(1 for r in rows if not r.applicable),
                switched=sum(1 for r in rows if r.switched),
                best_cost=min(costs) if costs else None,
                worst_ratio_to_oracle=max(ratios) if ratios else None,
                notes=notes,
            )
        )
    complete = all(s.produced + s.not_applicable == s.cells for s in scores)
    return CaseScore(case.slug, tuple(scores), complete)

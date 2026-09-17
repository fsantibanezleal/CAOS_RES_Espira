"""The case model: what a case declares before anything is computed.

A case is a scientific question with a pre-declared answer shape. It names the system it runs on (a
material, or a synthetic reference system for the analytic controls), the family of variants it sweeps,
the seed that makes it reproducible, the split it belongs to (so a learned method cannot train on its own
test set), what a domain expert should see, and the kill criterion that would make it a failure. It also
carries an honest status: a case that is declared but not yet computed says so, with the reason.
"""

from __future__ import annotations

from dataclasses import dataclass, field

__all__ = [
    "Case",
    "FIELD_COST",
    "Observable",
    "SyntheticSystem",
    "VariantAxis",
    "GROUND_TRUTH",
    "SPLITS",
    "STATUSES",
    "SURFACES",
]

#: A case is computed and shipped (`baked`), declared and runnable but not yet baked (`planned`), or
#: blocked by something outside the repository (`blocked`, which must carry a reason).
STATUSES = ("baked", "planned", "blocked")
#: Where a baked case is shown: the single-case workbench, or the cross-case Experiments page.
SURFACES = ("workbench", "experiments")
#: Leakage control: the amortized policy trains on `train` materials and is scored on `test`; `control`
#: cases are oracles or negative controls and never train anything.
SPLITS = ("train", "test", "control")
#: What the case can be checked against.
GROUND_TRUTH = ("analytic", "published", "provisional")


@dataclass(frozen=True)
class VariantAxis:
    """The physical family a case sweeps, and its values.

    Attributes:
        name: the machine name of the swept quantity.
        label: how it is shown.
        unit: the unit of the values.
        values: the swept values, at least six when the family is physical.
    """

    name: str
    label: str
    unit: str
    values: tuple[float, ...]


@dataclass(frozen=True)
class Observable:
    """The quantity a case actually reports, with its unit.

    Most cases report the field switching cost in T^2 s, and the product is built around it. Two do not:
    the spin-orbit-torque oracle reports a current integral in the reference's reduced units, and the
    thermal case reports a success rate. Mixing those into a field-cost axis would be the units failure
    the conventions guard against, so a case declares what it measures and the app reads the declaration
    rather than assuming.

    Attributes:
        key: the field of each cost-curve row that carries the value.
        label: how the quantity is named in the app.
        unit: its unit, as shown.
        is_field_cost: whether it is a field cost in T^2 s, comparable with the floor and the free cost.
        note: why this case reports this quantity and not a field cost.
    """

    key: str
    label: str
    unit: str
    is_field_cost: bool = True
    note: str = ""


#: The default: the field switching cost the rest of the product is scored in.
FIELD_COST = Observable(
    key="cost",
    label="Switching cost",
    unit="T^2 s",
    is_field_cost=True,
    note="The field cost integral, comparable with the universal floor and the free-macrospin cost.",
)


@dataclass(frozen=True)
class SyntheticSystem:
    """A reference macrospin used by the analytic control cases, which pin no material.

    The values are a deliberate, dimensionless-friendly reference (a three Bohr magneton moment and a
    0.15 meV anisotropy, the CrSBr-like scale), because these cases test the mathematics, not a material.
    """

    moment_bohr: float = 3.0
    anisotropy_mev: float = 0.15
    damping: float = 0.1
    hard_axis_ratio: float = 0.0


@dataclass(frozen=True)
class Case:
    """One entry in the coverage matrix."""

    slug: str
    code: str
    title: str
    category: str
    reason: str
    expectation: str
    kill_criterion: str
    axis: VariantAxis
    status: str
    ground_truth: str
    split: str
    seed: int = 0
    surface: str = "workbench"
    primary_method: str = "R05"
    observable: Observable = FIELD_COST
    material: str | None = None
    synthetic: SyntheticSystem | None = None
    includes_biaxial: bool = False
    blocked_reason: str = ""
    methods: tuple[str, ...] = ()
    sources: tuple[str, ...] = ()
    tags: list[str] = field(default_factory=list)

    @property
    def switching_times_tau0(self) -> tuple[float, ...]:
        """The switching-time sweep, when that is the case's variant family."""
        if self.axis.name != "switching_time":
            raise AttributeError(f"case {self.slug!r} sweeps {self.axis.name!r}, not switching_time")
        return self.axis.values

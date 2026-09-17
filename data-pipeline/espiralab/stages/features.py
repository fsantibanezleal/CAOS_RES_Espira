"""Stage ``features``: the dimensionless coordinates a case occupies.

The optimal control problem depends on the material only through a few dimensionless numbers: the
damping, the switching time in units of the Larmor timescale, and the hard-axis ratio. Everything else
is a scale. These are the features the learned policy consumes and the screening ranks, and computing
them in one place keeps the policy and the screening from drifting apart.
"""

from __future__ import annotations

import math
from dataclasses import dataclass

from ..cases import Case
from ..materials import get_material

__all__ = ["Features", "features_for"]


@dataclass(frozen=True)
class Features:
    """The dimensionless coordinates of one case variant."""

    case: str
    variant: float
    alpha: float
    log_time_over_tau0: float
    hard_axis_ratio: float
    anisotropy_mev: float
    moment_bohr: float

    def vector(self) -> tuple[float, float, float]:
        """The three coordinates the policy sees."""
        return (self.alpha, self.log_time_over_tau0, self.hard_axis_ratio)


def features_for(case: Case, variant: float, switching_time_tau0: float) -> Features:
    """The features of one case variant."""
    if case.material is not None:
        material = get_material(case.material)
        alpha, ratio = material.damping, material.hard_axis_ratio
        anisotropy, moment = material.anisotropy_mev, material.moment_bohr
    else:
        s = case.synthetic
        alpha, ratio = s.damping, s.hard_axis_ratio
        anisotropy, moment = s.anisotropy_mev, s.moment_bohr
    if case.axis.name == "hard_axis_ratio":
        ratio = variant
    return Features(
        case=case.slug,
        variant=variant,
        alpha=alpha,
        log_time_over_tau0=math.log(switching_time_tau0),
        hard_axis_ratio=ratio,
        anisotropy_mev=anisotropy,
        moment_bohr=moment,
    )

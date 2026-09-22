"""Does the instability penalty predict the ensemble? (backlog BL-020)

The engine's `instability_penalty` is the hyperbolicity integral along a path, the extra objective term
of the instability-penalized optimal control path. It is cheap: it comes from the same Hessian the
solver already has, and it needs no stochastic ensemble. The engine's own docstring states the claim it
is worth having, and states it as a claim: that sweeping the penalty predicts the Monte-Carlo success
rate without running the ensemble.

Nothing in the product had tested it. This does, on the grid where it can fail: a sweep of the
longitudinal field, which is what removes the hyperbolicity, against a sweep of the thermal stability
factor, which is what makes the failure visible. For each cell both quantities are computed, the
deterministic penalty and the measured success rate over an ensemble, and the two are compared.

A prediction that only holds where nothing fails is not a prediction, so the grid reaches down to a
stability factor of one, where about a quarter of the copies miss.
"""

from __future__ import annotations

import numpy as np

from ..materials import get_material

__all__ = ["PENALTY_SCHEMA", "BR_RATIOS", "STABILITY_FACTORS", "bake_penalty_test"]

PENALTY_SCHEMA = "espira.penalty-test/1"

#: Longitudinal field in units of the anisotropy field. The penalty falls to exactly zero at one, so the
#: sweep is dense below it: that is where the predictor varies and where it can be caught being wrong.
BR_RATIOS = (0.0, 0.25, 0.5, 0.75, 1.0)
#: Thermal stability factor K / kT. One is the regime where the bare pulse already loses a quarter of
#: the copies; twenty is where it loses none, and the predictor cannot be tested at all.
STABILITY_FACTORS = (1.0, 2.0, 3.0, 5.0, 10.0, 20.0)
#: The ensemble per cell. 1,000 copies give a 95 per cent interval of about 3 points at a rate of 0.9.
_COPIES = 1000
_STEPS = 600
_SWITCHING_TAU0 = 10.0
_MATERIAL = "crsbr"


def _spearman(x: list[float], y: list[float]) -> float:
    """Rank correlation, which is what a monotone prediction claims, without assuming a shape."""
    from scipy.stats import spearmanr

    if len({*x}) < 2 or len({*y}) < 2:
        return float("nan")
    return float(spearmanr(x, y).statistic)


def bake_penalty_test() -> dict:
    """Penalty against measured success over the field and stability grid."""
    from spinoct.analytic.uniaxial import UniaxialOptimalControl, cost_infinite_time
    from spinoct.dynamics.system import MacrospinSystem
    from spinoct.thermal import br_cost_reliability_front, instability_penalty
    from spinoct.units import BOLTZMANN_J_PER_K

    material = get_material(_MATERIAL)
    system = MacrospinSystem(
        mu=material.moment_j_per_t, anisotropy_j=material.anisotropy_j, alpha=material.damping
    )
    switching_time = system.switching_time_from_tau0(_SWITCHING_TAU0)
    optimal = UniaxialOptimalControl.for_switching_time(system, switching_time)
    times = np.linspace(0.0, switching_time, _STEPS + 1)
    theta = optimal.polar_angle(times)
    floor = cost_infinite_time(system)

    # Through the engine's own front rather than a field written here: the two have to mean the same
    # thing by B_r, and when this bake built its own field it could differ from the analysis in sign,
    # which is the defect this test found in spinoct 0.17.000.
    cells = []
    for stability in STABILITY_FACTORS:
        temperature = system.anisotropy_j / (BOLTZMANN_J_PER_K * stability)
        front = br_cost_reliability_front(
            system,
            switching_time,
            temperature,
            br_over_anisotropy=BR_RATIOS,
            n_copies=_COPIES,
            n_steps=_STEPS,
            seed=int(1000 + 10 * stability),
        )
        for point in front:
            penalty = instability_penalty(theta, times, system, point.longitudinal_field)
            cells.append(
                {
                    "br_over_anisotropy": float(point.longitudinal_field_over_anisotropy),
                    "stability_factor": float(stability),
                    "penalty_over_floor": float(penalty / floor),
                    "hyperbolic_fraction": float(point.hyperbolic_fraction),
                    "added_cost_over_floor": float(point.added_cost / floor),
                    "success_rate": float(point.success_rate),
                    "confidence95": float(point.confidence95),
                    "failure_rate": float(1.0 - point.success_rate),
                }
            )

    within = []
    for stability in STABILITY_FACTORS:
        row = [c for c in cells if c["stability_factor"] == stability]
        within.append(
            {
                "stability_factor": float(stability),
                "spearman_penalty_failure": _spearman(
                    [c["penalty_over_floor"] for c in row], [c["failure_rate"] for c in row]
                ),
                # The other predictor in the same module, and the one that turns out to rank the sweep:
                # the fraction of the path that is unstable, rather than the integral of how unstable.
                "spearman_fraction_failure": _spearman(
                    [c["hyperbolic_fraction"] for c in row], [c["failure_rate"] for c in row]
                ),
                "failure_monotone_in_field": bool(
                    [c["failure_rate"] for c in sorted(row, key=lambda c: c["br_over_anisotropy"])]
                    == sorted((c["failure_rate"] for c in row), reverse=True)
                ),
                "failure_at_zero_field": next(c["failure_rate"] for c in row if c["br_over_anisotropy"] == 0.0),
                "failure_at_full_field": next(c["failure_rate"] for c in row if c["br_over_anisotropy"] == 1.0),
                "separated": None,
            }
        )
    for row, stability in zip(within, STABILITY_FACTORS, strict=True):
        cell_zero = next(
            c for c in cells if c["stability_factor"] == stability and c["br_over_anisotropy"] == 0.0
        )
        cell_full = next(
            c for c in cells if c["stability_factor"] == stability and c["br_over_anisotropy"] == 1.0
        )
        # Only a difference larger than both intervals is evidence either way.
        gap = cell_zero["failure_rate"] - cell_full["failure_rate"]
        row["separated"] = bool(abs(gap) > cell_zero["confidence95"] + cell_full["confidence95"])
        row["gap"] = float(gap)

    testable = [r for r in within if r["separated"]]
    agreeing = [r for r in testable if r["gap"] > 0.0]
    return {
        "schema": PENALTY_SCHEMA,
        "material": material.name,
        "switching_time_tau0": _SWITCHING_TAU0,
        "copies": _COPIES,
        "description": (
            "The deterministic instability penalty against the measured Monte-Carlo success rate, over a "
            "longitudinal-field sweep (which removes the hyperbolicity the penalty integrates) and a "
            "thermal-stability sweep (which decides whether any copy fails at all). The claim under test, "
            "stated by the engine itself, is that the penalty predicts the success rate without an "
            "ensemble."
        ),
        "axes": {"br_over_anisotropy": list(BR_RATIOS), "stability_factor": list(STABILITY_FACTORS)},
        "cells": cells,
        "per_stability": within,
        "verdict": {
            "testable_rows": len(testable),
            "rows_agreeing": len(agreeing),
            "rows": len(within),
            # Which of the two deterministic predictors actually ranks the sweep. The integral weights
            # how unstable the path is, and that peaks at a quarter of an anisotropy field, where the
            # measured failure rate has already fallen; the fraction of the path that is unstable falls
            # monotonically with the field, like the failures.
            "rows_ranked_by_penalty": sum(1 for r in within if r["spearman_penalty_failure"] > 0.99),
            "rows_ranked_by_fraction": sum(1 for r in within if r["spearman_fraction_failure"] > 0.99),
            "rows_failing_monotonically": sum(1 for r in within if r["failure_monotone_in_field"]),
        },
    }

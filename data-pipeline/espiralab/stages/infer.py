"""Stage ``infer``: run every method a case declares, over every variant, into one result schema.

A method that a case declares must produce a row for every variant, or say why it cannot. The rows share
one shape (cost, whether the moment reversed, and the method's own metrics), so `evaluate` can compare
methods without knowing which engine produced them.

Methods implemented here:

| Rung | What runs |
|---|---|
| R00 | the conventional static antiparallel field, the baseline the reduction factor is quoted against |
| R05 | the closed-form uniaxial optimal control path |
| R06 | the closed-form spin-orbit-torque optimal protocol |
| R07 | the numerical image-based optimal control path (the only one that sees a hard axis) |
| R08 | GRAPE under an amplitude cap, the constraint a driver actually has |
| R09 | CRAB, band-limited to a few harmonics, the pulse an antenna can emit |
| R11 | the finite-temperature success rate of a pulse, over a stochastic ensemble |
| R12 | the same pulse with a longitudinal field, the reliability bought and its added cost |
| R13 | the joint field-plus-current optimum under a two-term cost |
| R15 | the amortized policy, emitting a pulse with no optimization at inference |

Where a case sweeps a control parameter (harmonics, an amplitude cap, the price of current, the damping),
the variant sets that parameter and the switching time is held at the case's fixed time.

A method a case declares but this stage does not implement raises rather than silently skipping: a
missing cell must be a failure, not an absence.
"""

from __future__ import annotations

import time
from dataclasses import dataclass

import numpy as np
from spinoct.amortized import evaluate_policy
from spinoct.analytic import UniaxialOptimalControl, cost_free_macrospin, cost_infinite_time
from spinoct.analytic.sot import SOTOptimalControl, ideal_sot_ratio_beta
from spinoct.control import ConstantFieldProtocol, static_switching_field
from spinoct.control.constrained import CRABSolver, GRAPESolver
from spinoct.control.hybrid import HybridSolver
from spinoct.dynamics import MacrospinSystem
from spinoct.numeric import ImageOCPSolver
from spinoct.thermal import br_cost_reliability_front, switching_success_rate
from spinoct.units import BOLTZMANN_J_PER_K

from ..cases import Case
from ..core.manifest import MethodResult

__all__ = ["IMPLEMENTED_METHODS", "InferenceRun", "infer_case"]

IMPLEMENTED_METHODS = ("R00", "R05", "R06", "R07", "R08", "R09", "R11", "R12", "R13", "R15")

#: Seeds and iteration cap for the numerical solver in the release bake. The image count comes from the
#: engine's resolution rule, which scales with the switching time.
_SEEDS = 3
_MAX_ITERATIONS = 2500
#: The spin-orbit-torque coupling magnitude of the reference protocol, in the source's reduced units.
_SOT_COUPLING = 1.0
#: Integration steps for the static-field baseline.
_BASELINE_STEPS = 4001
#: Budgets for the constrained and hybrid solvers, and the CRAB bandwidth when a case does not sweep it.
_GRAPE_SLICES = 24
_CRAB_HARMONICS = 6
_CONSTRAINED_ITERATIONS = 400
_HYBRID_ITERATIONS = 200
#: The stochastic ensemble: copies per point and integration steps, and the longitudinal field the
#: reliability rung adds, in units of the anisotropy field. 600 copies give a 95 per cent interval
#: of about 0.04 at a success rate of one half, which resolves the differences this case reports.
_ENSEMBLE_COPIES = 600
_ENSEMBLE_STEPS = 900
_RELIABILITY_BR_OVER_ANISOTROPY = 2.0
#: The stability factor a case that does not sweep it is measured at (memory-grade retention).
_STABILITY_FACTOR = 40.0


@dataclass(frozen=True)
class InferenceRun:
    """Every result row of a case, with the wall time the whole case took."""

    case: str
    results: tuple[MethodResult, ...]
    runtime_ms: float


class MethodNotImplemented(RuntimeError):
    """A case declares a method this stage cannot run; a missing cell is never silent."""


def _system(case: Case, variant: float, uniaxial: bool = True):
    from ..bake import _system as bake_system  # one definition of the case's system

    return bake_system(case, variant, uniaxial=uniaxial)


def _path_signature(images: np.ndarray) -> dict[str, float]:
    """Numbers that tell two optimal paths apart, for the case whose subject is the search.

    Two converged paths with different costs are different objects, and the cost alone does not say how.
    The azimuth at the midpoint says which way round the sphere the moment went, and the largest
    transverse excursions say whether it crossed the hard axis or stayed near the easy plane.
    """
    azimuth = np.degrees(np.arctan2(images[:, 1], images[:, 0]))
    winding = np.unwrap(np.radians(azimuth))
    return {
        "mid_azimuth_deg": float(azimuth[len(azimuth) // 2]),
        "max_abs_sx": float(np.abs(images[:, 0]).max()),
        "max_abs_sy": float(np.abs(images[:, 1]).max()),
        "winding_turns": float((winding[-1] - winding[0]) / (2.0 * np.pi)),
    }


def _run_method(case: Case, method: str, variant: float, t_tau0: float) -> MethodResult:
    system = _system(case, variant, uniaxial=True)
    switching_time = system.switching_time_from_tau0(t_tau0)

    if method == "R05":
        optimal = UniaxialOptimalControl.for_switching_time(system, switching_time)
        return MethodResult(
            method=method,
            variant=variant,
            cost=optimal.cost(),
            switched=True,
            metrics={
                "cost_over_free": optimal.cost() / cost_free_macrospin(switching_time, system.alpha, system.gamma),
                "cost_over_floor": optimal.cost() / cost_infinite_time(system),
                "mean_amplitude_t": optimal.mean_amplitude(),
                "peak_amplitude_t": float(max(abs(optimal.field_amplitude(t)) for t in (0.0, switching_time / 2))),
            },
        )

    if method == "R00":
        protocol = ConstantFieldProtocol(system, amplitude=1.2 * static_switching_field(system))
        result = protocol.run(switching_time, n_steps=_BASELINE_STEPS)
        optimal = UniaxialOptimalControl.for_switching_time(system, switching_time)
        return MethodResult(
            method=method,
            variant=variant,
            cost=result.cost,
            switched=bool(result.switched),
            metrics={
                "over_optimal": result.cost / optimal.cost() if optimal.cost() > 0 else float("inf"),
                "amplitude_t": 1.2 * static_switching_field(system),
            },
        )

    if method == "R06":
        # The closed-form spin-orbit-torque protocol, at the ideal field-like to damping-like balance.
        # Its cost is a current integral in the reference's reduced units, not a field cost in T^2 s, so
        # it is reported in its own units and never mixed into a field cost comparison.
        protocol = SOTOptimalControl(
            system=system,
            switching_time=switching_time,
            xi=_SOT_COUPLING,
            beta=ideal_sot_ratio_beta(system.alpha),
        )
        return MethodResult(
            method=method,
            variant=variant,
            cost=None,
            switched=not protocol.is_forbidden(),
            applicable=True,
            reason="current cost in reduced units; not comparable with a field cost in T^2 s",
            metrics={
                "cost_fast_reduced": protocol.cost_fast(),
                "mean_current_reduced": protocol.mean_current(),
                "characteristic_time_s": protocol.characteristic_time_ideal(),
                "forbidden_ratio": float(protocol.is_forbidden()),
            },
        )

    if method == "R07":
        biaxial = _system(case, variant, uniaxial=False)
        started = time.perf_counter()
        images = ImageOCPSolver.recommended_images(biaxial, switching_time)
        solver = ImageOCPSolver(biaxial, n_images=images, switching_time=switching_time)
        if case.axis.name == "seed":
            # The case whose subject IS the search: one variant is one seed, solved alone, so the
            # spread across seeds is visible instead of being collapsed by the multi-seed sweep.
            result = solver.solve(seed=int(variant), max_iterations=_MAX_ITERATIONS)
        else:
            result = solver.solve_best(n_seeds=_SEEDS, max_iterations=_MAX_ITERATIONS)
        uniaxial = UniaxialOptimalControl.for_switching_time(system, switching_time)
        metrics = {
            "over_analytic": result.cost / uniaxial.cost() if uniaxial.cost() > 0 else float("inf"),
            "converged": float(result.converged),
            "images": float(images),
            "solve_ms": (time.perf_counter() - started) * 1e3,
        }
        if case.axis.name == "seed":
            metrics.update(_path_signature(result.images))
            metrics["iterations"] = float(result.iterations)
        return MethodResult(method=method, variant=variant, cost=result.cost, switched=True, metrics=metrics)

    if method in ("R11", "R12"):
        # The stability factor K/kT is the case's variant; the temperature follows from it, which keeps
        # the case dimensionless and comparable across materials.
        stability = variant if case.axis.name == "stability_factor" else _STABILITY_FACTOR
        temperature = system.anisotropy_j / (BOLTZMANN_J_PER_K * stability)
        optimal = UniaxialOptimalControl.for_switching_time(system, switching_time)
        if method == "R11":
            ensemble = switching_success_rate(
                system,
                lambda t: optimal.field_vector(np.array([t]))[0],
                switching_time,
                temperature,
                n_copies=_ENSEMBLE_COPIES,
                n_steps=_ENSEMBLE_STEPS,
                seed=case.seed,
            )
            return MethodResult(
                method=method,
                variant=variant,
                cost=optimal.cost(),
                switched=ensemble.success_rate >= 0.5,
                reason="" if ensemble.success_rate >= 0.5 else "the ensemble reversed less than half the time",
                metrics={
                    "success_rate": ensemble.success_rate,
                    "confidence95": ensemble.confidence95,
                    "final_sz_mean": ensemble.final_sz_mean,
                    "temperature_k": temperature,
                    "stability_factor": stability,
                    "n_copies": float(ensemble.n_copies),
                },
            )
        # R12: the same pulse plus a longitudinal field, the reliability it buys and what it charges.
        front = br_cost_reliability_front(
            system,
            switching_time,
            temperature,
            br_over_anisotropy=(_RELIABILITY_BR_OVER_ANISOTROPY,),
            n_copies=_ENSEMBLE_COPIES,
            n_steps=_ENSEMBLE_STEPS,
            seed=case.seed,
        )[0]
        return MethodResult(
            method=method,
            variant=variant,
            cost=optimal.cost() + front.added_cost,
            switched=front.success_rate >= 0.5,
            reason="" if front.success_rate >= 0.5 else "the ensemble reversed less than half the time",
            metrics={
                "success_rate": front.success_rate,
                "confidence95": front.confidence95,
                "added_cost": front.added_cost,
                "added_cost_over_optimal": front.added_cost / optimal.cost() if optimal.cost() > 0 else float("inf"),
                "longitudinal_field_over_anisotropy": front.longitudinal_field_over_anisotropy,
                "hyperbolic_fraction": front.hyperbolic_fraction,
                "temperature_k": temperature,
                "stability_factor": stability,
            },
        )


    if method == "R08":
        # The amplitude cap is the case's variant, in units of the anisotropy field.
        cap = variant * system.anisotropy_field if case.axis.name == "amplitude_cap" else None
        result = GRAPESolver(
            system, switching_time, n_slices=_GRAPE_SLICES, amplitude_cap=cap
        ).solve(max_iterations=_CONSTRAINED_ITERATIONS)
        optimal = UniaxialOptimalControl.for_switching_time(system, switching_time)
        return MethodResult(
            method=method,
            variant=variant,
            cost=result.cost if result.switched else None,
            switched=bool(result.switched),
            reason="" if result.switched else "no reversal under this amplitude cap",
            metrics={
                "over_analytic": result.cost / optimal.cost() if result.switched else float("inf"),
                "peak_amplitude_t": result.peak_amplitude,
                "infidelity": result.infidelity,
                "cap_over_anisotropy_field": variant if cap is not None else float("nan"),
            },
        )

    if method == "R09":
        harmonics = int(variant) if case.axis.name == "harmonics" else _CRAB_HARMONICS
        result = CRABSolver(system, switching_time, n_harmonics=harmonics).solve(
            max_iterations=_CONSTRAINED_ITERATIONS
        )
        optimal = UniaxialOptimalControl.for_switching_time(system, switching_time)
        return MethodResult(
            method=method,
            variant=variant,
            cost=result.cost if result.switched else None,
            switched=bool(result.switched),
            reason="" if result.switched else "no reversal at this bandwidth",
            metrics={
                "over_analytic": result.cost / optimal.cost() if result.switched else float("inf"),
                "harmonics": float(harmonics),
                "peak_amplitude_t": result.peak_amplitude,
                "infidelity": result.infidelity,
            },
        )

    if method == "R13":
        price = variant if case.axis.name == "current_price" else 1.0
        result = HybridSolver(
            system, switching_time, circuit_field=1.0, circuit_current=price
        ).solve(max_iterations=_HYBRID_ITERATIONS)
        return MethodResult(
            method=method,
            variant=variant,
            cost=result.field_cost if result.switched else None,
            switched=bool(result.switched),
            reason="" if result.switched else "the co-optimization did not reverse the moment",
            metrics={
                "weighted_cost": result.weighted_cost,
                "current_cost_reduced": result.current_cost,
                "field_fraction": result.field_fraction,
                "current_price": price,
            },
        )

    if method == "R15":
        from ..stages.train import load_or_train_policy

        policy = load_or_train_policy()
        alpha = variant if case.axis.name == "damping" else system.alpha
        scored = MacrospinSystem(
            mu=system.mu, anisotropy_j=system.anisotropy_j, alpha=alpha, gamma=system.gamma
        )
        evaluation = evaluate_policy(policy, scored, scored.switching_time_from_tau0(t_tau0))
        return MethodResult(
            method=method,
            variant=variant,
            cost=evaluation.cost if evaluation.switched else None,
            switched=bool(evaluation.switched),
            reason="" if evaluation.switched else "the emitted pulse did not reverse the moment",
            metrics={
                "cost_ratio_to_analytic": evaluation.cost_ratio,
                "predicted_p": evaluation.predicted_p,
                "true_p": evaluation.true_p,
                "damping": alpha,
            },
        )

    raise MethodNotImplemented(
        f"case {case.slug!r} declares method {method!r}, which stage infer does not implement"
    )


def infer_case(case: Case) -> InferenceRun:
    """Run every declared method over every variant of one case."""
    from ..bake import _time_for

    started = time.perf_counter()
    rows: list[MethodResult] = []
    for method in case.methods:
        for variant in case.axis.values:
            t_tau0 = _time_for(case, variant)
            if method == "R06" and case.material is not None:
                rows.append(
                    MethodResult(
                        method=method,
                        variant=variant,
                        cost=None,
                        switched=False,
                        applicable=False,
                        reason="no measured spin-orbit-torque couplings for this material",
                    )
                )
                continue
            rows.append(_run_method(case, method, variant, t_tau0))
    return InferenceRun(case.slug, tuple(rows), (time.perf_counter() - started) * 1e3)

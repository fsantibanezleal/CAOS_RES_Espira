"""Stage ``infer``: run every method a case declares, over every variant, into one result schema.

A method that a case declares must produce a row for every variant, or say why it cannot. The rows share
one shape (cost, whether the moment reversed, and the method's own metrics), so `evaluate` can compare
methods without knowing which engine produced them.

Methods implemented here:

| Rung | What runs |
|---|---|
| R00 | the conventional static antiparallel field, the baseline the reduction factor is quoted against |
| R05 | the closed-form uniaxial optimal control path |
| R04 | the source's simplified chirped rotating current, its switching probability at temperature |
| R06 | the closed-form spin-orbit-torque optimal protocol |
| R07 | the numerical image-based optimal control path (the only one that sees a hard axis) |
| R08 | GRAPE under an amplitude cap, the constraint a driver actually has |
| R09 | CRAB, band-limited to a few harmonics, the pulse an antenna can emit |
| R11 | the finite-temperature success rate of a pulse, over a stochastic ensemble |
| R12 | the same pulse with a longitudinal field, the reliability bought and its added cost |
| R13 | the joint field-plus-current optimum under a two-term cost |
| R15 | the amortized policy, emitting a pulse with no optimization at inference |
| R16 | the chain's minimum-energy-path barrier, against the continuum wall energy |

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

IMPLEMENTED_METHODS = ("R00", "R04", "R05", "R06", "R07", "R08", "R09", "R11", "R12", "R13", "R15", "R16")

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


#: The kickoff paper's own peak optimal fields for monolayer CrSBr, in tesla, keyed by the switching
#: time in picoseconds, read from the full text (Badarneh, Cai, Santos, Advanced Materials 2026,
#: 10.1002/adma.202523059, sections 2.1 and 2.2). The conventional static antiparallel field it reports
#: at the same switching time is carried beside each one where the paper gives it.
#:
#: The source quotes two different values for the same point: section 2.1 says the optimal protocol
#: reaches 126 ps "with a field of an order of magnitude smaller (0.11 T)", while section 2.2 says it
#: "achieves switching with only 150 mT" at that same time. Both are recorded; the case reports which
#: one an independent computation lands on rather than choosing for the reader.
_C10_PUBLISHED = {
    4.0: {"optimal_t": 4.6, "conventional_t": 160.0, "note": "conventional demands more than 160 T here"},
    126.0: {"optimal_t": 0.150, "optimal_alternative_t": 0.11, "conventional_t": 1.0},
    140.0: {"optimal_t": 0.135, "note": "quoted as reliable switching at a maximum field of 135 mT"},
    2000.0: {"optimal_t": 0.0096, "conventional_t": 0.329},
}

#: The source's published switching probabilities for the chirped current (Vlasov et al., Phys. Rev. B
#: 105, 134404, after Eq. 15), keyed by the amplitude in j0; "practically unity" is recorded as 1.0.
_R04_PUBLISHED = {0.17: 0.89, 0.18: 0.97, 0.20: 1.0}
#: The source's settings for the chirped current: the stability factor and the ensemble size here.
_R04_STABILITY = 60.0
_R04_COPIES = 1000
_R04_STEPS = 3000


#: The biaxial paper's published Table I: the measured success rate, in per cent, of its optimal
#: switching protocol under thermal fluctuations, keyed by (barrier over thermal energy, damping).
#: Badarneh, Kwiatkowski, Bessarab, Phys. Rev. B 107, 214448 (2023), Table I and Appendix B, which give
#: the settings: a switching time of 2 tau0, a hard-axis ratio of 5, and three stages (equilibration at
#: zero field to establish the Boltzmann distribution, the pulse with noise on, then a final
#: equilibration at zero field).
_C05_PUBLISHED = {
    (30.0, 0.01): 95.3, (50.0, 0.01): 98.4, (70.0, 0.01): 99.6, (80.0, 0.01): 99.9,
    (30.0, 0.1): 96.8, (50.0, 0.1): 98.9, (70.0, 0.1): 99.6, (80.0, 0.1): 99.8,
}
_C05_HARD_AXIS_RATIO = 5.0
_C05_SWITCHING_TAU0 = 2.0
_C05_DAMPINGS = (0.01, 0.1)
_C05_COPIES = 1000
_C05_STEPS = 2000
#: Equilibration before the pulse, in units of tau0 divided by the damping. The published protocol starts
#: from a Boltzmann distribution, and reaching one takes a dissipation time, which is tau0/alpha. A fixed
#: 2 tau0 is enough at alpha = 0.1 and ten times too short at 0.01: measured there, the ensemble spread
#: reaches only 0.0013 of its Boltzmann value, every copy switches, and the run reports a spurious 100
#: per cent against a published 95.3. With this scaling it reports 95.7.
_C05_EQUILIBRATION_OVER_ALPHA = 10.0
#: Relaxation after the pulse, same units: the published protocol's third stage.
_C05_RELAXATION_OVER_ALPHA = 2.0
#: Integration steps per tau0 while no field is applied. The pulse needs the fine step the rest of this
#: stage uses; equilibration does not, and at this density the measured spread and success rate are the
#: same as at a step five times finer (0.0101 against 0.0095, 96.8 per cent against 96.9) for a fifth of
#: the time.
_C05_EQUILIBRATION_STEPS_PER_TAU0 = 200


def _biaxial_thermal_table(case: Case, stability: float) -> MethodResult:
    """R11 on the biaxial paper's own thermal-robustness table, at both of its dampings.

    The paper reports one table for two dampings, so this reports both columns for every stability
    factor: the case's own observable is the value at the damping the paper calls unperturbed (0.1), and
    the other column travels beside it with its published value.
    """
    import numpy as np
    from spinoct.numeric import ImageOCPSolver
    from spinoct.thermal.stochastic import stochastic_llg_step

    metrics: dict[str, float | None] = {"stability_factor": stability}
    for alpha in _C05_DAMPINGS:
        system = MacrospinSystem(
            mu=_system(case, stability, uniaxial=True).mu,
            anisotropy_j=_system(case, stability, uniaxial=True).anisotropy_j,
            alpha=alpha,
            hard_axis_ratio=_C05_HARD_AXIS_RATIO,
        )
        switching_time = system.switching_time_from_tau0(_C05_SWITCHING_TAU0)
        solver = ImageOCPSolver(
            system,
            n_images=ImageOCPSolver.recommended_images(system, switching_time),
            switching_time=switching_time,
        )
        solved = solver.solve_best(n_seeds=_SEEDS, max_iterations=_MAX_ITERATIONS)
        midpoints = 0.5 * (solved.times[:-1] + solved.times[1:])
        field_table = np.asarray(solved.field_midpoints)
        temperature = system.anisotropy_j / (BOLTZMANN_J_PER_K * stability)
        rng = np.random.default_rng(case.seed + int(1000 * alpha))
        moments = np.tile(np.array([0.0, 0.0, 1.0]), (_C05_COPIES, 1))
        zero = np.zeros(3)

        span = _C05_EQUILIBRATION_OVER_ALPHA / alpha
        steps = int(_C05_EQUILIBRATION_STEPS_PER_TAU0 * span)
        dt = system.switching_time_from_tau0(span) / steps
        for _ in range(steps):
            moments = stochastic_llg_step(moments, zero, system, temperature, dt, rng)
        spread = float(np.mean(1.0 - np.abs(moments[:, 2])))

        dt = switching_time / _C05_STEPS
        for index in range(_C05_STEPS):
            time_s = (index + 0.5) * dt
            applied = np.array([np.interp(time_s, midpoints, field_table[:, k]) for k in range(3)])
            moments = stochastic_llg_step(moments, applied, system, temperature, dt, rng)

        span = _C05_RELAXATION_OVER_ALPHA / alpha
        steps = int(_C05_EQUILIBRATION_STEPS_PER_TAU0 * span)
        dt = system.switching_time_from_tau0(span) / steps
        for _ in range(steps):
            moments = stochastic_llg_step(moments, zero, system, temperature, dt, rng)

        rate = float(np.mean(moments[:, 2] < 0.0))
        key = f"alpha_{str(alpha).replace('.', 'p')}"
        metrics[f"success_rate_{key}"] = rate
        metrics[f"equilibrium_spread_{key}"] = spread
        published = _C05_PUBLISHED.get((stability, alpha))
        if published is not None:
            metrics[f"published_rate_{key}"] = published / 100.0
            metrics[f"gap_to_published_{key}"] = rate - published / 100.0

    metrics["success_rate"] = metrics["success_rate_alpha_0p1"]
    return MethodResult(
        method="R11",
        variant=stability,
        cost=None,
        switched=bool(metrics["success_rate"] >= 0.5),
        reason="a switching success rate under thermal fluctuations, not a field cost",
        metrics=metrics,
    )


def _kickoff_peak_field(case: Case, switching_ps: float) -> MethodResult:
    """R05 at the kickoff paper's own switching times: the peak amplitude of the optimal pulse.

    The paper reports peak fields for monolayer CrSBr at named switching times, and energies for a
    50 x 50 nm^2 element. The peak field of a coherent rotation does not depend on how many spins rotate
    together, so it is directly comparable with this product's macrospin; the energies are extensive and
    would need the source's circuit model to convert from T^2 s, which this product does not assume, so
    the case replicates the fields and says why it does not replicate the energies.
    """
    import numpy as np
    from spinoct.analytic.uniaxial import UniaxialOptimalControl

    system = _system(case, switching_ps, uniaxial=True)
    switching_time = switching_ps * 1e-12
    optimal = UniaxialOptimalControl.for_switching_time(system, switching_time)
    grid = np.linspace(0.0, switching_time, 6001)
    peak = float(np.max(np.abs(optimal.field_amplitude(grid))))
    metrics = {
        "peak_field_t": peak,
        "switching_time_ps": switching_ps,
        "switching_time_tau0": switching_time / system.tau0,
        "damping": system.alpha,
    }
    published = _C10_PUBLISHED.get(round(switching_ps, 1))
    if published is not None:
        metrics["published_peak_field_t"] = published["optimal_t"]
        metrics["ratio_to_published"] = peak / published["optimal_t"]
        if "optimal_alternative_t" in published:
            metrics["published_alternative_t"] = published["optimal_alternative_t"]
            metrics["ratio_to_alternative"] = peak / published["optimal_alternative_t"]
        if "conventional_t" in published:
            metrics["published_conventional_t"] = published["conventional_t"]
            metrics["published_reduction_factor"] = published["conventional_t"] / published["optimal_t"]
    return MethodResult(
        method="R05",
        variant=switching_ps,
        cost=optimal.cost(),
        switched=True,
        reason="",
        metrics=metrics,
    )


def _chirped_current(case: Case, amplitude_over_j0: float) -> MethodResult:
    """R04 at the source's settings: T = T0, f_max = 1.4 f_r, the ideal coupling ratio, Delta = 60."""
    import math

    from spinoct.analytic.sot import ChirpedRotatingCurrent
    from spinoct.thermal import sot_switching_success_rate

    system = _system(case, amplitude_over_j0, uniaxial=True)
    beta = ideal_sot_ratio_beta(system.alpha)
    xi_f, xi_d = _SOT_COUPLING * math.cos(beta), _SOT_COUPLING * math.sin(beta)
    pulse = ChirpedRotatingCurrent.at_source_settings(system, xi=_SOT_COUPLING, amplitude_over_j0=amplitude_over_j0)
    temperature = system.anisotropy_j / (BOLTZMANN_J_PER_K * _R04_STABILITY)
    ensemble = sot_switching_success_rate(
        system, pulse.current, pulse.switching_time, temperature, xi_f, xi_d,
        n_copies=_R04_COPIES, n_steps=_R04_STEPS, seed=case.seed,
    )
    j0 = system.anisotropy_j / (system.mu * _SOT_COUPLING)
    optimal_mean = 4.0 * system.alpha * j0 / (math.pi * math.sqrt(1.0 + system.alpha**2))
    metrics = {
        "success_rate": ensemble.success_rate,
        "confidence95": ensemble.confidence95,
        "final_sz_mean": ensemble.final_sz_mean,
        "stability_factor": _R04_STABILITY,
        "amplitude_over_optimal_mean_current": pulse.amplitude / optimal_mean,
        "current_cost_reduced": pulse.cost(),
    }
    published = _R04_PUBLISHED.get(round(amplitude_over_j0, 2))
    if published is not None:
        metrics["published_rate"] = published
        metrics["gap_to_published"] = ensemble.success_rate - published
    return MethodResult(
        method="R04",
        variant=amplitude_over_j0,
        cost=None,
        switched=ensemble.success_rate >= 0.5,
        reason="a current cost in reduced units; the case reports a switching probability, not a field cost",
        metrics=metrics,
    )

#: Chain length in wall widths, so the wall sits well inside the chain at the saddle, and the string
#: method's iteration cap, generous because the stable step shrinks as the exchange stiffens.
_CHAIN_WIDTHS = 12
_MEP_ITERATIONS = 200000


def _continuum_barrier(case: Case, width_sites: float) -> MethodResult:
    """R16 on the continuum axis: the lattice wall barrier against 2 sqrt(2 J K)."""
    import math

    from spinoct.lattice import SpinChain, minimum_energy_path

    reference = _system(case, width_sites, uniaxial=True)
    exchange_over_k = 2.0 * width_sites**2
    n_sites = max(24, int(round(_CHAIN_WIDTHS * width_sites)))
    chain = SpinChain(
        n_sites=n_sites,
        mu=reference.mu,
        anisotropy_j=reference.anisotropy_j,
        exchange_j=exchange_over_k * reference.anisotropy_j,
        alpha=reference.alpha,
    )
    path = minimum_energy_path(chain, initial="wall", max_iterations=_MEP_ITERATIONS)
    continuum = 2.0 * math.sqrt(2.0 * exchange_over_k) * reference.anisotropy_j
    ratio = path.barrier / continuum
    return MethodResult(
        method="R16",
        variant=width_sites,
        cost=None,
        switched=bool(path.converged),
        reason="" if path.converged else "the minimum energy path did not converge",
        metrics={
            "barrier_over_continuum": ratio if path.converged else None,
            "deficit_times_width_squared": (1.0 - ratio) * width_sites**2 if path.converged else None,
            "barrier_over_k": path.barrier / reference.anisotropy_j,
            "continuum_over_k": continuum / reference.anisotropy_j,
            "exchange_over_k": exchange_over_k,
            "n_sites": float(n_sites),
            "converged": float(path.converged),
            "iterations": float(path.iterations),
        },
    )

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


#: Every solver here is deterministic and seeded, so the same cell always returns the same row. The
#: release asks for a cell up to three times (the cost curve, the drawn pulse, and the method matrix),
#: and the constrained solvers take tens of seconds each, so the answer is remembered for the run.
_CELL_CACHE: dict[tuple[str, str, float, float], MethodResult] = {}


def _run_method(case: Case, method: str, variant: float, t_tau0: float) -> MethodResult:
    key = (case.slug, method, variant, t_tau0)
    cached = _CELL_CACHE.get(key)
    if cached is None:
        cached = _compute_method(case, method, variant, t_tau0)
        _CELL_CACHE[key] = cached
    return cached


def _compute_method(case: Case, method: str, variant: float, t_tau0: float) -> MethodResult:
    system = _system(case, variant, uniaxial=True)
    switching_time = system.switching_time_from_tau0(t_tau0)

    if method == "R05" and case.axis.name == "switching_time_ps":
        # The kickoff replication sweeps the paper's own switching times in picoseconds, not in this
        # product's Larmor units, so the comparison is against the numbers as published.
        return _kickoff_peak_field(case, variant)

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
                "peak_amplitude_t": optimal.peak_amplitude(),
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
                "over_optimal": result.cost / optimal.cost() if optimal.cost() > 0 else None,
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
            "over_analytic": result.cost / uniaxial.cost() if uniaxial.cost() > 0 else None,
            "converged": float(result.converged),
            "images": float(images),
            "solve_ms": (time.perf_counter() - started) * 1e3,
        }
        if case.axis.name == "seed":
            metrics.update(_path_signature(result.images))
            metrics["iterations"] = float(result.iterations)
        return MethodResult(method=method, variant=variant, cost=result.cost, switched=True, metrics=metrics)

    if method == "R04":
        return _chirped_current(case, variant)

    if method == "R16" and case.axis.name == "lattice_spacing":
        return _continuum_barrier(case, variant)

    if method == "R11" and case.slug == "prb107-biaxial-figures":
        # The biaxial paper's own thermal table, at its settings and both of its dampings.
        return _biaxial_thermal_table(case, variant)

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
                "added_cost_over_optimal": front.added_cost / optimal.cost() if optimal.cost() > 0 else None,
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
                "over_analytic": result.cost / optimal.cost() if result.switched else None,
                "peak_amplitude_t": result.peak_amplitude,
                "infidelity": result.infidelity,
                "cap_over_anisotropy_field": variant if cap is not None else None,
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
                "over_analytic": result.cost / optimal.cost() if result.switched else None,
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

"""The canonical bake: run the engine over the registry's baked cases and write committed artifacts.

This is the offline truth of the product (ADR-0069). A case declares a system (a material or a synthetic
reference macrospin) and a variant family; the bake computes, at every variant:

- the optimal control path and its cost, against the free-macrospin cost and the universal floor, with
  the floor's uncertainty band from the damping range;
- the trajectory on the sphere and the pulse waveform the workbench draws;
- the conventional static-field baseline, so the reduction factor is honest;
- for a case with a hard axis, the numerical image-based optimal control path, which has no closed form.

Two variant families are supported: a switching-time sweep (the usual one) and a hard-axis-ratio sweep
(the biaxial mechanism's signature, where the switching time is held fixed). The web app never
recomputes any of this; it reads the committed JSON. The bake is deterministic and seeded, and it is an
explicit, versioned operation, not something a deploy re-runs.
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from spinoct.analytic import (
    UniaxialOptimalControl,
    cost_free_macrospin,
    cost_infinite_time,
)
from spinoct.control import ConstantFieldProtocol, static_switching_field
from spinoct.dynamics import MacrospinSystem
from spinoct.numeric import ImageOCPSolver
from spinoct.units import bohr_magnetons_to_j_per_t, mev_to_joules

from ..cases import CASES, Case, baked_cases, coverage_counts, validate_registry
from ..materials import get_material

__all__ = ["ARTIFACT_SCHEMA_VERSION", "bake_all", "bake_case"]

#: The artifact schema version. Bump when the JSON shape changes; the web contract mirrors it.
ARTIFACT_SCHEMA_VERSION = "2.1.0"

#: Samples along the trajectory and pulse the workbench draws.
_TRAJECTORY_SAMPLES = 160
#: The switching time, in tau0, at which a case that sweeps something other than time is computed.
_FIXED_TIME_TAU0 = 10.0
#: Seeds and iteration cap for the numerical biaxial solves. The image count comes from the engine rule.
_SEEDS = 4
_MAX_ITERATIONS = 2500


def _damping_band(case: Case) -> tuple[float, float]:
    if case.material is not None:
        material = get_material(case.material)
        return material.damping_low, material.damping_high
    damping = case.synthetic.damping
    return damping, damping


def _system(case: Case, variant: float | None = None, uniaxial: bool = True) -> MacrospinSystem:
    """The macrospin for a case, at a variant when the case sweeps the hard-axis ratio."""
    if case.material is not None:
        material = get_material(case.material)
        mu, anisotropy, alpha = material.moment_j_per_t, material.anisotropy_j, material.damping
        ratio, label = material.hard_axis_ratio, material.name
    else:
        synthetic = case.synthetic
        mu = bohr_magnetons_to_j_per_t(synthetic.moment_bohr)
        anisotropy = mev_to_joules(synthetic.anisotropy_mev)
        alpha, ratio, label = synthetic.damping, synthetic.hard_axis_ratio, "synthetic reference"
    if case.axis.name == "hard_axis_ratio" and variant is not None:
        ratio = variant
    return MacrospinSystem(
        mu=mu,
        anisotropy_j=anisotropy,
        alpha=alpha,
        hard_axis_ratio=0.0 if uniaxial else ratio,
        label=label,
    )


def _system_block(case: Case) -> dict:
    """The material block, or the equivalent self-describing block for a synthetic system."""
    if case.material is not None:
        return get_material(case.material).describe()
    s = case.synthetic
    note = (
        "A synthetic reference macrospin, not a material: these values are definitional, chosen at the "
        "scale of the van der Waals family so the oracle is comparable with the real cases."
    )
    definitional = {
        "provenance": "assumed",
        "method": "definition of the reference system",
        "sources": [],
        "note": note,
        "flags": ["assumed"],
    }
    values = {
        "moment": s.moment_bohr,
        "anisotropy": s.anisotropy_mev,
        "hard_axis_ratio": s.hard_axis_ratio,
        "damping": s.damping,
        "ordering_temperature": 0.0,
    }
    return {
        "slug": "synthetic-reference",
        "name": "Synthetic reference macrospin",
        "family": "synthetic",
        "spin": 1.5,
        "moment_bohr": s.moment_bohr,
        "anisotropy_mev": s.anisotropy_mev,
        "hard_axis_ratio": s.hard_axis_ratio,
        "damping": s.damping,
        "damping_low": s.damping,
        "damping_high": s.damping,
        "curie_kelvin": 0.0,
        "easy_axis": "z, by construction",
        "notes": note,
        "sources": [],
        "provenance": {
            name: dict(definitional, value=value, low=None, high=None,
                       input={"value": value, "unit": "definition", "basis": "none"})
            for name, value in values.items()
        },
        "flags": [f"{name}: assumed" for name in values],
    }


def _time_for(case: Case, variant: float) -> float:
    """The switching time, in tau0, at which a variant is computed."""
    return variant if case.axis.name == "switching_time" else _FIXED_TIME_TAU0


def _cost_row(case: Case, variant: float) -> dict:
    """One row of the cost curve: the optimum at this variant against its references."""
    t_tau0 = _time_for(case, variant)
    system = _system(case, variant, uniaxial=True)
    if case.axis.name == "damping":
        system = MacrospinSystem(
            mu=system.mu, anisotropy_j=system.anisotropy_j, alpha=variant, gamma=system.gamma
        )
    switching_time = system.switching_time_from_tau0(t_tau0)
    optimal = UniaxialOptimalControl.for_switching_time(system, switching_time)
    free = cost_free_macrospin(switching_time, system.alpha, system.gamma)
    floor = cost_infinite_time(system)
    low, high = _damping_band(case)
    band = [
        UniaxialOptimalControl.for_switching_time(
            MacrospinSystem(mu=system.mu, anisotropy_j=system.anisotropy_j, alpha=alpha), switching_time
        ).cost()
        for alpha in (low, high)
    ]

    cost = optimal.cost()
    row = {
        "variant": variant,
        "switching_time_tau0": t_tau0,
        "switching_time_s": switching_time,
        "cost": cost,
        "cost_low_damping": band[0],
        "cost_high_damping": band[1],
        "cost_free": free,
        "cost_floor": floor,
        "cost_over_floor": cost / floor if floor > 0 else None,
        "cost_over_free": cost / free,
        "mean_amplitude": optimal.mean_amplitude(),
    }
    if case.primary_method == "R15":
        # A learned case reports what the POLICY costs, against the closed form it never saw.
        from ..stages.infer import _run_method

        emitted = _run_method(case, "R15", variant, t_tau0)
        row["cost"] = emitted.cost
        row["switched"] = emitted.switched
        row["cost_over_analytic"] = emitted.metrics["cost_ratio_to_analytic"]
        row["analytic_cost"] = cost
        row["predicted_shape_parameter"] = emitted.metrics["predicted_p"]
        row["true_shape_parameter"] = emitted.metrics["true_p"]
        return row

    if not case.observable.is_field_cost:
        # The case measures something that is not a field cost (a current in reduced units, a success
        # rate). Its own methods produce the row, and the analytic field cost stays in the row under an
        # unambiguous name so the two are never read as the same quantity.
        return _observable_row(case, variant, t_tau0, row)

    if case.axis.name == "seed":
        # The case whose subject is the search: one seed per variant, reported alone.
        from ..stages.infer import _run_method

        solved = _run_method(case, "R07", variant, t_tau0)
        row["cost"] = solved.cost
        row["uniaxial_cost"] = cost
        row["cost_over_free"] = solved.cost / free
        row["cost_over_floor"] = solved.cost / floor if floor > 0 else None
        row.update({k: v for k, v in solved.metrics.items() if k != "solve_ms"})
        return row

    if case.axis.name == "hard_axis_ratio":
        # The hard axis has no closed form: the reported cost is the numerical optimum.
        biaxial = _biaxial(case, variant, t_tau0)
        row["cost"] = biaxial["biaxial_cost"]
        row["cost_over_free"] = biaxial["biaxial_over_free"]
        row["cost_over_floor"] = biaxial["biaxial_cost"] / floor if floor > 0 else None
        row["uniaxial_cost"] = cost
        # The meaningful measure of the mechanism: what the hard axis buys against the same system
        # without it. Above one the hard axis helps; below one it charges more than it saves.
        row["reduction_vs_uniaxial"] = biaxial["reduction_vs_uniaxial"]
        row["converged"] = biaxial["converged"]
    return row


def _observable_row(case: Case, variant: float, t_tau0: float, row: dict) -> dict:
    """The cost-curve row of a case whose observable is not a field cost.

    Every method the case declares contributes its metrics under its own rung name, and the declared
    observable key carries the primary method's value, so the app plots what the case measured without
    knowing which method produced it.
    """
    from ..stages.infer import _run_method

    row["field_cost_reference"] = row.pop("cost")
    row["field_cost_note"] = (
        "The closed-form field cost of the same reversal, for scale only. This case does not report a "
        "field cost."
    )
    # The ratios derived from the field cost describe the field problem, not this case, so they are not
    # carried: a number in the row must belong to the question the case asked.
    for derived in ("cost_over_floor", "cost_over_free", "cost_low_damping", "cost_high_damping", "mean_amplitude"):
        row.pop(derived, None)
    for method in case.methods:
        result = _run_method(case, method, variant, t_tau0)
        row[f"{method.lower()}"] = {
            "cost": result.cost,
            "switched": result.switched,
            "reason": result.reason,
            **result.metrics,
        }
    primary = row[case.primary_method.lower()]
    row[case.observable.key] = primary.get(case.observable.key)
    return row


def _numeric_pulse(case: Case, variant: float, t_tau0: float, seed: int | None = None) -> dict:
    """The pulse of a case whose answer is the NUMERICAL path, drawn on the solver's own grid.

    Two cases would otherwise draw the closed-form uniaxial path while reporting a numerical biaxial
    cost: the hard-axis sweep, whose whole subject is the path the hard axis produces, and the search
    family, whose subject is that different seeds find different paths. Drawing the analytic path there
    would show the same picture for two different answers.

    The control is defined at the midpoints of the image chain, so the moment is taken at the midpoints
    too (the normalized average of the neighbouring images) and every array shares one time base.
    """
    system = _system(case, variant, uniaxial=False)
    switching_time = system.switching_time_from_tau0(t_tau0)
    images = ImageOCPSolver.recommended_images(system, switching_time)
    solver = ImageOCPSolver(system, n_images=images, switching_time=switching_time)
    result = (
        solver.solve(seed=seed, max_iterations=_MAX_ITERATIONS)
        if seed is not None
        else solver.solve_best(n_seeds=_SEEDS, max_iterations=_MAX_ITERATIONS)
    )
    moment = 0.5 * (result.images[:-1] + result.images[1:])
    moment = moment / np.linalg.norm(moment, axis=1, keepdims=True)
    times = 0.5 * (result.times[:-1] + result.times[1:])
    field = result.field_midpoints
    return {
        "variant": variant,
        "switching_time_tau0": t_tau0,
        "switching_time_s": switching_time,
        "time_s": times.tolist(),
        "sx": moment[:, 0].tolist(),
        "sy": moment[:, 1].tolist(),
        "sz": moment[:, 2].tolist(),
        "field_amplitude_t": np.linalg.norm(field, axis=1).tolist(),
        "field_x_t": field[:, 0].tolist(),
        "field_y_t": field[:, 1].tolist(),
        "field_z_t": field[:, 2].tolist(),
    }


def _pulse(case: Case, variant: float) -> dict:
    """The trajectory on the sphere and the pulse waveform at one variant.

    For a learned case this is the pulse the policy emits, not the closed form, because that is what the
    case is about: the workbench must show what the method produced.
    """
    t_tau0 = _time_for(case, variant)
    if case.axis.name == "seed":
        return _numeric_pulse(case, variant, t_tau0, seed=int(variant))
    if case.axis.name == "hard_axis_ratio":
        return _numeric_pulse(case, variant, t_tau0)
    system = _system(case, variant, uniaxial=True)
    if case.axis.name == "damping":
        system = MacrospinSystem(
            mu=system.mu, anisotropy_j=system.anisotropy_j, alpha=variant, gamma=system.gamma
        )
    switching_time = system.switching_time_from_tau0(t_tau0)
    if case.primary_method == "R15":
        from ..stages.train import load_or_train_policy

        optimal = load_or_train_policy().pulse(system, switching_time)
    else:
        optimal = UniaxialOptimalControl.for_switching_time(system, switching_time)
    grid = np.linspace(0.0, switching_time, _TRAJECTORY_SAMPLES)
    moment = optimal.moment(grid)
    field = optimal.field_vector(grid)
    return {
        "variant": variant,
        "switching_time_tau0": t_tau0,
        "switching_time_s": switching_time,
        "time_s": grid.tolist(),
        "sx": moment[:, 0].tolist(),
        "sy": moment[:, 1].tolist(),
        "sz": moment[:, 2].tolist(),
        "field_amplitude_t": optimal.field_amplitude(grid).tolist(),
        "field_x_t": field[:, 0].tolist(),
        "field_y_t": field[:, 1].tolist(),
        "field_z_t": field[:, 2].tolist(),
    }


def _live_inputs(case: Case) -> dict | None:
    """The system constants a live case needs to recompute itself in the browser.

    A lane verdict of `live` is a claim until something in the browser can evaluate the case. The web
    carries its own implementation of the closed form, and this block gives it the same inputs the
    engine used, in SI, so the two can be compared rather than assumed equal.
    """
    if case.primary_method != "R06":
        return None
    from spinoct.analytic.sot import ideal_sot_ratio_beta

    from ..stages.infer import _SOT_COUPLING

    system = _system(case, uniaxial=True)
    return {
        "method": "R06",
        "alpha": system.alpha,
        "gamma": system.gamma,
        "anisotropy_j": system.anisotropy_j,
        "mu": system.mu,
        "tau0_s": system.tau0,
        "xi": _SOT_COUPLING,
        "beta": ideal_sot_ratio_beta(system.alpha),
        "note": (
            "The browser evaluates the closed form of Phys. Rev. B 105, 134404 from these constants and "
            "compares its answer with the committed artifact; the workbench shows the agreement."
        ),
    }


def _pulse_note(case: Case) -> str:
    """What the drawn trajectory is, when it is not the case's own control.

    Three cases draw a path that is not literally the object they measure, and saying so is the
    difference between context and a false claim.
    """
    if case.primary_method == "R06":
        return (
            "The drawn path is the field-driven optimum. At the ideal spin-orbit-torque ratio "
            "xi_D = -alpha xi_F the current torque points entirely along the switching direction and the "
            "problem collapses onto the field-driven one (Phys. Rev. B 105, 134404, Eq. 11), so the "
            "trajectory is the same and only the control differs. The current itself is reported as a "
            "number, not a waveform: the closed form gives its average and its cost, not its shape."
        )
    if case.axis.name == "seed":
        return (
            "The drawn path is the one THIS seed converged to, on the solver's own image grid, which is "
            "the point of the case: the seeds do not all find the same path."
        )
    if case.axis.name == "hard_axis_ratio":
        return (
            "The drawn path is the numerical biaxial optimum on the solver's own image grid, not the "
            "closed-form uniaxial path: with a hard axis there is no closed form, and the shape of the "
            "path is what the hard axis changes."
        )
    if case.primary_method == "R11":
        return (
            "The drawn path is the zero-temperature optimal trajectory, which is the pulse under test. "
            "The success rate comes from a stochastic ensemble of 600 copies at each point, whose "
            "individual trajectories are not drawn."
        )
    if case.primary_method == "R15":
        return "The drawn path is the one the learned policy emitted, not the closed-form optimum."
    return ""


def _static_baseline(case: Case, t_tau0: float) -> dict:
    """The static-field baseline, for the honest reduction factor."""
    system = _system(case, uniaxial=True)
    switching_time = system.switching_time_from_tau0(t_tau0)
    protocol = ConstantFieldProtocol(system, amplitude=1.2 * static_switching_field(system))
    result = protocol.run(switching_time, n_steps=4001)
    optimal = UniaxialOptimalControl.for_switching_time(system, switching_time)
    return {
        "switching_time_tau0": t_tau0,
        "static_cost": result.cost,
        "static_switched": result.switched,
        "optimal_cost": optimal.cost(),
        "reduction_factor": result.cost / optimal.cost() if optimal.cost() > 0 else None,
    }


def _biaxial(case: Case, ratio: float, t_tau0: float) -> dict:
    """The numerical biaxial optimal control path and the reduction the hard axis buys."""
    uniaxial_system = _system(case, ratio, uniaxial=True)
    biaxial_system = _system(case, ratio, uniaxial=False)
    switching_time = uniaxial_system.switching_time_from_tau0(t_tau0)
    free = cost_free_macrospin(switching_time, uniaxial_system.alpha, uniaxial_system.gamma)
    images = ImageOCPSolver.recommended_images(biaxial_system, switching_time)
    result = ImageOCPSolver(biaxial_system, n_images=images, switching_time=switching_time).solve_best(
        n_seeds=_SEEDS, max_iterations=_MAX_ITERATIONS
    )
    uniaxial = UniaxialOptimalControl.for_switching_time(uniaxial_system, switching_time)
    return {
        "switching_time_tau0": t_tau0,
        "hard_axis_ratio": ratio,
        "uniaxial_cost": uniaxial.cost(),
        "biaxial_cost": result.cost,
        "cost_free": free,
        "biaxial_over_free": result.cost / free,
        "reduction_vs_uniaxial": uniaxial.cost() / result.cost if result.cost > 0 else None,
        "converged": bool(result.converged),
        "images": images,
    }


def bake_case(case: Case) -> dict:
    """Bake one case into its artifact dictionary."""
    variants = case.axis.values
    reference = variants[len(variants) // 2]
    artifact = {
        "schema_version": ARTIFACT_SCHEMA_VERSION,
        "case": {
            "slug": case.slug,
            "code": case.code,
            "title": case.title,
            "category": case.category,
            "material": case.material,
            "reason": case.reason,
            "expectation": case.expectation,
            "kill_criterion": case.kill_criterion,
            "ground_truth": case.ground_truth,
            "split": case.split,
            "status": case.status,
            "surface": case.surface,
            "methods": list(case.methods),
            "sources": list(case.sources),
            "includes_biaxial": case.includes_biaxial,
        },
        "material": _system_block(case),
        "axis": {
            "name": case.axis.name,
            "label": case.axis.label,
            "unit": case.axis.unit,
            "values": list(variants),
        },
        "observable": {
            "key": case.observable.key,
            "label": case.observable.label,
            "unit": case.observable.unit,
            "is_field_cost": case.observable.is_field_cost,
            "note": case.observable.note,
        },
        "pulse_note": _pulse_note(case),
        "live_inputs": _live_inputs(case),
        "cost_curve": [_cost_row(case, v) for v in variants],
        "pulses": [_pulse(case, v) for v in variants],
        "reference_pulse": _pulse(case, reference),
        "static_baseline": _static_baseline(case, _time_for(case, variants[-1])),
    }
    if case.includes_biaxial and case.axis.name != "hard_axis_ratio":
        ratio = (
            get_material(case.material).hard_axis_ratio
            if case.material is not None
            else case.synthetic.hard_axis_ratio
        )
        artifact["biaxial_reduction"] = _biaxial(case, ratio, _time_for(case, reference))
    return artifact


def bake_all(output_dir: Path) -> dict:
    """Bake every workbench case and write the artifacts plus the coverage index."""
    validate_registry()
    output_dir.mkdir(parents=True, exist_ok=True)

    index = {
        "schema_version": ARTIFACT_SCHEMA_VERSION,
        "cases": [],
        "categories": {},
        "coverage": coverage_counts(),
        "registry": [
            {
                "slug": case.slug,
                "code": case.code,
                "title": case.title,
                "category": case.category,
                "status": case.status,
                "surface": case.surface,
                "blocked_reason": case.blocked_reason,
                "split": case.split,
                "ground_truth": case.ground_truth,
                "variants": len(case.axis.values),
                "axis": case.axis.label,
                "methods": list(case.methods),
            }
            for case in CASES.values()
        ],
    }
    for slug, case in baked_cases("workbench").items():
        artifact = bake_case(case)
        (output_dir / f"{slug}.json").write_text(
            json.dumps(artifact, indent=2), encoding="utf-8", newline="\n"
        )
        index["cases"].append(
            {
                "slug": slug,
                "code": case.code,
                "title": case.title,
                "category": case.category,
                "material": case.material,
                "material_name": artifact["material"]["name"],
                "includes_biaxial": case.includes_biaxial,
                "axis": case.axis.label,
            }
        )
        index["categories"].setdefault(case.category, []).append(slug)

    (output_dir / "index.json").write_text(
        json.dumps(index, indent=2), encoding="utf-8", newline="\n"
    )
    return index

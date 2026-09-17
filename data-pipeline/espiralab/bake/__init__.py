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
ARTIFACT_SCHEMA_VERSION = "2.0.0"

#: Samples along the trajectory and pulse the workbench draws.
_TRAJECTORY_SAMPLES = 160
#: The switching time, in tau0, at which a case that sweeps something other than time is computed.
_FIXED_TIME_TAU0 = 10.0
#: Image count and seeds for the numerical biaxial solves.
_IMAGES = 60
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


def _pulse(case: Case, variant: float) -> dict:
    """The trajectory on the sphere and the pulse waveform at one variant."""
    t_tau0 = _time_for(case, variant)
    system = _system(case, variant, uniaxial=True)
    switching_time = system.switching_time_from_tau0(t_tau0)
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
    result = ImageOCPSolver(biaxial_system, n_images=_IMAGES, switching_time=switching_time).solve_best(
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

"""The canonical bake: run the engine over the materials and cases, write committed artifacts.

This is the offline truth of the product (ADR-0069). For each case it drives the `spinoct` engine to
compute, at each switching time in the sweep:

- the analytic optimal control path cost and pulse (the exact uniaxial result);
- the universal floor and the free-macrospin cost, with the floor's uncertainty band from the material
  damping range;
- the trajectory on the sphere and the pulse waveform for the workbench viz;
- the conventional baseline costs (static field), so the reduction factor is honest;
- for a biaxial case, the numerical image-based optimal control path and the cost reduction the hard
  axis buys, which has no closed form.

The web app never recomputes any of this; it reads the committed JSON. The bake is deterministic and
seeded, and it is an explicit, versioned operation, not something a deploy re-runs.
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

from ..cases import CASES, Case, validate_registry
from ..materials import get_material

__all__ = ["bake_all", "bake_case", "ARTIFACT_SCHEMA_VERSION"]

#: The artifact schema version. Bump when the JSON shape changes; the web contract mirrors it.
ARTIFACT_SCHEMA_VERSION = "1.0.0"

#: A coarse grid for the committed trajectory and pulse, so the artifact is small enough for the Pages
#: payload budget while still resolving the waveform. The full-resolution curve is reproducible from
#: the seed and the closed form; only the decimated view is committed.
_TRAJECTORY_SAMPLES = 160


def _system_for(material_slug: str, uniaxial: bool = True) -> MacrospinSystem:
    material = get_material(material_slug)
    return MacrospinSystem(
        mu=material.moment_j_per_t,
        anisotropy_j=material.anisotropy_j,
        alpha=material.damping,
        hard_axis_ratio=0.0 if uniaxial else material.hard_axis_ratio,
        label=material.name,
    )


def _cost_curve(material_slug: str, switching_times_tau0: tuple[float, ...]) -> list[dict]:
    """The analytic cost curve over the switching-time sweep, with the damping uncertainty band."""
    material = get_material(material_slug)
    system = _system_for(material_slug)
    floor = cost_infinite_time(system)

    # The floor is linear in the damping, so its band comes straight from the damping range.
    low_system = MacrospinSystem(
        mu=system.mu, anisotropy_j=system.anisotropy_j, alpha=material.damping_low
    )
    high_system = MacrospinSystem(
        mu=system.mu, anisotropy_j=system.anisotropy_j, alpha=material.damping_high
    )

    rows = []
    for t_tau0 in switching_times_tau0:
        switching_time = system.switching_time_from_tau0(t_tau0)
        optimal = UniaxialOptimalControl.for_switching_time(system, switching_time)
        free = cost_free_macrospin(switching_time, system.alpha, system.gamma)
        rows.append(
            {
                "switching_time_tau0": t_tau0,
                "switching_time_s": switching_time,
                "cost": optimal.cost(),
                "cost_low_damping": cost_infinite_time(low_system)
                if t_tau0 > 1e6
                else UniaxialOptimalControl.for_switching_time(low_system, switching_time).cost(),
                "cost_high_damping": UniaxialOptimalControl.for_switching_time(
                    high_system, switching_time
                ).cost(),
                "cost_free": free,
                "cost_floor": floor,
                "cost_over_floor": optimal.cost() / floor if floor > 0 else None,
                "cost_over_free": optimal.cost() / free,
                "mean_amplitude": optimal.mean_amplitude(),
            }
        )
    return rows


def _reference_pulse(material_slug: str, t_tau0: float) -> dict:
    """The trajectory on the sphere and the pulse waveform at a reference switching time."""
    system = _system_for(material_slug)
    switching_time = system.switching_time_from_tau0(t_tau0)
    optimal = UniaxialOptimalControl.for_switching_time(system, switching_time)
    grid = np.linspace(0.0, switching_time, _TRAJECTORY_SAMPLES)
    moment = optimal.moment(grid)
    field = optimal.field_vector(grid)
    amplitude = optimal.field_amplitude(grid)
    return {
        "switching_time_tau0": t_tau0,
        "switching_time_s": switching_time,
        "time_s": grid.tolist(),
        "sx": moment[:, 0].tolist(),
        "sy": moment[:, 1].tolist(),
        "sz": moment[:, 2].tolist(),
        "field_amplitude_t": amplitude.tolist(),
        "field_x_t": field[:, 0].tolist(),
        "field_y_t": field[:, 1].tolist(),
        "field_z_t": field[:, 2].tolist(),
    }


def _static_baseline(material_slug: str, t_tau0: float) -> dict:
    """The static-field baseline at a long switching time, for the honest reduction factor."""
    system = _system_for(material_slug)
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


def _biaxial_reduction(material_slug: str, t_tau0: float) -> dict:
    """The numerical biaxial optimal control path and the reduction the hard axis buys."""
    material = get_material(material_slug)
    uniaxial_system = _system_for(material_slug, uniaxial=True)
    biaxial_system = _system_for(material_slug, uniaxial=False)
    switching_time = uniaxial_system.switching_time_from_tau0(t_tau0)
    free = cost_free_macrospin(switching_time, uniaxial_system.alpha, uniaxial_system.gamma)

    solver = ImageOCPSolver(biaxial_system, n_images=60, switching_time=switching_time)
    result = solver.solve_best(n_seeds=4, max_iterations=2500)

    uniaxial = UniaxialOptimalControl.for_switching_time(uniaxial_system, switching_time)
    return {
        "switching_time_tau0": t_tau0,
        "hard_axis_ratio": material.hard_axis_ratio,
        "uniaxial_cost": uniaxial.cost(),
        "biaxial_cost": result.cost,
        "cost_free": free,
        "biaxial_over_free": result.cost / free,
        "reduction_vs_uniaxial": uniaxial.cost() / result.cost if result.cost > 0 else None,
        "converged": bool(result.converged),
    }


def bake_case(case: Case) -> dict:
    """Bake one case into its artifact dictionary.

    Args:
        case: the case to bake.

    Returns:
        The artifact, a plain JSON-serializable dictionary.
    """
    material = get_material(case.material)
    reference_t = case.switching_times_tau0[len(case.switching_times_tau0) // 2]

    artifact = {
        "schema_version": ARTIFACT_SCHEMA_VERSION,
        "case": {
            "slug": case.slug,
            "title": case.title,
            "category": case.category,
            "material": case.material,
            "reason": case.reason,
            "expectation": case.expectation,
            "includes_biaxial": case.includes_biaxial,
        },
        "material": material.describe(),
        "switching_times_tau0": list(case.switching_times_tau0),
        "cost_curve": _cost_curve(case.material, case.switching_times_tau0),
        # One pulse and trajectory per switching-time variant, so the variant bar drives the instrument.
        "pulses": [_reference_pulse(case.material, t_tau0) for t_tau0 in case.switching_times_tau0],
        "reference_pulse": _reference_pulse(case.material, reference_t),
        "static_baseline": _static_baseline(case.material, case.switching_times_tau0[-1]),
    }
    if case.includes_biaxial:
        artifact["biaxial_reduction"] = _biaxial_reduction(case.material, reference_t)
    return artifact


def bake_all(output_dir: Path) -> dict:
    """Bake every case and write the artifacts plus a top-level index.

    Args:
        output_dir: the directory to write ``<case>.json`` files and ``index.json`` into.

    Returns:
        The index dictionary that was written.
    """
    validate_registry()
    output_dir.mkdir(parents=True, exist_ok=True)

    index = {
        "schema_version": ARTIFACT_SCHEMA_VERSION,
        "cases": [],
        "categories": {},
    }
    for slug, case in CASES.items():
        artifact = bake_case(case)
        path = output_dir / f"{slug}.json"
        path.write_text(json.dumps(artifact, indent=2), encoding="utf-8")
        index["cases"].append(
            {
                "slug": slug,
                "title": case.title,
                "category": case.category,
                "material": case.material,
                "material_name": get_material(case.material).name,
                "includes_biaxial": case.includes_biaxial,
            }
        )
        index["categories"].setdefault(case.category, []).append(slug)

    (output_dir / "index.json").write_text(json.dumps(index, indent=2), encoding="utf-8")
    return index

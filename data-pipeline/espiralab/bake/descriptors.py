"""Exploitability descriptors across the parameter database (backlog BL-026).

The workbench answers one case at a time. A designer choosing between these materials asks a different
question: given what is actually measured about each, which of them can be switched cheaply, reliably
and with a generator that exists? This reduces every material in the database to the handful of numbers
that decide that, all derived from its Contract 1 parameters and the product's own results:

- the Larmor time, the natural scale everything else is quoted against;
- the infinite-time cost floor, which no protocol beats, and the free-macrospin cost at the reference
  switching time, which is the fast-limit reference the floor is compared with;
- what the hardware must supply at that switching time: the peak field of the optimal pulse and the
  99 per cent spectral width it spans;
- whether the material sits in the region where a hard axis pays (the map of backlog BL-035), read at
  its own damping, and the largest reduction available there;
- how many exchange-coupled sites retention needs at room temperature, since one site of any of these
  materials holds nothing: the anisotropy of a single site is a fraction of room temperature.

Every descriptor carries the provenance of the parameter it leans on hardest, so a ranking cannot be
read as measured when it rests on an assumed damping.
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np

from ..materials import get_material, material_slugs

__all__ = ["DESCRIPTOR_SCHEMA", "REFERENCE_TIMES_TAU0", "RETENTION_FACTORS", "bake_descriptors"]

DESCRIPTOR_SCHEMA = "espira.descriptors/1"

#: Reference switching times, in units of the material's own Larmor time: the fast end where the
#: anisotropy has no time to act, the product's usual working point, and the long end.
REFERENCE_TIMES_TAU0 = (2.0, 10.0, 50.0)
#: Retention targets as thermal stability factors, at room temperature: 40 is the usual memory-grade
#: number and 60 the conservative one.
RETENTION_FACTORS = (40.0, 60.0)
#: Room temperature, K. Retention is a room-temperature question; the material's own ordering
#: temperature is reported beside it, because below it the material is not magnetic at all.
ROOM_TEMPERATURE_K = 300.0
#: Time resolution for the peak field and the spectral width.
_SAMPLES = 2048


def _hard_axis_region(map_path: Path, damping: float) -> dict:
    """What the hard-axis map (BL-035) says at the damping nearest this material's own.

    The map is in reduced units, so a material with the same damping sits at the same point of it. The
    nearest swept damping is used, and reported, rather than interpolating a map whose cells are
    separated by factors of ten.
    """
    if not map_path.exists():
        return {"available": False}
    data = json.loads(map_path.read_text(encoding="utf-8"))
    dampings = data["axes"]["damping"]
    nearest = min(dampings, key=lambda d: abs(np.log10(d) - np.log10(damping)))
    cells = [c for c in data["points"] if c["damping"] == nearest and c["reliable"] and c["helped"]]
    return {
        "available": True,
        "map_damping": float(nearest),
        "damping_decades_away": float(abs(np.log10(nearest) - np.log10(damping))),
        "helped_cells": len(cells),
        "best_reduction": float(max((c["reduction_vs_control"] for c in cells), default=0.0)),
        "best_ratio": float(max(cells, key=lambda c: c["reduction_vs_control"])["ratio"]) if cells else None,
        # Beyond this switching time the hard axis stops paying at this damping, which is the number a
        # designer needs: it bounds the time budget, not the ratio.
        "pays_up_to_tau0": float(max((c["switching_tau0"] for c in cells), default=0.0)),
    }


#: Where the bare pulse is fragile enough for the stabilizing field to have something to buy. The
#: reliability front of manuscript M1 is measured at 20, where nothing fails and the field buys nothing.
_RELIABILITY_STABILITY = 3.0
_RELIABILITY_TAU0 = 10.0
_RELIABILITY_BR = 1.0
_RELIABILITY_COPIES = 600
_RELIABILITY_STEPS = 600


def _reliability(system, material) -> dict:
    """What the stabilizing longitudinal field buys, and charges, for this material."""
    from spinoct.thermal import br_cost_reliability_front
    from spinoct.units import BOLTZMANN_J_PER_K

    switching_time = system.switching_time_from_tau0(_RELIABILITY_TAU0)
    temperature = system.anisotropy_j / (BOLTZMANN_J_PER_K * _RELIABILITY_STABILITY)
    bare, stabilised = br_cost_reliability_front(
        system,
        switching_time,
        temperature,
        br_over_anisotropy=(0.0, _RELIABILITY_BR),
        n_copies=_RELIABILITY_COPIES,
        n_steps=_RELIABILITY_STEPS,
        seed=7,
    )
    return {
        "stability_factor": _RELIABILITY_STABILITY,
        "switching_time_tau0": _RELIABILITY_TAU0,
        "br_over_anisotropy": _RELIABILITY_BR,
        "copies": _RELIABILITY_COPIES,
        "temperature_k": float(temperature),
        "bare_success": float(bare.success_rate),
        "bare_confidence95": float(bare.confidence95),
        "stabilised_success": float(stabilised.success_rate),
        "stabilised_confidence95": float(stabilised.confidence95),
        "hyperbolic_fraction_bare": float(bare.hyperbolic_fraction),
        "added_cost": float(stabilised.added_cost),
    }


def _for_material(slug: str, map_path: Path) -> dict:
    from spinoct.analytic.uniaxial import (
        SwitchingTimeTooLongError,
        UniaxialOptimalControl,
        cost_free_macrospin,
        cost_infinite_time,
    )
    from spinoct.dynamics.system import MacrospinSystem
    from spinoct.metrics import pulse_bandwidth_fraction
    from spinoct.units import BOLTZMANN_J_PER_K

    material = get_material(slug)
    system = MacrospinSystem(
        mu=material.moment_j_per_t,
        anisotropy_j=material.anisotropy_j,
        alpha=material.damping,
        hard_axis_ratio=0.0,
    )
    floor = float(cost_infinite_time(system))
    rows = []
    for t_tau0 in REFERENCE_TIMES_TAU0:
        switching_time = system.switching_time_from_tau0(t_tau0)
        free = float(cost_free_macrospin(switching_time, system.alpha, system.gamma))
        try:
            optimal = UniaxialOptimalControl.for_switching_time(system, switching_time)
            cost = float(optimal.cost())
            grid = np.linspace(0.0, switching_time, _SAMPLES)
            peak = float(np.max(np.abs(optimal.field_amplitude(grid))))
            bandwidth = float(pulse_bandwidth_fraction(grid, optimal.field_vector(grid)))
            at_floor = False
        except SwitchingTimeTooLongError:
            # The optimum is its own infinite-time floor here to within double precision.
            cost, peak, bandwidth, at_floor = floor, float("nan"), float("nan"), True
        rows.append(
            {
                "switching_time_tau0": float(t_tau0),
                "switching_time_s": float(switching_time),
                "cost": cost,
                "cost_over_floor": cost / floor if floor > 0 else None,
                "cost_over_free": cost / free if free > 0 else None,
                "peak_field_t": None if at_floor else peak,
                "bandwidth_hz": None if at_floor else bandwidth,
                "at_floor": at_floor,
            }
        )

    # Retention: one site of any of these materials holds nothing at room temperature, so the number
    # that matters is how many exchange-coupled sites a target stability factor needs.
    #
    # The count below multiplies the single-site anisotropy by the number of sites, which is the barrier
    # of a COHERENT reversal. This product's own beyond-macrospin results say that is not the cheapest
    # way out: above a crossover size the element reverses through a domain wall whose barrier saturates
    # at the wall energy instead of growing with the volume (cases C19 to C22, where the measured barrier
    # falls to a fraction of N K). So these counts are the optimistic end, valid while the element is
    # small enough that no wall fits, and the artifact says so rather than printing a bare number.
    retention = [
        {
            "stability_factor": float(delta),
            "sites_needed_coherent": float(
                delta * BOLTZMANN_J_PER_K * ROOM_TEMPERATURE_K / material.anisotropy_j
            ),
        }
        for delta in RETENTION_FACTORS
    ]

    # The thermal front, per material rather than for one of them (the remaining piece of backlog
    # BL-032). At a retention that leaves the bare pulse visibly fragile, what the stabilizing field
    # buys and what it charges, for this material's own damping and anisotropy.
    reliability = _reliability(system, material)
    at_reference = next(
        (r for r in rows if r["switching_time_tau0"] == reliability["switching_time_tau0"]), None
    )
    if at_reference and at_reference["cost"] > 0:
        reliability["added_cost_over_optimal"] = reliability["added_cost"] / at_reference["cost"]

    provenance = material.provenance
    return {
        "material": slug,
        "name": material.name,
        "family": material.family,
        "easy_axis": material.easy_axis,
        "moment_bohr": float(material.moment_bohr),
        "anisotropy_mev": float(material.anisotropy_mev),
        "damping": float(material.damping),
        "hard_axis_ratio": float(material.hard_axis_ratio),
        "curie_kelvin": float(material.curie_kelvin),
        "above_room_temperature": bool(material.curie_kelvin > ROOM_TEMPERATURE_K),
        "tau0_s": float(system.tau0),
        "cost_floor": floor,
        "anisotropy_field_t": float(system.anisotropy_field),
        "single_site_kelvin": float(material.anisotropy_j / BOLTZMANN_J_PER_K),
        "reference_times": rows,
        "retention": retention,
        "reliability": reliability,
        "hard_axis": _hard_axis_region(map_path, material.damping),
        # The weakest link in the chain: a descriptor built on an assumed damping is not a measurement.
        "provenance": {
            key: provenance[key]["provenance"] for key in ("moment", "anisotropy", "damping") if key in provenance
        },
        "flags": list(material.flags),
    }


def bake_descriptors(artifacts: Path) -> dict:
    """Every material in the database, reduced to what decides whether it is worth switching."""
    return {
        "schema": DESCRIPTOR_SCHEMA,
        "description": (
            "Exploitability descriptors per material, derived from the Contract 1 parameters: the Larmor "
            "time, the infinite-time cost floor, the cost and the hardware demands at three reference "
            "switching times, the region where a hard axis pays at that damping, and the number of "
            "exchange-coupled sites a room-temperature retention target needs. Each material carries the "
            "provenance of the parameters the descriptors rest on."
        ),
        "room_temperature_k": ROOM_TEMPERATURE_K,
        "reliability_note": (
            "The reliability block is measured per material but is a function of the damping alone: at a "
            "fixed switching time in Larmor units, a fixed stability factor and a field in units of the "
            "material's own anisotropy field, the reduced dynamics carry no other material parameter. "
            "Materials that share a damping therefore share these numbers exactly, which is a check on "
            "that reduction rather than a coincidence, and what separates them is the absolute cost "
            "scale reported beside it."
        ),
        "retention_note": (
            "The site counts assume the element reverses coherently, so its barrier is the number of "
            "sites times the single-site anisotropy. The free optimal control results of this product "
            "(C19 to C22) measure the cheaper way out: above a crossover size the reversal nucleates a "
            "domain wall whose barrier saturates at the wall energy rather than growing with the volume. "
            "These counts are therefore the optimistic end, and a real element of that size retains less."
        ),
        "reference_times_tau0": list(REFERENCE_TIMES_TAU0),
        "retention_factors": list(RETENTION_FACTORS),
        "materials": [_for_material(slug, artifacts / "hard_axis_map.json") for slug in material_slugs()],
    }

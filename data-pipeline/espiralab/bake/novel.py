"""Bake the novel-agenda results: the reliability front (R12) and the beyond-macrospin study (Gap 1).

These are cross-case results, not per-material, so they are baked once into a separate artifact the
Experiments page reads. Everything is driven by the spinoct engine; the web only replays it.
"""

from __future__ import annotations

from spinoct.dynamics import MacrospinSystem
from spinoct.lattice import SpinChain, compare_reversal_modes
from spinoct.thermal import br_cost_reliability_front
from spinoct.units import BOLTZMANN_J_PER_K

from ..materials import get_material

__all__ = ["bake_novel_results"]


def _br_front(material_slug: str) -> dict:
    """The longitudinal-field cost-reliability front for a material (R12)."""
    material = get_material(material_slug)
    system = MacrospinSystem(
        mu=material.moment_j_per_t, anisotropy_j=material.anisotropy_j, alpha=material.damping
    )
    switching_time = system.switching_time_from_tau0(10.0)
    # A temperature giving a thermal stability factor of 20. Not a regime where the field buys much: the
    # bare pulse already reverses every copy here, which manuscript M1 v1 missed and v2 corrects. The
    # stability-factor dependence, where the gain is real, is case C07.
    temperature = system.anisotropy_j / (BOLTZMANN_J_PER_K * 20.0)
    front = br_cost_reliability_front(
        system,
        switching_time,
        temperature,
        br_over_anisotropy=(0.0, 0.5, 1.0, 1.5, 2.0, 2.5),
        n_copies=400,
        n_steps=600,
    )
    return {
        "material": material.name,
        "thermal_stability_factor": 20.0,
        "points": [
            {
                "br_over_anisotropy": p.longitudinal_field_over_anisotropy,
                "added_cost": p.added_cost,
                "success_rate": p.success_rate,
                "confidence95": p.confidence95,
                "hyperbolic_fraction": p.hyperbolic_fraction,
            }
            for p in front
        ],
    }


def _lattice_crossover(material_slug: str) -> dict:
    """The uniform-vs-domain-wall switching cost across chain length (Gap 1)."""
    material = get_material(material_slug)
    exchange_j = 0.5 * material.anisotropy_j
    rows = []
    for n_sites in (2, 4, 8, 16, 32, 64):
        chain = SpinChain(
            n_sites=n_sites,
            mu=material.moment_j_per_t,
            anisotropy_j=material.anisotropy_j,
            exchange_j=exchange_j,
            alpha=material.damping,
        )
        switching_time = chain.tau0 * 10.0
        comparison = compare_reversal_modes(chain, switching_time, steps=800)
        rows.append(
            {
                "n_sites": n_sites,
                "uniform_cost": comparison.uniform_cost,
                "domain_wall_cost": comparison.domain_wall_cost,
                "ratio": comparison.ratio,
                "cheaper_mode": comparison.cheaper_mode,
            }
        )
    return {
        "material": material.name,
        "exchange_over_anisotropy": exchange_j / material.anisotropy_j,
        "rows": rows,
    }


def bake_novel_results() -> dict:
    """Bake the novel-agenda cross-case artifact.

    Returns:
        The artifact dictionary: the reliability front and the lattice crossover, for CrSBr (the
        kickoff material and the biaxial host).
    """
    return {
        "schema_version": "1.0.0",
        "reliability_front": _br_front("crsbr"),
        "lattice_crossover": _lattice_crossover("crsbr"),
        "notes": {
            "reliability": (
                "The longitudinal-field cost-reliability front (R12) at a thermal stability factor of "
                "20: a field parallel to the moment is invisible to the optimal pulse dynamics and "
                "removes the hyperbolic instability, at an added cost that grows as the square of the "
                "field and is not small, 2.5 times the bare optimal cost at one anisotropy field and "
                "15.8 times at two and a half. At this stability factor the bare pulse already reverses "
                "every copy, so the field buys no reliability here; the dip near one anisotropy field is "
                "the published counterintuitive feature. Where the field does pay is below a stability "
                "factor of about ten, which case C07 measures. Manuscript M1 v2 corrects v1 on both "
                "points."
            ),
            "lattice": (
                "The two-mode comparison (Gap 1), kept as the record of what version 1 of manuscript M2 "
                "concluded: a uniform rotation against a constant-speed domain-wall sweep, where uniform "
                "rotation is cheaper at every chain length tested. That comparison is correct for those "
                "two fixed modes at that short switching time, and its conclusion is WITHDRAWN: the "
                "constant-speed wall is not the optimal wall, and the free search finds optimal walls "
                "cheaper than uniform rotation above a crossover length at long switching time, bounded "
                "below by an energy-barrier floor that links the barrier and the field cost rather than "
                "opposing them (M2 v2)."
            ),
        },
    }

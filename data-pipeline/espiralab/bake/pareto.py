"""The device trade-off front (R14), per material.

Every case in the workbench reports one scalar at a time: a cost at a switching time. A device does not
get to pick one objective. It has to supply a peak field from a real generator, over a real bandwidth,
within a time budget, and the four pull against each other: the faster the reversal, the higher the peak
field and the wider the band, while the cost falls with time only until the anisotropy stops helping.

``spinoct.pareto`` evaluates the analytic optimal family on all four objectives at once and marks which
points are dominated (some other protocol is at least as good everywhere and better somewhere). This
writes that front for every material in the database, so the trade-off is shown rather than described.

The front is a property of the closed-form family, so it costs milliseconds per point and belongs in the
main bake rather than in a separate entry point.
"""

from __future__ import annotations

import numpy as np

from ..materials import get_material, material_slugs

__all__ = ["PARETO_SCHEMA", "SWITCHING_TIMES_TAU0", "bake_pareto_fronts"]

PARETO_SCHEMA = "espira.pareto/1"

#: The switching times swept, in units of tau0: from the free-rotation end, where the anisotropy has no
#: time to act, to the long-time end where the cost approaches the barrier floor. Log-spaced because the
#: cost falls like 1/T over most of the range.
SWITCHING_TIMES_TAU0 = tuple(float(round(t, 4)) for t in np.geomspace(0.5, 200.0, 24))

#: Time resolution for the peak field and the spectral width of each pulse.
_SAMPLES = 2048


def _front_for(slug: str) -> dict:
    from spinoct.dynamics.system import MacrospinSystem
    from spinoct.pareto import pareto_front

    material = get_material(slug)
    system = MacrospinSystem(
        mu=material.moment_j_per_t,
        anisotropy_j=material.anisotropy_j,
        alpha=material.damping,
        hard_axis_ratio=0.0,
        label=material.name,
    )
    points = pareto_front(system, np.array(SWITCHING_TIMES_TAU0), samples=_SAMPLES)
    rows = [
        {
            "switching_time_tau0": float(p.switching_time_tau0),
            "switching_time_s": float(p.switching_time_s),
            "cost": float(p.cost),
            "peak_field_t": float(p.peak_field),
            "bandwidth_hz": float(p.bandwidth_hz),
            "dominated": bool(p.dominated),
        }
        for p in points
    ]
    _mark_supply_dominance(rows)
    return {
        "material": slug,
        "name": material.name,
        "damping": float(material.damping),
        "damping_provenance": material.provenance["damping"]["provenance"],
        "tau0_s": float(system.tau0),
        "points": rows,
        "front_size": sum(1 for r in rows if not r["dominated"]),
        "supply_front_size": sum(1 for r in rows if not r["dominated_without_time"]),
        "exponents": _exponents(rows),
        "bandwidth_inversions": _bandwidth_inversions(rows),
    }


def _bandwidth_inversions(rows: list[dict]) -> dict:
    """Where a slower protocol needs a WIDER band than a faster one.

    The cost and the peak field fall monotonically with the time budget, so "slower is easier to supply"
    holds for both. The 99 per cent spectral width does not: the optimal pulse turns with the precession,
    and as the budget grows the lobe that carries the last per cent of the energy changes, which moves
    the width in jumps. Verified against the estimator itself: the widths are stable to four digits from
    2,048 to 131,072 samples, so this is the pulse family and not the transform's frequency grid.
    """
    worst, count = None, 0
    for faster, slower in ((a, b) for i, a in enumerate(rows) for b in rows[i + 1 :]):
        if slower["bandwidth_hz"] > faster["bandwidth_hz"]:
            count += 1
            ratio = slower["bandwidth_hz"] / faster["bandwidth_hz"]
            if worst is None or ratio > worst["ratio"]:
                worst = {
                    "faster_tau0": faster["switching_time_tau0"],
                    "slower_tau0": slower["switching_time_tau0"],
                    "faster_hz": faster["bandwidth_hz"],
                    "slower_hz": slower["bandwidth_hz"],
                    "ratio": ratio,
                }
    return {"count": count, "worst": worst}


def _mark_supply_dominance(rows: list[dict]) -> None:
    """Dominance among the three quantities the hardware has to supply, with the deadline set aside.

    Counting the switching time itself as an objective makes the question empty: every protocol in the
    sweep has a different time, so nothing can be at least as good everywhere, and a front of "all of
    them" is an artefact of the framing rather than a result. The question with content is the one a
    device asks once its deadline is fixed: of the protocols that meet it, does any other protocol cost
    less AND need a lower peak field AND a narrower band? That can happen here, because the bandwidth is
    not monotone in the switching time while the cost and the peak field are.
    """
    keys = ("cost", "peak_field_t", "bandwidth_hz")
    for row in rows:
        row["dominated_without_time"] = any(
            all(other[k] <= row[k] for k in keys) and any(other[k] < row[k] for k in keys)
            for other in rows
            if other is not row
        )


def _exponents(rows: list[dict]) -> dict:
    """How each objective scales with the switching time, as a fitted log-log slope.

    The slope is the exchange rate a device actually pays: a slope of -1 means doubling the time budget
    halves the quantity, and a slope near zero means the time budget buys nothing there. Fitted by least
    squares over the whole sweep, with the residual reported so a curved trade is not read as a power law.
    """
    time = np.log(np.array([r["switching_time_tau0"] for r in rows]))
    out: dict[str, dict] = {}
    for key in ("cost", "peak_field_t", "bandwidth_hz"):
        value = np.log(np.array([r[key] for r in rows]))
        slope, intercept = np.polyfit(time, value, 1)
        residual = float(np.max(np.abs(value - (slope * time + intercept))))
        out[key] = {"slope": float(slope), "max_log_residual": residual}
    return out


def bake_pareto_fronts() -> dict:
    """The four-objective front for every material in the database."""
    return {
        "schema": PARETO_SCHEMA,
        "description": (
            "The analytic optimal-control family evaluated on four objectives at once (switching time, "
            "field cost, peak field, 99 per cent spectral bandwidth) for each material. A point is "
            "dominated when another protocol of the same family is at least as good on every objective "
            "and strictly better on one; the rest are the Pareto front."
        ),
        "objectives": [
            {"key": "switching_time_tau0", "label": "Switching time", "unit": "tau0"},
            {"key": "cost", "label": "Field cost", "unit": "T^2 s"},
            {"key": "peak_field_t", "label": "Peak field", "unit": "T"},
            {"key": "bandwidth_hz", "label": "Bandwidth (99 per cent)", "unit": "Hz"},
        ],
        "materials": [_front_for(slug) for slug in material_slugs()],
    }

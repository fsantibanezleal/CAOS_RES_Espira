"""Where a hard axis actually reduces the switching cost (backlog BL-035, finding F-011).

A hard axis is the one mechanism in this literature that can beat the free-macrospin cost: the internal
torque does part of the work, so the field has less to supply. Case C04 measures that along one line,
sweeping the hard-axis ratio at a single damping and switching time, and it found the benefit is not
monotone: it peaks near a ratio of order one and reverses when the hard axis is strong enough that its
own in-plane barrier costs more than it saves.

That leaves the question a designer actually asks: over what region of (hard-axis ratio, damping,
switching time) does the mechanism pay at all? This bakes that region. Each point solves the biaxial
optimal control path numerically and divides the uniaxial optimum of the same system by it, so a value
above one means the hard axis helped and a value below one means it charged more than it saved.

The reference system is the product's synthetic macrospin, not a material: the answer is a property of
the mechanism in reduced units, and every material with the same damping and reduced switching time
sits at the same point of this map.

Minutes of numerical solves, so a separate entry point, parallel over points and checkpointed.
"""

from __future__ import annotations

import json
import os
from concurrent.futures import ProcessPoolExecutor, as_completed
from dataclasses import dataclass
from pathlib import Path

__all__ = ["GRID", "HARD_AXIS_SCHEMA", "HardAxisPoint", "bake_hard_axis_map"]

HARD_AXIS_SCHEMA = "espira.hard-axis-map/1"

#: The hard-axis ratio K_hard / K_easy. Zero is the uniaxial system itself, which must return exactly
#: one, and is kept in the grid as the map's own control.
RATIOS = (0.0, 0.25, 0.5, 1.0, 2.0, 4.0, 8.0)
#: Damping: the measured value of Cr2Ge2Te6 (0.0007) up to the strongly damped end.
DAMPINGS = (0.001, 0.01, 0.1, 0.5)
#: Switching time in units of tau0, from the fast end to the long-time end where the anisotropy governs.
SWITCHING_TIMES_TAU0 = (2.0, 5.0, 10.0, 20.0, 50.0, 100.0, 200.0)
#: How far the control may sit from the closed form before a cell stops being evidence of anything.
CONTROL_TOLERANCE = 0.05


@dataclass(frozen=True)
class HardAxisPoint:
    """One point of the map."""

    ratio: float
    damping: float
    switching_tau0: float

    @property
    def key(self) -> str:
        return f"hx_r{self.ratio:g}_a{self.damping:g}_t{self.switching_tau0:g}"


GRID: tuple[HardAxisPoint, ...] = tuple(
    HardAxisPoint(ratio, damping, time)
    for damping in DAMPINGS
    for time in SWITCHING_TIMES_TAU0
    for ratio in RATIOS
)


def _solve_point(point: HardAxisPoint) -> dict:
    """Solve one point (runs in a worker process)."""
    from spinoct.analytic.uniaxial import (
        SwitchingTimeTooLongError,
        UniaxialOptimalControl,
        cost_infinite_time,
    )
    from spinoct.dynamics.system import MacrospinSystem
    from spinoct.numeric import ImageOCPSolver
    from spinoct.units import bohr_magnetons_to_j_per_t, mev_to_joules

    mu = bohr_magnetons_to_j_per_t(3.0)
    anisotropy = mev_to_joules(0.15)
    uniaxial = MacrospinSystem(mu=mu, anisotropy_j=anisotropy, alpha=point.damping, hard_axis_ratio=0.0)
    biaxial = MacrospinSystem(
        mu=mu, anisotropy_j=anisotropy, alpha=point.damping, hard_axis_ratio=point.ratio
    )
    switching_time = uniaxial.switching_time_from_tau0(point.switching_tau0)
    images = ImageOCPSolver.recommended_images(biaxial, switching_time)
    solved = ImageOCPSolver(biaxial, n_images=images, switching_time=switching_time).solve_best(
        n_seeds=4, max_iterations=2500
    )
    # Far enough into the long-time corner the uniaxial optimum is its own infinite-time floor to within
    # double precision, and the engine refuses to return a shape parameter there rather than inventing
    # one. The point is recorded as at the floor: the comparison is not wrong, it stops existing.
    try:
        closed_form = float(UniaxialOptimalControl.for_switching_time(uniaxial, switching_time).cost())
        at_floor = False
    except SwitchingTimeTooLongError:
        closed_form = float(cost_infinite_time(uniaxial))
        at_floor = True
    return {
        "key": point.key,
        "ratio": point.ratio,
        "damping": point.damping,
        "switching_tau0": point.switching_tau0,
        "uniaxial_cost": closed_form,
        "biaxial_cost": float(solved.cost),
        # Above one the hard axis paid for itself; below one it charged more than it saved.
        "reduction": float(closed_form / solved.cost) if solved.cost > 0 else None,
        "converged": bool(solved.converged),
        "at_floor": at_floor,
    }


def _mark_against_the_control(records: list[dict]) -> None:
    """Score every point against the uniaxial control solved by the same numerical method.

    At a hard-axis ratio of zero the biaxial system IS the uniaxial one, so the solver should return the
    closed form exactly; it returns it to within about a per cent, which is the numerical method's own
    error at that damping and switching time. Reading a raw reduction of 1.005 as "the hard axis helped"
    would be reading that error. Each point is therefore divided by the control at its own damping and
    switching time, and only a point that beats its control counts as helped.
    """
    controls = {
        (r["damping"], r["switching_tau0"]): r["reduction"] for r in records if r["ratio"] == 0.0
    }
    for record in records:
        control = controls.get((record["damping"], record["switching_tau0"]))
        raw = record["reduction"]
        vs_control = None if raw is None or not control else raw / control
        record["control"] = control
        record["reduction_vs_control"] = vs_control
        # A cell is only evidence where the method reproduces the case it already knows the answer to.
        # In the long-time corner the control drifts to 26 per cent and the solver stops converging;
        # those cells are drawn and counted apart rather than quietly averaged in.
        record["reliable"] = bool(
            control is not None
            and abs(1.0 - control) <= CONTROL_TOLERANCE
            and record["converged"]
            and not record.get("at_floor", False)
        )
        record["helped"] = bool(
            vs_control is not None and vs_control > 1.0 and record["ratio"] > 0.0 and record["reliable"]
        )


def bake_hard_axis_map(output: Path, workers: int | None = None, checkpoint_dir: Path | None = None) -> dict:
    """Run (or resume) the map and write ``hard_axis_map.json``."""
    output.mkdir(parents=True, exist_ok=True)
    if checkpoint_dir is None:
        env = os.environ.get("ESPIRA_CHECKPOINT_DIR")
        checkpoint_dir = Path(env) if env else output.parent / ".checkpoints" / "hard_axis"
    checkpoint_dir.mkdir(parents=True, exist_ok=True)
    pending = [p for p in GRID if not (checkpoint_dir / f"{p.key}.json").exists()]
    workers = workers or min(len(pending) or 1, max(1, (os.cpu_count() or 4) - 4))
    for var in ("OMP_NUM_THREADS", "OPENBLAS_NUM_THREADS", "MKL_NUM_THREADS"):
        os.environ[var] = "1"
    print(f"hard-axis map: {len(GRID) - len(pending)} of {len(GRID)} points done, {workers} workers", flush=True)
    if pending:
        with ProcessPoolExecutor(max_workers=workers) as pool:
            futures = {pool.submit(_solve_point, p): p for p in pending}
            for done, future in enumerate(as_completed(futures), start=1):
                record = future.result()
                (checkpoint_dir / f"{record['key']}.json").write_text(
                    json.dumps(record, allow_nan=False), encoding="utf-8", newline="\n"
                )
                if done % 20 == 0 or done == len(pending):
                    print(f"  {done} of {len(pending)}", flush=True)

    records = [json.loads((checkpoint_dir / f"{p.key}.json").read_text(encoding="utf-8")) for p in GRID]
    if {p.key for p in GRID} != {r["key"] for r in records}:
        raise RuntimeError("declared and shipped hard-axis points differ")
    _mark_against_the_control(records)
    helped = [r for r in records if r["helped"]]
    best = max((r for r in records if r["reliable"]), key=lambda r: r["reduction_vs_control"])
    artifact = {
        "schema": HARD_AXIS_SCHEMA,
        "description": (
            "The biaxial optimal control cost against the uniaxial closed form of the same system, over "
            "hard-axis ratio, damping and switching time. reduction = uniaxial cost / biaxial cost: above "
            "one the hard axis pays for itself, below one it charges more than it saves. The reference is "
            "the synthetic macrospin, so the map is in reduced units and holds for any material at the "
            "same damping and reduced switching time."
        ),
        "axes": {
            "ratio": list(RATIOS),
            "damping": list(DAMPINGS),
            "switching_tau0": list(SWITCHING_TIMES_TAU0),
        },
        "summary": {
            "points": len(records),
            "reliable": sum(1 for r in records if r["reliable"]),
            "helped": len(helped),
            "unconverged": sum(1 for r in records if not r["converged"]),
            "at_floor": sum(1 for r in records if r.get("at_floor", False)),
            "control_tolerance": CONTROL_TOLERANCE,
            "worst_control": max(abs(1.0 - r["reduction"]) for r in records if r["ratio"] == 0.0),
            "best": {
                k: best[k]
                for k in ("key", "ratio", "damping", "switching_tau0", "reduction", "reduction_vs_control")
            },
        },
        "points": records,
    }
    (output / "hard_axis_map.json").write_text(
        json.dumps(artifact, separators=(",", ":"), allow_nan=False), encoding="utf-8", newline="\n"
    )
    return artifact

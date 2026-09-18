"""Bake the two-dimensional patch crossover (cases C20 and C21).

The free optimal control path of a square ``W x W`` patch is solved over every site's trajectory
(``spinoct.lattice.LatticeOCPSolver`` on a ``spinoct.lattice.SpinPatch``) from three starts (the uniform
optimum with a symmetry-breaking perturbation, a straight tanh wall, and the minimum energy path), and
the cheapest is kept. As for the chain map, every reported cost is the cost of an explicit feasible
trajectory on the same grid as the uniform bound, so each ratio is an upper bound on the true optimum
over uniform rotation, valid even where the optimizer stops at its iteration cap; the minimum energy
path barrier gives the rigorous floor ``4 alpha dE / (gamma mu)``.

Two anisotropy regimes at the same damping and switching time: ``J/K = 10`` (C20, the chain map's
value, a wall about 2.2 sites wide) and ``J/K = 2.5`` (C21, a stronger anisotropy, a wall about 1.1
sites wide). The patches are material-free: the result is in sites and wall widths, and converts to a
material only through its measured exchange and anisotropy, which none of the product's materials has
measured together.

Hours of single-core solves, so a separate entry point, parallel over cases and checkpointed per case.
"""

from __future__ import annotations

import json
import os
from concurrent.futures import ProcessPoolExecutor, as_completed
from dataclasses import dataclass
from pathlib import Path

import numpy as np

__all__ = ["GRID", "PatchCase", "bake_patch_ocp"]

#: The CrSBr-like reference used across the product's lattice results. Only the dimensionless ratios
#: J/K, alpha, T/tau0 and the patch width enter the reported cost ratios.
_MU_BOHR = 3.0
_K_MEV = 0.15
#: Damping and switching time: the long-time, strong-damping regime where the chain map found walls
#: cheapest, so the two-dimensional question is asked where the one-dimensional answer is clearest.
_ALPHA = 0.5
_SWITCHING_TAU0 = 160.0
_WIDTHS = (4, 8, 12, 16, 24, 32)
_ITERATIONS = 1500


@dataclass(frozen=True)
class PatchCase:
    """One point of the patch sweep."""

    exchange_over_k: float
    width: int
    alpha: float = _ALPHA
    switching_tau0: float = _SWITCHING_TAU0
    max_iterations: int = _ITERATIONS

    @property
    def key(self) -> str:
        return f"patch_jk{self.exchange_over_k:g}_a{self.alpha:g}_t{self.switching_tau0:g}_w{self.width}"


GRID: tuple[PatchCase, ...] = tuple(
    PatchCase(exchange_over_k, width) for exchange_over_k in (10.0, 2.5) for width in _WIDTHS
)

#: Time rows kept for the per-case s_z map, averaged along y so the web draws one row per column of
#: sites (the wall travels along x).
_MAP_ROWS = 48
_MAP_DECIMALS = 3


def _solve_case(case: PatchCase) -> dict:
    """Solve one patch from all three starts; return the record (runs in a worker process)."""
    from spinoct.lattice import LatticeOCPSolver, SpinPatch, cost_floor_from_barrier, minimum_energy_path
    from spinoct.units import bohr_magnetons_to_j_per_t, mev_to_joules

    mu = bohr_magnetons_to_j_per_t(_MU_BOHR)
    anisotropy = mev_to_joules(_K_MEV)
    patch = SpinPatch(
        width=case.width,
        height=case.width,
        mu=mu,
        anisotropy_j=anisotropy,
        exchange_j=case.exchange_over_k * anisotropy,
        alpha=case.alpha,
    )
    switching_time = case.switching_tau0 * patch.tau0
    n_images = LatticeOCPSolver.recommended_images(patch, switching_time)
    solver = LatticeOCPSolver(patch, n_images, switching_time)
    bound = solver.uniform_bound()
    mep = minimum_energy_path(patch, initial="wall", max_iterations=200000)
    floor = cost_floor_from_barrier(mep.barrier, mu, case.alpha, patch.gamma)

    starts = {}
    best = None
    for initial, noise in (("uniform", 0.05), ("wall", 0.0), ("mep", 0.0)):
        result = solver.solve(initial=initial, seed=0, noise=noise, max_iterations=case.max_iterations)
        starts[initial] = {
            "ratio": result.cost / bound,
            "nonuniformity": result.nonuniformity,
            "converged": result.converged,
            "iterations": result.iterations,
        }
        if best is None or result.cost < best[1].cost:
            best = (initial, result)
    assert best is not None
    best_start, best_result = best
    if best_result.cost >= bound:
        best_start = "uniform"
        best_images, best_cost, best_nonuniformity = solver.uniform_images(), bound, 0.0
    else:
        best_images, best_cost = best_result.images, best_result.cost
        best_nonuniformity = best_result.nonuniformity

    rows = np.linspace(0, best_images.shape[0] - 1, _MAP_ROWS).round().astype(int)
    grid = best_images[rows, :, 2].reshape(rows.size, case.width, case.width)
    sz_map = np.round(grid.mean(axis=1), _MAP_DECIMALS)  # average over y, one column per x
    return {
        "key": case.key,
        "exchange_over_k": case.exchange_over_k,
        "wall_width_sites": float(np.sqrt(case.exchange_over_k / 2.0)),
        "alpha": case.alpha,
        "switching_tau0": case.switching_tau0,
        "width": case.width,
        "n_sites": case.width * case.width,
        "n_images": n_images,
        "uniform_bound_t2s": bound,
        "barrier_over_nk": mep.barrier / (patch.n_sites * anisotropy),
        "barrier_converged": bool(mep.converged),
        "floor_ratio": floor / bound,
        "best_start": best_start,
        "best_ratio": best_cost / bound,
        "best_nonuniformity": best_nonuniformity,
        "saving": 1.0 - best_cost / bound,
        "starts": starts,
        "sz_map": {"times_over_t": (rows / rows[-1]).round(4).tolist(), "sz_by_column": sz_map.tolist()},
    }


def bake_patch_ocp(output: Path, workers: int | None = None, checkpoint_dir: Path | None = None) -> dict:
    """Run (or resume) the patch sweep and write ``patch_ocp.json``."""
    output.mkdir(parents=True, exist_ok=True)
    if checkpoint_dir is None:
        env = os.environ.get("ESPIRA_CHECKPOINT_DIR")
        checkpoint_dir = Path(env) if env else output.parent / ".checkpoints" / "patch_ocp"
    checkpoint_dir.mkdir(parents=True, exist_ok=True)
    pending = [c for c in GRID if not (checkpoint_dir / f"{c.key}.json").exists()]
    workers = workers or min(len(pending) or 1, max(1, (os.cpu_count() or 4) - 4))
    for var in ("OMP_NUM_THREADS", "OPENBLAS_NUM_THREADS", "MKL_NUM_THREADS"):
        os.environ[var] = "1"
    print(f"patch OCP: {len(GRID) - len(pending)} of {len(GRID)} cases checkpointed, {workers} workers", flush=True)
    if pending:
        with ProcessPoolExecutor(max_workers=workers) as pool:
            futures = {pool.submit(_solve_case, case): case for case in pending}
            for future in as_completed(futures):
                record = future.result()
                (checkpoint_dir / f"{record['key']}.json").write_text(
                    json.dumps(record, allow_nan=False), encoding="utf-8", newline="\n"
                )
                print(
                    f"  {record['key']:36s} best={record['best_start']:7s} ratio={record['best_ratio']:.4f} "
                    f"floor={record['floor_ratio']:.4f} nonunif={record['best_nonuniformity']:.3f}",
                    flush=True,
                )

    records = [json.loads((checkpoint_dir / f"{c.key}.json").read_text(encoding="utf-8")) for c in GRID]
    if {c.key for c in GRID} != {r["key"] for r in records}:
        raise RuntimeError("declared and shipped patch cases differ")
    artifact = {
        "schema": "espira.patch_ocp/1",
        "description": (
            "Free optimal control of a square W x W patch versus uniform rotation, at two anisotropy "
            "regimes. best_ratio is the cost of the cheapest explicit trajectory found over the uniform "
            "bound on the same grid (an upper bound on the true optimum); floor_ratio is the "
            "minimum-energy-path floor 4 alpha dE/(gamma mu) over the same bound (a rigorous lower bound)."
        ),
        "reference": {"mu_bohr": _MU_BOHR, "anisotropy_mev": _K_MEV},
        "cases": records,
    }
    (output / "patch_ocp.json").write_text(
        json.dumps(artifact, separators=(",", ":"), allow_nan=False), encoding="utf-8", newline="\n"
    )
    return artifact


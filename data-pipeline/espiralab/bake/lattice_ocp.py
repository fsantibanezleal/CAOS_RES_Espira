"""Bake the free chain optimal control crossover map (Gap 1, full).

For a ferromagnetic chain the free optimal control path is solved over every site's trajectory
(``spinoct.lattice.LatticeOCPSolver``) from three starts (the uniform optimum with a symmetry-breaking
perturbation, a tanh wall, and the minimum energy path), and the cheapest is kept. Every reported cost
is the cost of an explicit feasible trajectory on the same grid as the uniform bound, so each ratio is
an upper bound on the true optimum over uniform rotation, valid even where the optimizer stops early.
The minimum energy path barrier of each chain gives the rigorous floor ``4 alpha dE / (gamma mu)``.

This is the heaviest bake in the product (hours of single-core solves), so it is a separate entry point,
parallel over cases, and checkpointed per solve: an interrupted run resumes where it stopped.
"""

from __future__ import annotations

import json
import os
from concurrent.futures import ProcessPoolExecutor, as_completed
from dataclasses import dataclass
from pathlib import Path

import numpy as np

__all__ = ["GRID", "LatticeCase", "bake_lattice_ocp"]

#: Moment per site (3 Bohr magnetons) and anisotropy per site (0.15 meV), the CrSBr-like reference used
#: across the product's lattice results. Only the dimensionless ratios J/K, alpha, T/tau0 and N enter
#: the reported cost ratios.
_MU_BOHR = 3.0
_K_MEV = 0.15


@dataclass(frozen=True)
class LatticeCase:
    """One point of the crossover map."""

    exchange_over_k: float
    alpha: float
    switching_tau0: float
    n_sites: int
    max_iterations: int

    @property
    def key(self) -> str:
        return (
            f"jk{self.exchange_over_k:g}_a{self.alpha:g}_t{self.switching_tau0:g}_n{self.n_sites}"
        )


def _grid() -> list[LatticeCase]:
    cases = []
    # The dense map at strong damping, where the long-time regime is reached at short T.
    for t in (10.0, 20.0, 40.0, 80.0, 160.0):
        for n in (4, 6, 8, 10, 12, 16, 20, 24, 32):
            cases.append(LatticeCase(10.0, 0.5, t, n, 1500))
    # Confirmation points at the damping of the rest of the product.
    for t in (20.0, 60.0, 150.0, 300.0):
        for n in (8, 12, 16, 24):
            cases.append(LatticeCase(10.0, 0.1, t, n, 3000))
    return cases


GRID: tuple[LatticeCase, ...] = tuple(_grid())

#: Time rows and the rounding kept for the per-case s_z(t, site) map the web draws.
_MAP_ROWS = 48
_MAP_DECIMALS = 3


def _solve_case(case: LatticeCase) -> dict:
    """Solve one case from all three starts; return the record (runs in a worker process)."""
    from spinoct.lattice import LatticeOCPSolver, SpinChain, cost_floor_from_barrier, minimum_energy_path
    from spinoct.units import bohr_magnetons_to_j_per_t, mev_to_joules

    mu = bohr_magnetons_to_j_per_t(_MU_BOHR)
    anisotropy = mev_to_joules(_K_MEV)
    chain = SpinChain(
        n_sites=case.n_sites,
        mu=mu,
        anisotropy_j=anisotropy,
        exchange_j=case.exchange_over_k * anisotropy,
        alpha=case.alpha,
    )
    switching_time = case.switching_tau0 * chain.tau0
    n_images = LatticeOCPSolver.recommended_images(chain, switching_time)
    solver = LatticeOCPSolver(chain, n_images, switching_time)
    bound = solver.uniform_bound()
    mep = minimum_energy_path(chain, initial="wall")
    floor = cost_floor_from_barrier(mep.barrier, mu, case.alpha, chain.gamma)

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
    # Uniform rotation itself is always a feasible candidate at exactly the bound.
    if best_result.cost >= bound:
        best_start = "uniform"
        best_images, best_cost, best_nonuniformity = solver.uniform_images(), bound, 0.0
    else:
        best_images, best_cost = best_result.images, best_result.cost
        best_nonuniformity = best_result.nonuniformity

    rows = np.linspace(0, best_images.shape[0] - 1, _MAP_ROWS).round().astype(int)
    sz_map = np.round(best_images[rows, :, 2], _MAP_DECIMALS)
    return {
        "key": case.key,
        "exchange_over_k": case.exchange_over_k,
        "alpha": case.alpha,
        "switching_tau0": case.switching_tau0,
        "n_sites": case.n_sites,
        "n_images": n_images,
        "uniform_bound_t2s": bound,
        "barrier_over_nk": mep.barrier_over_uniform(chain),
        "floor_ratio": floor / bound,
        "best_start": best_start,
        "best_ratio": best_cost / bound,
        "best_nonuniformity": best_nonuniformity,
        "saving": 1.0 - best_cost / bound,
        "starts": starts,
        "sz_map": {"times_over_t": (rows / rows[-1]).round(4).tolist(), "sz": sz_map.tolist()},
    }


def bake_lattice_ocp(output: Path, workers: int | None = None, checkpoint_dir: Path | None = None) -> dict:
    """Run (or resume) the crossover map and write ``lattice_ocp.json``.

    Args:
        output: the artifacts directory.
        workers: parallel worker processes; defaults to the CPU count minus two.
        checkpoint_dir: where per-case checkpoints live; defaults to ``$ESPIRA_CHECKPOINT_DIR`` or a
            ``.checkpoints/lattice_ocp`` folder next to the artifacts (gitignored).

    Returns:
        The artifact dictionary.
    """
    output.mkdir(parents=True, exist_ok=True)
    if checkpoint_dir is None:
        env = os.environ.get("ESPIRA_CHECKPOINT_DIR")
        checkpoint_dir = Path(env) if env else output.parent / ".checkpoints" / "lattice_ocp"
    checkpoint_dir.mkdir(parents=True, exist_ok=True)
    pending = [c for c in GRID if not (checkpoint_dir / f"{c.key}.json").exists()]
    workers = workers or max(1, (os.cpu_count() or 4) - 2)
    # One BLAS thread per worker: the solves are elementwise numpy, and oversubscription slows them.
    for var in ("OMP_NUM_THREADS", "OPENBLAS_NUM_THREADS", "MKL_NUM_THREADS"):
        os.environ[var] = "1"
    print(f"lattice OCP: {len(GRID) - len(pending)} of {len(GRID)} cases checkpointed, {workers} workers", flush=True)
    if pending:
        with ProcessPoolExecutor(max_workers=workers) as pool:
            futures = {pool.submit(_solve_case, case): case for case in pending}
            for future in as_completed(futures):
                record = future.result()
                (checkpoint_dir / f"{record['key']}.json").write_text(json.dumps(record), encoding="utf-8")
                print(
                    f"  {record['key']:32s} best={record['best_start']:7s} ratio={record['best_ratio']:.4f} "
                    f"floor={record['floor_ratio']:.4f} nonunif={record['best_nonuniformity']:.3f}",
                    flush=True,
                )

    records = [json.loads((checkpoint_dir / f"{c.key}.json").read_text(encoding="utf-8")) for c in GRID]
    declared = {c.key for c in GRID}
    shipped = {r["key"] for r in records}
    if declared != shipped:
        raise RuntimeError(f"declared and shipped cases differ: {sorted(declared ^ shipped)}")
    artifact = {
        "schema": "espira.lattice_ocp/1",
        "description": (
            "Free chain optimal control path versus uniform rotation. best_ratio is the cost of the "
            "cheapest explicit trajectory found over the uniform bound on the same grid (an upper bound "
            "on the true optimum); floor_ratio is the minimum-energy-path floor 4 alpha dE/(gamma mu) "
            "over the same bound (a rigorous lower bound)."
        ),
        "reference": {"mu_bohr": _MU_BOHR, "anisotropy_mev": _K_MEV},
        "cases": records,
    }
    (output / "lattice_ocp.json").write_text(json.dumps(artifact, separators=(",", ":")), encoding="utf-8")
    return artifact

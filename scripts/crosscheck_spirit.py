"""Cross-check the engine's minimum-energy-path barrier against Spirit's GNEB (backlog BL-013).

The floor under every switching cost this product reports is an energy barrier computed by spinoct's
own climbing-image string method. If that method were wrong, every floor would be wrong together and
nothing inside the product would notice. This script asks an independent code, written by other people
and using a different method (the geodesic nudged elastic band of Spirit, Mueller et al.), for the same
barrier on the same chain.

Spirit is NOT a dependency of this product: it is installed separately, this script is run by hand, and
its result is committed as `data/artifacts/external_crosscheck.json` with the Spirit version recorded.
The product never imports it, and CI never installs it.

Both codes are given the same Hamiltonian in the same convention,

    E = -K sum_i (s_i . z)^2 - J sum_<ij> s_i . s_j,

with nearest-neighbour exchange and open boundaries, and both are started from the same tanh-wall path.
The starting point matters: a nudged elastic band relaxes into the valley it is started in, and the
straight interpolation between all-up and all-down is the coherent rotation, whose saddle is exactly
N K. Started there Spirit returns N K, which is a useful check of the conventions and not a check of the
wall barrier.

Two geometries are checked, because the product reports floors on both. The chain is a line of sites.
The patch is the square element of cases C20 and C21, where the wall is a line rather than a point and
the barrier per site falls much further below the coherent N K: at a width of 8 and J/K = 2.5 the engine
puts it at 0.54 N K. A two-dimensional saddle is where a string method is most likely to be caught out
by its own resolution, so it is the half of this cross-check that carries the weight. Sites are indexed
i = y W + x in both codes, which is what lets one path be handed to the other unchanged.

Usage:
    python -m venv .venv-spirit && .venv-spirit/Scripts/pip install spirit spinoct==<pinned>
    .venv-spirit/Scripts/python scripts/crosscheck_spirit.py
"""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SCHEMA = "espira.external-crosscheck/1"
K_MEV = 0.15
MU_BOHR = 3.0
EXCHANGE_OVER_K = 10.0
GNEB_ITERATIONS = 200000
GNEB_CONVERGENCE = 1e-8
#: Agreement demanded of the two codes. They share no code and no method, so anything at this level is
#: the same physics reached twice; a drift past it is a finding, not a tolerance to widen.
TOLERANCE = 1e-5
#: Chain lengths. Short enough for the band to converge in seconds, long enough that the wall is
#: resolved: the wall width at J/K = 10 is about 2.2 sites.
CHAIN_SIZES = (8, 12, 16)
#: Patches, as (width, J/K). Chosen where the engine says the barrier is a wall and not the coherent
#: rotation, which is the only regime in which the two methods can disagree: 0.97, 0.72 and 0.54 N K.
PATCH_CASES = ((8, 10.0), (12, 10.0), (8, 2.5))


def _chain(n_sites: int):
    from spinoct.lattice import SpinChain
    from spinoct.units import bohr_magnetons_to_j_per_t, mev_to_joules

    anisotropy = mev_to_joules(K_MEV)
    return SpinChain(
        n_sites=n_sites,
        mu=bohr_magnetons_to_j_per_t(MU_BOHR),
        anisotropy_j=anisotropy,
        exchange_j=EXCHANGE_OVER_K * anisotropy,
        alpha=0.5,
    )


def _patch(width: int, exchange_over_k: float):
    from spinoct.lattice import SpinPatch
    from spinoct.units import bohr_magnetons_to_j_per_t, mev_to_joules

    anisotropy = mev_to_joules(K_MEV)
    return SpinPatch(
        width=width,
        height=width,
        mu=bohr_magnetons_to_j_per_t(MU_BOHR),
        anisotropy_j=anisotropy,
        exchange_j=exchange_over_k * anisotropy,
        alpha=0.5,
    )


def _ours(lattice):
    """The engine's climbing-image string barrier, in units of K, and the path both codes start from."""
    from spinoct.lattice import mep as spinoct_mep
    from spinoct.lattice import minimum_energy_path, recommended_images

    images = recommended_images(lattice)
    path = minimum_energy_path(lattice, n_images=images, initial="wall", max_iterations=200000)
    return (
        path.barrier / lattice.anisotropy_j,
        spinoct_mep._initial_path(lattice, images, "wall"),
        images,
        path.converged,
    )


def _theirs(n_cells: list[int], exchange_over_k: float, initial: np.ndarray):
    from spirit import chain, configuration, geometry, hamiltonian, parameters, simulation, state, system

    n_images = initial.shape[0]
    with state.State("") as p_state:
        geometry.set_n_cells(p_state, n_cells)
        hamiltonian.set_boundary_conditions(p_state, [False, False, False])
        hamiltonian.set_field(p_state, 0.0, [0, 0, 1])
        hamiltonian.set_anisotropy(p_state, K_MEV, [0, 0, 1])
        hamiltonian.set_exchange(p_state, 1, [exchange_over_k * K_MEV])
        hamiltonian.set_dmi(p_state, 0, [])
        hamiltonian.set_ddi(p_state, hamiltonian.DDI_METHOD_NONE)

        configuration.plus_z(p_state)
        chain.image_to_clipboard(p_state)
        chain.set_length(p_state, n_images)
        for index in range(n_images):
            chain.jump_to_image(p_state, index)
            np.asarray(system.get_spin_directions(p_state))[:] = initial[index]
            system.update_data(p_state)

        parameters.gneb.set_convergence(p_state, GNEB_CONVERGENCE)
        simulation.start(p_state, simulation.METHOD_GNEB, simulation.SOLVER_VP, n_iterations=GNEB_ITERATIONS)
        energies = np.asarray(chain.get_energy(p_state), dtype=float)
        parameters.gneb.set_climbing_falling(
            p_state, parameters.gneb.IMAGE_CLIMBING, idx_image=int(np.argmax(energies))
        )
        simulation.start(p_state, simulation.METHOD_GNEB, simulation.SOLVER_VP, n_iterations=GNEB_ITERATIONS)
        energies = np.asarray(chain.get_energy(p_state), dtype=float)
        return float((energies.max() - energies[0]) / K_MEV), int(np.argmax(energies))


def main() -> int:
    import spinoct
    from spirit import version

    geometries: list[tuple[str, int, int, float, object]] = [
        ("chain", n_sites, 1, EXCHANGE_OVER_K, _chain(n_sites)) for n_sites in CHAIN_SIZES
    ]
    geometries += [
        ("patch", width, width, exchange_over_k, _patch(width, exchange_over_k))
        for width, exchange_over_k in PATCH_CASES
    ]

    rows = []
    for kind, width, height, exchange_over_k, lattice in geometries:
        ours, initial, images, converged = _ours(lattice)
        theirs, saddle = _theirs([width, height, 1], exchange_over_k, initial)
        rows.append(
            {
                "geometry": kind,
                "width": width,
                "height": height,
                "n_sites": width * height,
                "exchange_over_k": exchange_over_k,
                "images": images,
                "spinoct_barrier_over_k": ours,
                "spinoct_converged": converged,
                "spirit_barrier_over_k": theirs,
                "spirit_saddle_image": saddle,
                "barrier_over_nk": ours / (width * height),
                "relative_difference": abs(theirs - ours) / ours,
            }
        )
        print(
            f"{kind:5s} {width}x{height} J/K={exchange_over_k:4.1f} spinoct={ours:.6f} "
            f"spirit={theirs:.6f} relative difference={rows[-1]['relative_difference']:.2e}",
            flush=True,
        )

    worst = max(r["relative_difference"] for r in rows)
    artifact = {
        "schema": SCHEMA,
        "description": (
            "The minimum-energy-path barrier of an open spin chain and of a square patch, computed "
            "twice: by spinoct's climbing-image string method and by Spirit's geodesic nudged elastic "
            "band, from the same tanh-wall initial path and the same Hamiltonian. The two codes share "
            "no code and no method."
        ),
        "engines": {
            "spinoct": spinoct.__display_version__,
            "spirit": str(version.version),
        },
        "anisotropy_mev": K_MEV,
        "moment_bohr": MU_BOHR,
        "tolerance": TOLERANCE,
        "measured_on": date.today().isoformat(),
        "worst_relative_difference": worst,
        "agrees": bool(worst <= TOLERANCE),
        "rows": rows,
    }
    path = ROOT / "data" / "artifacts" / "external_crosscheck.json"
    path.write_text(json.dumps(artifact, indent=2, allow_nan=False), encoding="utf-8", newline="\n")
    print(f"worst relative difference {worst:.2e} against a tolerance of {TOLERANCE:.0e}; wrote {path}")
    return 0 if artifact["agrees"] else 1


if __name__ == "__main__":
    raise SystemExit(main())

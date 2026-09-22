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

on an open chain with nearest-neighbour exchange, and both are started from the same tanh-wall path. The
starting point matters: a nudged elastic band relaxes into the valley it is started in, and the straight
interpolation between all-up and all-down is the coherent rotation, whose saddle is exactly N K. Started
there Spirit returns N K, which is a useful check of the conventions and not a check of the wall barrier.

Usage:
    python -m venv .venv-spirit && .venv-spirit/Scripts/pip install spirit spinoct==<pinned>
    .venv-spirit/Scripts/python scripts/crosscheck_spirit.py [n_sites ...]
"""

from __future__ import annotations

import json
import sys
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


def _ours(n_sites: int):
    from spinoct.lattice import SpinChain, minimum_energy_path, recommended_images
    from spinoct.lattice import mep as spinoct_mep
    from spinoct.units import bohr_magnetons_to_j_per_t, mev_to_joules

    anisotropy = mev_to_joules(K_MEV)
    lattice = SpinChain(
        n_sites=n_sites,
        mu=bohr_magnetons_to_j_per_t(MU_BOHR),
        anisotropy_j=anisotropy,
        exchange_j=EXCHANGE_OVER_K * anisotropy,
        alpha=0.5,
    )
    images = recommended_images(lattice)
    path = minimum_energy_path(lattice, n_images=images, initial="wall", max_iterations=200000)
    return path.barrier / anisotropy, spinoct_mep._initial_path(lattice, images, "wall"), images, path.converged


def _theirs(n_sites: int, initial: np.ndarray):
    from spirit import chain, configuration, geometry, hamiltonian, parameters, simulation, state, system

    n_images = initial.shape[0]
    with state.State("") as p_state:
        geometry.set_n_cells(p_state, [n_sites, 1, 1])
        hamiltonian.set_boundary_conditions(p_state, [False, False, False])
        hamiltonian.set_field(p_state, 0.0, [0, 0, 1])
        hamiltonian.set_anisotropy(p_state, K_MEV, [0, 0, 1])
        hamiltonian.set_exchange(p_state, 1, [EXCHANGE_OVER_K * K_MEV])
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

    sizes = [int(a) for a in sys.argv[1:]] or [8, 12, 16]
    rows = []
    for n_sites in sizes:
        ours, initial, images, converged = _ours(n_sites)
        theirs, saddle = _theirs(n_sites, initial)
        rows.append(
            {
                "n_sites": n_sites,
                "exchange_over_k": EXCHANGE_OVER_K,
                "images": images,
                "spinoct_barrier_over_k": ours,
                "spinoct_converged": converged,
                "spirit_barrier_over_k": theirs,
                "spirit_saddle_image": saddle,
                "relative_difference": abs(theirs - ours) / ours,
            }
        )
        print(
            f"N={n_sites:3d} spinoct={ours:.6f} spirit={theirs:.6f} "
            f"relative difference={rows[-1]['relative_difference']:.2e}",
            flush=True,
        )

    worst = max(r["relative_difference"] for r in rows)
    artifact = {
        "schema": SCHEMA,
        "description": (
            "The minimum-energy-path barrier of an open spin chain, computed twice: by spinoct's "
            "climbing-image string method and by Spirit's geodesic nudged elastic band, from the same "
            "tanh-wall initial path and the same Hamiltonian. The two codes share no code and no method."
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

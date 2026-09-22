"""The live-lane parity fixture: what the browser's own implementation has to reproduce.

The lane gate (``espiralab.core.gate``) puts C03 in the live lane, and the web carries its own
TypeScript implementation of that closed form rather than replaying the bake. The workbench already
shows the agreement between the two on the case's own working point, but that is a single number at a
single parameter set: the elliptic integral underneath it is exercised at one modulus, and an
implementation can be right there and wrong elsewhere.

This fixture is the wider check. It pins, from the offline lane, the complete elliptic integral of the
first kind over a grid that reaches the singular end, and the protocol's own reported quantities over
the case's switching-time sweep. The web recomputes both in the browser, shows the largest deviation,
and a browser gate fails the build when it grows. The values come from SciPy and from the engine, which
are the two references the product already trusts for these quantities.
"""

from __future__ import annotations

import numpy as np
from scipy.special import ellipk

from ..cases import get_case
from ..stages.infer import _SOT_COUPLING, _system

__all__ = ["PARITY_SCHEMA", "bake_live_parity"]

PARITY_SCHEMA = "espira.live-parity/1"

#: The moduli the fixture pins, in the PARAMETER convention m = k^2, the one the engine and the web both
#: use. The grid reaches 0.999 on purpose: K(m) diverges logarithmically as m approaches one, and an
#: arithmetic-geometric mean that stops one step early shows it there first.
_M_GRID = (0.0, 0.05, 0.1, 0.25, 0.4, 0.5, 0.6, 0.75, 0.9, 0.95, 0.99, 0.999)

#: Agreement demanded of each quantity, relative. The elliptic integral is the same algorithm in both
#: languages on IEEE doubles, so it is held near machine precision; the protocol goes through more
#: arithmetic and is held to a part in a billion, still far tighter than anything the product claims.
_TOLERANCES = {"elliptic_k": 1e-13, "protocol": 1e-9}

#: The live case, and the switching times the fixture covers (its declared sweep).
_LIVE_CASE = "sot-analytic"


def bake_live_parity() -> dict:
    """The committed parity fixture for the live lane."""
    from spinoct.analytic.sot import SOTOptimalControl, ideal_sot_ratio_beta

    case = get_case(_LIVE_CASE)
    system = _system(case, case.axis.values[0], uniaxial=True)
    beta = ideal_sot_ratio_beta(system.alpha)
    protocol_rows = []
    for variant in case.axis.values:
        switching_time = variant * system.tau0
        protocol = SOTOptimalControl(
            system=system, switching_time=switching_time, xi=_SOT_COUPLING, beta=beta
        )
        protocol_rows.append(
            {
                "switching_time_tau0": float(variant),
                "switching_time_s": float(switching_time),
                "mean_current_reduced": float(protocol.mean_current()),
                "cost_fast_reduced": float(protocol.cost_fast()),
                "characteristic_time_s": float(protocol.characteristic_time_ideal()),
            }
        )

    return {
        "schema": PARITY_SCHEMA,
        "case": _LIVE_CASE,
        "code": case.code,
        "description": (
            "Values the browser implementation of the live lane must reproduce: the complete elliptic "
            "integral of the first kind K(m) in the parameter convention, from SciPy, and the "
            "closed-form spin-orbit-torque protocol over the case's switching times, from spinoct."
        ),
        "inputs": {
            "alpha": float(system.alpha),
            "gamma": float(system.gamma),
            "anisotropy_j": float(system.anisotropy_j),
            "mu": float(system.mu),
            "tau0_s": float(system.tau0),
            "xi": float(_SOT_COUPLING),
            "beta": float(beta),
        },
        "tolerances": dict(_TOLERANCES),
        "elliptic_k": [
            {"m": float(m), "k": float(ellipk(m))} for m in _M_GRID if np.isfinite(ellipk(m))
        ],
        "protocol": protocol_rows,
    }

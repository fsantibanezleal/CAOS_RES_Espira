"""Seeded randomness. A run is a pure function of (parameters, seed), so every seed is drawn here.

The seed is drawn BEFORE any object is constructed, never inside a constructor: a generator drawn during
construction makes the result depend on the order in which objects are built, which silently moves
published numbers when a rung is added.
"""

from __future__ import annotations

import numpy as np

__all__ = ["make_rng"]


def make_rng(seed: int) -> np.random.Generator:
    """The generator for a seed.

    Args:
        seed: the case's declared seed.

    Returns:
        A numpy generator, independent of any global state.
    """
    return np.random.default_rng(seed)

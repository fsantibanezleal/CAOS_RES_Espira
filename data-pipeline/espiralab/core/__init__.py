"""Cross-cutting pipeline machinery: seeded randomness, the artifact manifest (Contract 2), and the
measured lane gate."""

from __future__ import annotations

from .gate import GateVerdict, classify_lane
from .manifest import Manifest, MethodResult, build_manifest, sha256_of
from .rng import make_rng

__all__ = [
    "GateVerdict",
    "Manifest",
    "MethodResult",
    "build_manifest",
    "classify_lane",
    "make_rng",
    "sha256_of",
]

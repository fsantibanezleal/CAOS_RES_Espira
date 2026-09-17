"""The live-versus-precompute lane gate, decided by measurement rather than by hand.

A case may run live in the browser only if its method is pure analysis (a closed form the web can
evaluate in TypeScript), its measured runtime is under the budget, and its artifact is small enough to
ship. Anything else is precompute: the offline bake computes it and the web replays the committed
artifact. The verdict and its numbers go into the manifest, so a mislabelled lane is visible.
"""

from __future__ import annotations

from dataclasses import dataclass

__all__ = ["GateVerdict", "classify_lane", "LIVE_METHODS", "RUNTIME_BUDGET_MS", "ARTIFACT_BUDGET_BYTES"]

#: Methods with a closed form cheap enough to evaluate in the browser. Everything else needs the engine.
LIVE_METHODS = frozenset({"R00", "R01", "R05", "R06"})
#: A case must compute in under this wall time to be a live candidate, measured in the offline run.
RUNTIME_BUDGET_MS = 250.0
#: And its artifact must stay under this size, so a live page does not download a bake.
ARTIFACT_BUDGET_BYTES = 512 * 1024


@dataclass(frozen=True)
class GateVerdict:
    """The lane a case runs in, with the measurements behind it."""

    lane: str
    runtime_ms: float
    artifact_bytes: int
    methods: tuple[str, ...]
    reasons: tuple[str, ...]

    def describe(self) -> dict[str, object]:
        return {
            "lane": self.lane,
            "runtime_ms": round(self.runtime_ms, 3),
            "artifact_bytes": self.artifact_bytes,
            "methods": list(self.methods),
            "reasons": list(self.reasons),
        }


def classify_lane(methods: tuple[str, ...], runtime_ms: float, artifact_bytes: int) -> GateVerdict:
    """Decide the lane from measurements.

    Args:
        methods: the methods the case runs.
        runtime_ms: the measured wall time of the case's computation.
        artifact_bytes: the size of the committed artifact.

    Returns:
        The :class:`GateVerdict`; the lane is ``live`` only when every check passes.
    """
    reasons = []
    heavy = sorted(set(methods) - LIVE_METHODS)
    if heavy:
        reasons.append(f"methods {heavy} have no closed form for the browser")
    if runtime_ms > RUNTIME_BUDGET_MS:
        reasons.append(f"runtime {runtime_ms:.0f} ms over the {RUNTIME_BUDGET_MS:.0f} ms budget")
    if artifact_bytes > ARTIFACT_BUDGET_BYTES:
        reasons.append(f"artifact {artifact_bytes} bytes over the {ARTIFACT_BUDGET_BYTES} byte budget")
    return GateVerdict(
        lane="precompute" if reasons else "live",
        runtime_ms=runtime_ms,
        artifact_bytes=artifact_bytes,
        methods=tuple(methods),
        reasons=tuple(reasons),
    )

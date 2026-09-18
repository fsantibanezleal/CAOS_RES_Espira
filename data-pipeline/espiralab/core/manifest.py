"""Contract 2: the per-case manifest that binds an artifact to how it was produced.

An artifact on its own says what a number is, not whether it can be trusted. The manifest records the
case and its declared contract, the engine version, the seed, the methods actually run and their result
rows, the artifact's byte size and sha256, the measured lane verdict, and the completeness of the
method x variant matrix. `validate` refuses a release whose manifest and artifact disagree, and the
frontend mirrors the shape so a drift fails the web build.
"""

from __future__ import annotations

import hashlib
import json
from dataclasses import asdict, dataclass, field
from pathlib import Path

__all__ = ["Manifest", "MethodResult", "build_manifest", "sha256_of"]

MANIFEST_SCHEMA = "espira.manifest/2"


def sha256_of(path: Path) -> str:
    """The hex digest of a file, read in binary so the value does not depend on line endings."""
    digest = hashlib.sha256()
    digest.update(path.read_bytes())
    return digest.hexdigest()


@dataclass(frozen=True)
class MethodResult:
    """One cell of the method x variant matrix.

    Attributes:
        method: the rung identifier (R00, R05, R07, ...).
        variant: the value of the case's variant family.
        cost: the switching cost, T^2 s, or None when the method does not apply or did not switch.
        switched: whether the moment reversed.
        applicable: False when the method is not defined for this case, with the reason recorded.
        reason: why a cell is not applicable or has no cost.
        metrics: any further numbers the method reports; None where a quantity does not exist
            (a ratio to a cost that was never produced), never infinity, which is not JSON.
    """

    method: str
    variant: float
    cost: float | None
    switched: bool
    applicable: bool = True
    reason: str = ""
    metrics: dict[str, float | None] = field(default_factory=dict)

    def describe(self) -> dict[str, object]:
        return asdict(self)


@dataclass(frozen=True)
class Manifest:
    """The Contract 2 record for one case."""

    schema: str
    case: str
    code: str
    status: str
    engine: str
    engine_version: str
    seed: int
    split: str
    ground_truth: str
    methods: tuple[str, ...]
    variants: tuple[float, ...]
    artifact_path: str
    artifact_bytes: int
    artifact_sha256: str
    lane: dict[str, object]
    completeness: dict[str, int]
    results: tuple[MethodResult, ...]
    parameter_flags: tuple[str, ...]

    def describe(self) -> dict[str, object]:
        return {
            "schema": self.schema,
            "case": self.case,
            "code": self.code,
            "status": self.status,
            "engine": self.engine,
            "engine_version": self.engine_version,
            "seed": self.seed,
            "split": self.split,
            "ground_truth": self.ground_truth,
            "methods": list(self.methods),
            "variants": list(self.variants),
            "artifact": {
                "path": self.artifact_path,
                "bytes": self.artifact_bytes,
                "sha256": self.artifact_sha256,
            },
            "lane": self.lane,
            "completeness": self.completeness,
            "results": [r.describe() for r in self.results],
            "parameter_flags": list(self.parameter_flags),
        }

    def write(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(self.describe(), indent=2, allow_nan=False), encoding="utf-8", newline="\n")


def build_manifest(
    case,
    artifact_path: Path,
    results: list[MethodResult],
    lane: dict[str, object],
    engine_version: str,
    parameter_flags: list[str],
) -> Manifest:
    """Assemble the manifest for a baked case.

    Completeness counts the cells the case declared (methods times variants) against the cells that were
    actually produced, so a missing one fails the release gate instead of being averaged away.
    """
    expected = len(case.methods) * len(case.axis.values)
    # A cell counts as produced when the method ran and reported something: a cost, or metrics in
    # its own units (the spin-orbit-torque protocol reports a current integral, not a field cost).
    produced = sum(1 for r in results if r.applicable and (r.cost is not None or r.metrics))
    not_applicable = sum(1 for r in results if not r.applicable)
    return Manifest(
        schema=MANIFEST_SCHEMA,
        case=case.slug,
        code=case.code,
        status=case.status,
        engine="spinoct",
        engine_version=engine_version,
        seed=case.seed,
        split=case.split,
        ground_truth=case.ground_truth,
        methods=tuple(case.methods),
        variants=tuple(case.axis.values),
        artifact_path=artifact_path.name,
        artifact_bytes=artifact_path.stat().st_size,
        artifact_sha256=sha256_of(artifact_path),
        lane=lane,
        completeness={
            "expected": expected,
            "produced": produced,
            "not_applicable": not_applicable,
            "missing": expected - produced - not_applicable,
        },
        results=tuple(results),
        parameter_flags=tuple(parameter_flags),
    )

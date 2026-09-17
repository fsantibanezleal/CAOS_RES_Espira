"""Stage ``validate``: refuse a release whose evidence does not hold together.

Checks every artifact against its manifest (the hash is the artifact on disk), every manifest against the
registry (methods, variants, seed, split), the completeness of the method x variant matrix, and the
declared-versus-shipped case list. Returns the problems; the orchestrator turns a non-empty list into a
failed release.
"""

from __future__ import annotations

import json
from pathlib import Path

from ..cases import CASES, baked_cases
from ..core.manifest import sha256_of

__all__ = ["validate_release"]


def validate_release(output: Path, manifests: Path) -> list[str]:
    """Every problem found in a baked release, as messages (empty when the release holds together)."""
    problems: list[str] = []
    expected = baked_cases("workbench")

    for slug, case in expected.items():
        artifact = output / f"{slug}.json"
        manifest_path = manifests / f"{slug}.json"
        if not artifact.exists():
            problems.append(f"{slug}: no artifact")
            continue
        if not manifest_path.exists():
            problems.append(f"{slug}: no manifest")
            continue
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        if manifest["artifact"]["sha256"] != sha256_of(artifact):
            problems.append(f"{slug}: the artifact does not match its manifest hash")
        if manifest["artifact"]["bytes"] != artifact.stat().st_size:
            problems.append(f"{slug}: the artifact size does not match its manifest")
        if tuple(manifest["methods"]) != tuple(case.methods):
            problems.append(f"{slug}: manifest methods {manifest['methods']} differ from the registry")
        if tuple(manifest["variants"]) != tuple(case.axis.values):
            problems.append(f"{slug}: manifest variants differ from the registry")
        if manifest["seed"] != case.seed or manifest["split"] != case.split:
            problems.append(f"{slug}: manifest seed or split differs from the registry")
        completeness = manifest["completeness"]
        if completeness["missing"] != 0:
            problems.append(
                f"{slug}: {completeness['missing']} of {completeness['expected']} declared cells missing"
            )

    shipped = {p.stem for p in manifests.glob("*.json")} - {"index"}
    if shipped != set(expected):
        problems.append(f"manifests and baked cases differ: {sorted(shipped ^ set(expected))}")

    benchmark_path = output / "benchmark.json"
    if not benchmark_path.exists():
        problems.append("no benchmark.json")
    else:
        benchmark = json.loads(benchmark_path.read_text(encoding="utf-8"))
        if sorted(c["case"] for c in benchmark["cases"]) != sorted(expected):
            problems.append("benchmark cases differ from the baked cases")
        if not benchmark["complete"]:
            problems.append("the benchmark reports an incomplete method matrix")

    for slug, case in CASES.items():
        if case.status == "baked" and case.surface == "workbench" and slug not in expected:
            problems.append(f"{slug}: declared baked but not in the release")
    return problems

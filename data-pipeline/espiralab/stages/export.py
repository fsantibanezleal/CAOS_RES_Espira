"""Stage ``export``: write the committed artifacts, their Contract 2 manifests, and the benchmark.

The per-case artifact is what the workbench replays; the manifest binds it to how it was produced (engine
version, seed, methods, hashes, the measured lane verdict, completeness); the benchmark is the cross-case
method matrix the Benchmark page shows. All three are written here and nowhere else.
"""

from __future__ import annotations

import json
import time
from pathlib import Path

import spinoct

from ..bake import bake_all, bake_case, write_artifact, write_index
from ..bake.descriptors import bake_descriptors
from ..bake.pareto import bake_pareto_fronts
from ..bake.parity import bake_live_parity
from ..bake.penalty_test import bake_penalty_test
from ..cases import baked_cases
from ..core.gate import classify_lane
from ..core.manifest import build_manifest
from ..materials import get_material
from .evaluate import evaluate_case
from .infer import infer_case

__all__ = ["export_all", "export_cases"]

BENCHMARK_SCHEMA = "espira.benchmark/1"
MANIFEST_INDEX_SCHEMA = "espira.manifest-index/1"


def _parameter_flags(case) -> list[str]:
    return get_material(case.material).flags if case.material is not None else ["synthetic system"]


def _write_json(path: Path, payload: dict) -> None:
    path.write_text(json.dumps(payload, indent=2, allow_nan=False), encoding="utf-8", newline="\n")


def _export_case(slug: str, case, output: Path, manifests: Path) -> tuple[dict, dict]:
    """Run, score and classify one baked case, and write its manifest.

    Returns:
        The case's benchmark score and its manifest-index entry.
    """
    artifact_path = output / f"{slug}.json"
    started = time.perf_counter()
    run = infer_case(case)
    runtime_ms = (time.perf_counter() - started) * 1e3
    score = evaluate_case(case, run.results)
    lane = classify_lane(tuple(case.methods), runtime_ms, artifact_path.stat().st_size)
    # The lane verdict needs the artifact's size and the measured runtime, so it cannot be known
    # while the artifact is being written. The bake emits the live inputs for every case whose
    # method the browser can evaluate; this drops them again from the cases the gate put in the
    # precompute lane, so the contract's "present only on a live-lane case" stays exactly true and
    # the workbench cannot offer a recompute the lane does not claim. Done before the manifest, so
    # the committed hash is of the file as it ships.
    if lane.lane != "live":
        artifact = json.loads(artifact_path.read_text(encoding="utf-8"))
        if artifact.get("live_inputs") is not None:
            artifact["live_inputs"] = None
            _write_json(artifact_path, artifact)
    manifest = build_manifest(
        case,
        artifact_path,
        list(run.results),
        lane.describe(),
        spinoct.__display_version__,
        _parameter_flags(case),
    )
    manifest.write(manifests / f"{slug}.json")
    entry = {
        "case": slug,
        "code": case.code,
        "manifest": f"{slug}.json",
        "sha256": manifest.artifact_sha256,
        "lane": lane.lane,
        "completeness": manifest.completeness,
    }
    return score.describe(), entry


def export_cases(output: Path, manifests: Path, slugs: list[str]) -> list[str]:
    """Re-export named cases into an existing release and leave the rest of it as it is.

    Rebakes each case's artifact, reruns its methods, rewrites its manifest, and replaces its entries in
    the manifest index and the benchmark; the coverage index is rebuilt from the registry and the
    artifacts on disk. Nothing else is touched. A change that reaches only some cases, such as a registry
    text corrected from a later measurement, must not rebake the release: the lane gate is a runtime
    threshold, and re-timing every case can move a borderline one across it for no reason in the change.

    Args:
        output: the release's artifact directory.
        manifests: the release's manifest directory.
        slugs: the workbench cases to re-export.

    Returns:
        The slugs re-exported, in registry order.

    Raises:
        KeyError: a slug that is not a baked workbench case.
    """
    cases = baked_cases("workbench")
    unknown = sorted(set(slugs) - set(cases))
    if unknown:
        raise KeyError(f"not baked workbench cases: {', '.join(unknown)}")
    manifest_index = json.loads((manifests / "index.json").read_text(encoding="utf-8"))
    benchmark = json.loads((output / "benchmark.json").read_text(encoding="utf-8"))
    done = []
    for slug, case in cases.items():
        if slug not in slugs:
            continue
        write_artifact(output, slug, bake_case(case))
        score, entry = _export_case(slug, case, output, manifests)
        manifest_index["manifests"] = [entry if m["case"] == slug else m for m in manifest_index["manifests"]]
        benchmark["manifests"] = [entry if m["case"] == slug else m for m in benchmark["manifests"]]
        benchmark["cases"] = [score if s["case"] == slug else s for s in benchmark["cases"]]
        done.append(slug)
    benchmark["complete"] = all(s["complete"] for s in benchmark["cases"])
    write_index(output)
    _write_json(output / "benchmark.json", benchmark)
    _write_json(manifests / "index.json", manifest_index)
    return done


def export_all(output: Path, manifests: Path) -> dict:
    """Bake the cases, run every declared method, and write artifacts, manifests and the benchmark."""
    index = bake_all(output)
    manifests.mkdir(parents=True, exist_ok=True)

    scores, manifest_index = [], []
    for slug, case in baked_cases("workbench").items():
        score, entry = _export_case(slug, case, output, manifests)
        scores.append(score)
        manifest_index.append(entry)

    benchmark = {
        "schema": BENCHMARK_SCHEMA,
        "engine": {"name": "spinoct", "version": spinoct.__display_version__},
        "cases": scores,
        "manifests": manifest_index,
        "complete": all(s["complete"] for s in scores),
    }
    (output / "benchmark.json").write_text(
        json.dumps(benchmark, indent=2, allow_nan=False), encoding="utf-8", newline="\n"
    )
    # The device trade-off front (R14): milliseconds per point over the closed-form family.
    (output / "pareto.json").write_text(
        json.dumps(bake_pareto_fronts(), indent=2, allow_nan=False), encoding="utf-8", newline="\n"
    )
    # Exploitability descriptors (BL-026): pure arithmetic over Contract 1 plus the hard-axis map.
    (output / "descriptors.json").write_text(
        json.dumps(bake_descriptors(output), indent=2, allow_nan=False), encoding="utf-8", newline="\n"
    )
    # Does the penalty predict the ensemble (BL-020): 30 ensembles of 1,000 copies, about half a
    # minute, and it guards a claim the engine makes about itself.
    (output / "penalty_test.json").write_text(
        json.dumps(bake_penalty_test(), indent=2, allow_nan=False), encoding="utf-8", newline="\n"
    )
    # The live lane's parity fixture: cheap to produce, and it belongs with the artifacts it guards.
    (output / "live_parity.json").write_text(
        json.dumps(bake_live_parity(), indent=2, allow_nan=False), encoding="utf-8", newline="\n"
    )
    _write_json(manifests / "index.json", {"schema": MANIFEST_INDEX_SCHEMA, "manifests": manifest_index})
    return {"index": index, "benchmark": benchmark}

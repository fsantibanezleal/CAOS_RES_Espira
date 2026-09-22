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

from ..bake import bake_all
from ..bake.pareto import bake_pareto_fronts
from ..bake.parity import bake_live_parity
from ..bake.penalty_test import bake_penalty_test
from ..cases import baked_cases
from ..core.gate import classify_lane
from ..core.manifest import build_manifest
from ..materials import get_material
from .evaluate import evaluate_case
from .infer import infer_case

__all__ = ["export_all"]

BENCHMARK_SCHEMA = "espira.benchmark/1"


def _parameter_flags(case) -> list[str]:
    return get_material(case.material).flags if case.material is not None else ["synthetic system"]


def export_all(output: Path, manifests: Path) -> dict:
    """Bake the cases, run every declared method, and write artifacts, manifests and the benchmark."""
    index = bake_all(output)
    manifests.mkdir(parents=True, exist_ok=True)

    scores, manifest_index = [], []
    for slug, case in baked_cases("workbench").items():
        artifact_path = output / f"{slug}.json"
        started = time.perf_counter()
        run = infer_case(case)
        runtime_ms = (time.perf_counter() - started) * 1e3
        score = evaluate_case(case, run.results)
        lane = classify_lane(tuple(case.methods), runtime_ms, artifact_path.stat().st_size)
        manifest = build_manifest(
            case,
            artifact_path,
            list(run.results),
            lane.describe(),
            spinoct.__display_version__,
            _parameter_flags(case),
        )
        manifest.write(manifests / f"{slug}.json")
        scores.append(score.describe())
        manifest_index.append(
            {
                "case": slug,
                "code": case.code,
                "manifest": f"{slug}.json",
                "sha256": manifest.artifact_sha256,
                "lane": lane.lane,
                "completeness": manifest.completeness,
            }
        )

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
    # Does the penalty predict the ensemble (BL-020): 30 ensembles of 1,000 copies, about half a
    # minute, and it guards a claim the engine makes about itself.
    (output / "penalty_test.json").write_text(
        json.dumps(bake_penalty_test(), indent=2, allow_nan=False), encoding="utf-8", newline="\n"
    )
    # The live lane's parity fixture: cheap to produce, and it belongs with the artifacts it guards.
    (output / "live_parity.json").write_text(
        json.dumps(bake_live_parity(), indent=2, allow_nan=False), encoding="utf-8", newline="\n"
    )
    (manifests / "index.json").write_text(
        json.dumps({"schema": "espira.manifest-index/1", "manifests": manifest_index}, indent=2, allow_nan=False),
        encoding="utf-8",
        newline="\n",
    )
    return {"index": index, "benchmark": benchmark}

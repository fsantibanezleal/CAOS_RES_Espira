"""The staged pipeline: the lane gate, the manifest, the split plan, the scores and the release gate.

The heavy stages (infer over every method, the full release) are exercised on the smallest real case in
a sandbox; the canonical `data/artifacts` and `manifests` are never written by a test.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

import pytest

from espiralab.cases import baked_cases, get_case
from espiralab.core.gate import ARTIFACT_BUDGET_BYTES, RUNTIME_BUDGET_MS, classify_lane
from espiralab.core.manifest import MethodResult, build_manifest, sha256_of
from espiralab.stages.dataset import plan_matrix, splits
from espiralab.stages.evaluate import evaluate_case
from espiralab.stages.infer import infer_case
from espiralab.stages.validate import validate_release

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / "data" / "artifacts"
MANIFESTS = ROOT / "manifests"


# ------------------------------------------------------------------ the lane gate


def test_a_closed_form_case_inside_both_budgets_is_live() -> None:
    verdict = classify_lane(("R05",), RUNTIME_BUDGET_MS / 2, ARTIFACT_BUDGET_BYTES // 2)
    assert verdict.lane == "live" and verdict.reasons == ()


@pytest.mark.parametrize(
    ("methods", "runtime", "size", "reason"),
    [
        (("R05", "R07"), 1.0, 1000, "no closed form"),
        (("R05",), RUNTIME_BUDGET_MS * 2, 1000, "over the"),
        (("R05",), 1.0, ARTIFACT_BUDGET_BYTES * 2, "byte budget"),
    ],
)
def test_each_gate_reason_forces_precompute(methods, runtime, size, reason) -> None:
    verdict = classify_lane(methods, runtime, size)
    assert verdict.lane == "precompute"
    assert any(reason in r for r in verdict.reasons)


def test_the_shipped_cases_declare_their_measured_lane() -> None:
    """Every baked case declares a measured lane, and a precompute verdict says why.

    A `live` verdict is only allowed when the web can actually evaluate the case, which the next test
    enforces against the browser implementation; a `precompute` verdict must carry its reasons.
    """
    for slug in baked_cases("workbench"):
        manifest = json.loads((MANIFESTS / f"{slug}.json").read_text(encoding="utf-8"))
        assert manifest["lane"]["lane"] in ("live", "precompute")
        assert manifest["lane"]["runtime_ms"] > 0
        if manifest["lane"]["lane"] == "precompute":
            assert manifest["lane"]["reasons"], slug
        else:
            assert not manifest["lane"]["reasons"], slug


def test_a_live_lane_case_can_actually_be_computed_in_the_browser() -> None:
    """A `live` verdict is a claim about the web app, so the web app must be able to honour it.

    The lane gate measures the engine. If it puts a case in the live lane and nothing on the client can
    evaluate it, the manifest says something the product does not do. The frontend carries its own
    implementation of the closed forms it can run, and the case must ship the inputs it needs.
    """
    implemented = (ROOT / "frontend" / "src" / "engine").glob("*.ts")
    browser_methods = set()
    for module in implemented:
        text = module.read_text(encoding="utf-8")
        browser_methods.update(re.findall(r"BROWSER_METHOD\s*=\s*'([^']+)'", text))
    assert browser_methods, "the frontend declares no browser method implementation"

    for slug in baked_cases("workbench"):
        manifest = json.loads((MANIFESTS / f"{slug}.json").read_text(encoding="utf-8"))
        if manifest["lane"]["lane"] != "live":
            continue
        artifact = json.loads((ARTIFACTS / f"{slug}.json").read_text(encoding="utf-8"))
        assert artifact["live_inputs"], f"{slug} is live but ships no inputs for the browser"
        assert set(manifest["methods"]) <= browser_methods, (
            f"{slug} is live but the browser implements only {sorted(browser_methods)}"
        )


# ------------------------------------------------------------------ the manifest


def test_manifest_binds_the_artifact_by_hash(tmp_path: Path) -> None:
    case = get_case("fe3gete2-field")
    artifact = tmp_path / "artifact.json"
    artifact.write_text('{"hello": 1}', encoding="utf-8")
    results = [
        MethodResult(method=m, variant=v, cost=1e-12, switched=True)
        for m in case.methods
        for v in case.axis.values
    ]
    manifest = build_manifest(case, artifact, results, {"lane": "precompute"}, "0.0.0", ["flag"])
    assert manifest.artifact_sha256 == sha256_of(artifact)
    assert manifest.completeness == {
        "expected": len(case.methods) * len(case.axis.values),
        "produced": len(results),
        "not_applicable": 0,
        "missing": 0,
    }


def test_manifest_counts_a_missing_cell(tmp_path: Path) -> None:
    case = get_case("fe3gete2-field")
    artifact = tmp_path / "artifact.json"
    artifact.write_text("{}", encoding="utf-8")
    results = [MethodResult(method=case.methods[0], variant=case.axis.values[0], cost=1e-12, switched=True)]
    manifest = build_manifest(case, artifact, results, {}, "0.0.0", [])
    assert manifest.completeness["missing"] == manifest.completeness["expected"] - 1


# ------------------------------------------------------------------ dataset and evaluate


def test_the_plan_counts_every_declared_cell() -> None:
    plan = plan_matrix()
    assert plan.expected == sum(len(c.methods) * len(c.axis.values) for c in baked_cases("workbench").values())
    by_split = splits()
    assert not set(by_split["train"]) & set(by_split["test"])


def test_infer_and_evaluate_produce_a_complete_matrix_for_a_real_case() -> None:
    """The cheapest real case, end to end: every declared cell is produced or explicitly not applicable."""
    case = get_case("cr2ge2te6-floor")
    run = infer_case(case)
    score = evaluate_case(case, run.results)
    assert score.complete
    for method in score.methods:
        assert method.produced + method.not_applicable == method.cells
    analytic = next(m for m in score.methods if m.method == "R05")
    assert analytic.worst_ratio_to_oracle == pytest.approx(1.0)


def test_a_method_the_stage_cannot_run_is_an_error_not_a_silent_gap() -> None:
    from espiralab.stages.infer import MethodNotImplemented, _run_method

    case = get_case("cr2ge2te6-floor")
    with pytest.raises(MethodNotImplemented, match="R99"):
        _run_method(case, "R99", case.axis.values[0], 10.0)


# ------------------------------------------------------------------ the release gate


def test_the_committed_release_validates() -> None:
    assert validate_release(ARTIFACTS, MANIFESTS) == []


def test_validate_catches_a_tampered_artifact(tmp_path: Path) -> None:
    import shutil

    artifacts, manifests = tmp_path / "artifacts", tmp_path / "manifests"
    shutil.copytree(ARTIFACTS, artifacts)
    shutil.copytree(MANIFESTS, manifests)
    target = artifacts / "cri3-field.json"
    data = json.loads(target.read_text(encoding="utf-8"))
    data["cost_curve"][0]["cost"] *= 1.5
    target.write_text(json.dumps(data), encoding="utf-8")
    problems = validate_release(artifacts, manifests)
    assert any("does not match its manifest hash" in p for p in problems)


def test_validate_catches_a_missing_manifest(tmp_path: Path) -> None:
    import shutil

    artifacts, manifests = tmp_path / "artifacts", tmp_path / "manifests"
    shutil.copytree(ARTIFACTS, artifacts)
    shutil.copytree(MANIFESTS, manifests)
    (manifests / "cri3-field.json").unlink()
    problems = validate_release(artifacts, manifests)
    assert any("no manifest" in p for p in problems)


def test_the_model_registry_records_the_policy_and_its_gate() -> None:
    registry = json.loads((ROOT / "models" / "registry.json").read_text(encoding="utf-8"))
    model = registry["models"][0]
    assert model["method"] == "R15"
    assert model["acceptance"]["passed"] is True
    assert not set(model["train_materials"]) & set(model["held_out_materials"])
    held_out = {s["material"] for s in model["acceptance"]["scores"]}
    assert held_out == set(model["held_out_materials"])
    for score in model["acceptance"]["scores"]:
        assert score["switched"] and score["cost_ratio"] <= 1.10


def test_no_manifest_reports_a_peak_below_its_own_mean() -> None:
    """The invariant that would have caught F-028 the day it shipped.

    Every method block that records both a mean and a peak amplitude of the same pulse is recording two
    numbers about one function, and the peak cannot be the smaller of them. For three releases it was:
    the closed-form peak was sampled at the start and the midpoint of the pulse, which are the two
    points where the amplitude is at its lowest, so the shipped manifests carried a "peak" of 2.726 T
    beside a mean of 2.727 T and nothing objected.
    """
    offenders, inspected = [], 0
    for slug in baked_cases("workbench"):
        manifest = json.loads((MANIFESTS / f"{slug}.json").read_text(encoding="utf-8"))
        for result in manifest["results"]:
            metrics = result.get("metrics") or {}
            mean, peak = metrics.get("mean_amplitude_t"), metrics.get("peak_amplitude_t")
            if not isinstance(mean, (int, float)) or not isinstance(peak, (int, float)):
                continue
            inspected += 1
            if peak < mean:
                offenders.append(
                    f"{slug} {result['method']} at {result['variant']}: "
                    f"peak {peak:.6g} below mean {mean:.6g}"
                )
    # A check that inspects nothing passes for the wrong reason, and this one shipped vacuous on its
    # first run because it read a manifest shape that does not exist.
    assert inspected >= 50, f"the invariant only reached {inspected} metric pairs"
    assert not offenders, offenders

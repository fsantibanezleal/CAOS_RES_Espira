"""The pipeline orchestrator: the named stages, in order, with a command line.

    python data-pipeline/run.py [all|ingest|preprocess|dataset|features|train|infer|evaluate|export|validate]
    python data-pipeline/run.py export --only <slug>[,<slug>...]

Every stage is a pure function of its inputs and the declared seeds. `all` runs the release sequence:
ingest and preprocess the parameters through Contract 1, fix the split and the matrix, train the learned
policy on the training split, run every declared method, score them, export artifacts, manifests and the
benchmark, then validate the release and fail if the evidence does not hold together.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

from .cases import coverage_counts
from .stages.dataset import plan_matrix, splits
from .stages.export import export_all, export_cases
from .stages.ingest import ingest
from .stages.preprocess import preprocess
from .stages.train import train_policy
from .stages.validate import validate_release

__all__ = ["STAGES", "PipelineResult", "run_pipeline"]

STAGES = (
    "ingest",
    "preprocess",
    "dataset",
    "features",
    "train",
    "infer",
    "evaluate",
    "export",
    "validate",
)


class ReleaseRefused(RuntimeError):
    """The validate stage found problems; the release is not written as canonical."""


@dataclass
class PipelineResult:
    """What the run produced, for the command line and the tests."""

    materials: int
    cases: dict[str, int]
    planned_cells: int
    policy_passed: bool
    problems: list[str]


def run_pipeline(output: Path, manifests: Path, strict: bool = True) -> PipelineResult:
    """Run the release sequence into a directory pair.

    Args:
        output: where the artifacts go (the committed `data/artifacts` for a release).
        manifests: where the Contract 2 manifests go.
        strict: raise when validate reports problems.

    Returns:
        The :class:`PipelineResult`.
    """
    report = ingest()
    materials = preprocess(report, strict=True)
    plan = plan_matrix()
    policy = train_policy(write=True)
    # infer, evaluate and export run per case inside export_all, which writes what they produced.
    export_all(output, manifests)
    problems = validate_release(output, manifests)
    if problems and strict:
        raise ReleaseRefused("\n".join(f"  {p}" for p in problems))
    return PipelineResult(
        materials=len(materials),
        cases=coverage_counts(),
        planned_cells=plan.expected,
        policy_passed=policy.passed,
        problems=problems,
    )


def main(argv: list[str]) -> int:
    root = Path(__file__).resolve().parents[2]
    only: list[str] = []
    if "--only" in argv:
        at = argv.index("--only")
        only = [s for s in argv[at + 1].split(",") if s] if at + 1 < len(argv) else []
        argv = argv[:at] + argv[at + 2 :]
        if not only:
            print("--only needs a comma-separated list of case slugs")
            return 2
    stage = argv[1] if len(argv) > 1 else "all"
    output = Path(argv[2]) if len(argv) > 2 else root / "data" / "artifacts"
    manifests = Path(argv[3]) if len(argv) > 3 else root / "manifests"

    if stage in ("all", "release"):
        result = run_pipeline(output, manifests)
        print(
            f"materials {result.materials} | cases {result.cases} | declared cells {result.planned_cells} "
            f"| policy gate {'passed' if result.policy_passed else 'FAILED'}"
        )
        print(f"artifacts in {output}, manifests in {manifests}")
        return 0
    if stage == "ingest":
        report = ingest()
        print(json.dumps({"ok": report.ok, "rejected": report.rejected, "flags": len(report.flagged)}, indent=2))
        return 0 if report.ok else 1
    if stage == "preprocess":
        print(f"{len(preprocess(ingest()))} materials canonicalized")
        return 0
    if stage == "dataset":
        plan = plan_matrix()
        print(json.dumps({"splits": splits(), "declared_cells": plan.expected}, indent=2))
        return 0
    if stage == "train":
        policy = train_policy(write=True)
        print(f"policy gate {'passed' if policy.passed else 'FAILED'} on {list(policy.test_materials)}")
        return 0 if policy.passed else 1
    if stage == "export" and only:
        done = export_cases(output, manifests, only)
        problems = validate_release(output, manifests)
        print(f"re-exported {', '.join(done)}; " + ("release valid" if not problems else "\n".join(problems)))
        return 0 if not problems else 1
    if stage in ("features", "infer", "evaluate", "export"):
        export_all(output, manifests)
        print(f"artifacts in {output}, manifests in {manifests}")
        return 0
    if stage == "validate":
        problems = validate_release(output, manifests)
        print("release valid" if not problems else "\n".join(problems))
        return 0 if not problems else 1
    print(f"unknown stage {stage!r}; one of: all, {', '.join(STAGES)}")
    return 2

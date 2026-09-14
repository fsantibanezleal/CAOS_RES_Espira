"""The committed artifacts: consistent on disk, current with the database, and the checker actually fails.

These tests read `data/artifacts/` and never write it; every corruption is made on a temporary copy.
"""

from __future__ import annotations

import importlib.util
import json
import shutil
from pathlib import Path

import pytest

from espiralab.cases import CASES
from espiralab.materials import get_material

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / "data" / "artifacts"


def _load_checker():
    spec = importlib.util.spec_from_file_location("check_artifacts", ROOT / "scripts" / "check_artifacts.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


check = _load_checker().check


@pytest.fixture()
def artifact_copy(tmp_path: Path) -> Path:
    target = tmp_path / "artifacts"
    shutil.copytree(ARTIFACTS, target)
    return target


def _rewrite(path: Path, mutate) -> None:
    data = json.loads(path.read_text(encoding="utf-8"))
    mutate(data)
    path.write_text(json.dumps(data), encoding="utf-8")


def test_committed_artifacts_pass_the_checker() -> None:
    assert check(ARTIFACTS) == []


def test_checker_catches_a_missing_case_file(artifact_copy: Path) -> None:
    (artifact_copy / "fe3gete2-field.json").unlink()
    assert any("index and case files differ" in e for e in check(artifact_copy))


def test_checker_catches_a_variant_mismatch(artifact_copy: Path) -> None:
    _rewrite(artifact_copy / "cri3-field.json", lambda d: d["pulses"].pop())
    assert any("do not match" in e for e in check(artifact_copy))


def test_checker_catches_a_ratio_above_the_uniform_bound(artifact_copy: Path) -> None:
    def mutate(d):
        d["cases"][0]["best_ratio"] = 1.01

    _rewrite(artifact_copy / "lattice_ocp.json", mutate)
    assert any("above the uniform bound" in e for e in check(artifact_copy))


def test_checker_catches_a_ratio_below_the_floor(artifact_copy: Path) -> None:
    def mutate(d):
        case = d["cases"][-1]
        case["best_ratio"] = 0.5 * case["floor_ratio"]

    _rewrite(artifact_copy / "lattice_ocp.json", mutate)
    assert any("below its floor" in e for e in check(artifact_copy))


def test_index_matches_the_registry() -> None:
    index = json.loads((ARTIFACTS / "index.json").read_text(encoding="utf-8"))
    assert sorted(e["slug"] for e in index["cases"]) == sorted(CASES)
    for entry in index["cases"]:
        case = CASES[entry["slug"]]
        assert entry["category"] == case.category
        assert entry["material"] == case.material


@pytest.mark.parametrize("slug", sorted(CASES))
def test_artifact_is_current_with_the_database_and_registry(slug: str) -> None:
    """A stale bake ships old parameters or an old sweep: the artifact must match the source of truth."""
    artifact = json.loads((ARTIFACTS / f"{slug}.json").read_text(encoding="utf-8"))
    case = CASES[slug]
    assert artifact["switching_times_tau0"] == list(case.switching_times_tau0)
    assert artifact["material"] == json.loads(json.dumps(get_material(case.material).describe()))


def test_manuscript_facts_are_generated_from_the_shipped_map() -> None:
    """Every M2 headline number comes from lattice_ocp.json; recompute them and compare."""
    data = json.loads((ARTIFACTS / "lattice_ocp.json").read_text(encoding="utf-8"))
    facts = json.loads(
        (ROOT / "manuscripts" / "beyond-macrospin" / "tex" / "tables" / "facts.json").read_text(encoding="utf-8")
    )
    cases = data["cases"]
    best = max(cases, key=lambda c: c["saving"])
    assert facts["n_cases"] == len(cases)
    assert facts["n_saving"] == sum(1 for c in cases if c["saving"] > 0.01)
    assert facts["best_key"] == best["key"]
    assert facts["best_saving_percent"] == round(100 * best["saving"], 1)
    assert facts["min_ratio_over_floor"] == round(min(c["best_ratio"] / c["floor_ratio"] for c in cases), 4)

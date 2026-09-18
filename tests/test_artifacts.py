"""The committed artifacts: consistent on disk, current with the database, and the checker actually fails.

These tests read `data/artifacts/` and never write it; every corruption is made on a temporary copy.
"""

from __future__ import annotations

import importlib.util
import json
import shutil
from pathlib import Path

import pytest

from espiralab.cases import CASES, baked_cases
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
    """The index ships the baked workbench cases, and declares the whole registry with its statuses."""
    index = json.loads((ARTIFACTS / "index.json").read_text(encoding="utf-8"))
    assert sorted(e["slug"] for e in index["cases"]) == sorted(baked_cases("workbench"))
    for entry in index["cases"]:
        case = CASES[entry["slug"]]
        assert entry["category"] == case.category
        assert entry["material"] == case.material
    assert sorted(r["slug"] for r in index["registry"]) == sorted(CASES)
    assert index["coverage"]["baked"] + index["coverage"]["planned"] + index["coverage"]["blocked"] == len(CASES)
    for row in index["registry"]:
        case = CASES[row["slug"]]
        assert row["status"] == case.status and row["variants"] == len(case.axis.values)
        assert bool(row["blocked_reason"]) == (case.status == "blocked")


@pytest.mark.parametrize("slug", sorted(baked_cases("workbench")))
def test_artifact_is_current_with_the_database_and_registry(slug: str) -> None:
    """A stale bake ships old parameters or an old sweep: the artifact must match the source of truth."""
    artifact = json.loads((ARTIFACTS / f"{slug}.json").read_text(encoding="utf-8"))
    case = CASES[slug]
    assert artifact["axis"]["values"] == list(case.axis.values)
    assert artifact["axis"]["name"] == case.axis.name
    assert artifact["case"]["kill_criterion"] == case.kill_criterion
    assert artifact["case"]["status"] == case.status
    if case.material is not None:
        assert artifact["material"] == json.loads(json.dumps(get_material(case.material).describe()))
    else:
        assert artifact["material"]["slug"] == "synthetic-reference"
        assert artifact["material"]["anisotropy_mev"] == case.synthetic.anisotropy_mev


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


# ------------------------------------------------------------------ manuscript M1 against its artifacts


def _m1_tables() -> dict[str, list[list[str]]]:
    """The rows of each tabular in M1, keyed by the table label, as cell strings."""
    import re

    tex = (ROOT / "manuscripts" / "reliability-realizability" / "tex" / "main.tex").read_text(encoding="utf-8")
    tables = {}
    for match in re.finditer(r"\\label\{(tab:[a-z]+)\}.*?\\midrule(.*?)\\bottomrule", tex, flags=re.S):
        rows = []
        for line in match.group(2).strip().splitlines():
            line = line.strip().rstrip("\\").strip()
            if line:
                rows.append([cell.strip() for cell in line.split("&")])
        tables[match.group(1)] = rows
    return tables


def _number(cell: str) -> float:
    r"""A table cell as a float: `$0.735 \pm 0.035$` gives 0.735, `$6.1\times10^{-12}$` gives 6.1e-12."""
    import re

    cell = cell.replace("$", "")
    cell = cell.split(r"\pm")[0].strip()
    scientific = re.fullmatch(r"([0-9.]+)\s*\\times\s*10\^\{(-?[0-9]+)\}", cell)
    if scientific:
        return float(scientific.group(1)) * 10.0 ** int(scientific.group(2))
    return float(cell)


def test_m1_table_1_reproduces_from_the_reliability_front() -> None:
    """Every number M1 prints in its front table must come from the committed artifact.

    Version 1 of M1 printed a correct table and then misread it in prose. This does not check prose,
    but it does make the table the thing the prose must be reconciled with, never a hand-typed copy.
    """
    points = json.loads((ARTIFACTS / "novel.json").read_text(encoding="utf-8"))["reliability_front"]["points"]
    rows = _m1_tables()["tab:front"]
    assert len(rows) == len(points)
    for row, point in zip(rows, points, strict=True):
        assert _number(row[0]) == pytest.approx(point["br_over_anisotropy"])
        assert _number(row[1]) == pytest.approx(point["hyperbolic_fraction"], abs=0.005)
        assert _number(row[2]) == pytest.approx(point["success_rate"], abs=0.0005)
        assert _number(row[3]) == pytest.approx(point["added_cost"], rel=0.05, abs=1e-13)


def test_m1_table_2_reproduces_from_case_c07() -> None:
    rows_tex = _m1_tables()["tab:delta"]
    curve = json.loads((ARTIFACTS / "thermal-success-rate.json").read_text(encoding="utf-8"))["cost_curve"]
    assert len(rows_tex) == len(curve)
    for row, point in zip(rows_tex, curve, strict=True):
        assert _number(row[0]) == pytest.approx(point["variant"])
        assert _number(row[1]) == pytest.approx(point["r11"]["temperature_k"], abs=0.005)
        assert _number(row[2]) == pytest.approx(point["r11"]["success_rate"], abs=0.0005)
        assert _number(row[3]) == pytest.approx(point["r12"]["success_rate"], abs=0.0005)


def test_m1_quotes_the_added_cost_against_the_bare_cost_correctly() -> None:
    """The sentence version 1 got wrong, pinned: the added cost as a multiple of the bare optimal cost.

    An earlier text said the added cost stays "well below the bare switching cost". The artifact says 2.5
    times at one anisotropy field and 15.8 times at two and a half, and the manuscript must quote those.
    """
    tex = (ROOT / "manuscripts" / "reliability-realizability" / "tex" / "main.tex").read_text(encoding="utf-8")
    points = json.loads((ARTIFACTS / "novel.json").read_text(encoding="utf-8"))["reliability_front"]["points"]
    bare = json.loads((ARTIFACTS / "thermal-success-rate.json").read_text(encoding="utf-8"))["cost_curve"][0][
        "field_cost_reference"
    ]
    multiples = {p["br_over_anisotropy"]: p["added_cost"] / bare for p in points}
    assert f"{multiples[1.0]:.1f} times" in tex
    assert f"{multiples[2.5]:.1f} times" in tex
    assert "well below the bare" not in tex

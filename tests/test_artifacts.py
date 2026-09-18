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


def test_checker_catches_a_floor_from_an_unconverged_patch_path(artifact_copy: Path) -> None:
    def mutate(d):
        case = next(c for c in d["cases"] if c["floor_ratio"] is not None)
        case["barrier_converged"] = False

    _rewrite(artifact_copy / "patch_ocp.json", mutate)
    assert any("reports a floor from an unconverged path" in e for e in check(artifact_copy))


def test_checker_catches_a_converged_patch_path_without_its_floor(artifact_copy: Path) -> None:
    def mutate(d):
        next(c for c in d["cases"] if c["barrier_converged"])["floor_ratio"] = None

    _rewrite(artifact_copy / "patch_ocp.json", mutate)
    assert any("converged path but no floor" in e for e in check(artifact_copy))


def test_checker_catches_a_patch_map_of_the_wrong_width(artifact_copy: Path) -> None:
    def mutate(d):
        d["cases"][0]["sz_map"]["sz_by_column"][0].pop()

    _rewrite(artifact_copy / "patch_ocp.json", mutate)
    assert any("reversal map shape mismatch" in e for e in check(artifact_copy))


def _patch_cases() -> list[dict]:
    return json.loads((ARTIFACTS / "patch_ocp.json").read_text(encoding="utf-8"))["cases"]


def _crossover_side(cases: list[dict], exchange_over_k: float) -> int | None:
    beaten = [c["width"] for c in cases if c["exchange_over_k"] == exchange_over_k and c["best_ratio"] < 1.0]
    return min(beaten) if beaten else None


def test_patch_sweep_covers_both_regimes_on_the_declared_sides() -> None:
    from espiralab.bake.patch_ocp import GRID

    cases = _patch_cases()
    assert sorted(c["key"] for c in cases) == sorted(case.key for case in GRID)
    for c in cases:
        assert c["wall_width_sites"] == pytest.approx((c["exchange_over_k"] / 2.0) ** 0.5)
    # C20 is the J/K = 10 regime and C21 the J/K = 2.5 one; each declares the sides the bake solves.
    for slug, exchange_over_k in (("patch-crossover", 10.0), ("patch-narrow-wall", 2.5)):
        sides = sorted(float(c.width) for c in GRID if c.exchange_over_k == exchange_over_k)
        assert sides == list(CASES[slug].axis.values)
        assert CASES[slug].surface == "experiments" and CASES[slug].status == "baked"


def test_stronger_anisotropy_moves_the_patch_crossover_to_smaller_sides() -> None:
    """The measured C20/C21 result the Experiments tab states: the narrower wall (J/K = 2.5) already
    beats uniform rotation on the smallest patch, where the wider wall (J/K = 10) does not."""
    cases = _patch_cases()
    wide, narrow = _crossover_side(cases, 10.0), _crossover_side(cases, 2.5)
    assert narrow is not None and wide is not None
    assert narrow < wide
    smallest = min(c["width"] for c in cases)
    assert next(c for c in cases if c["exchange_over_k"] == 10.0 and c["width"] == smallest)["best_ratio"] == 1.0


def test_patch_upper_bound_is_not_monotone_in_size() -> None:
    """The tab says the upper bound does not always fall with size; hold it to a measured rise."""
    cases = _patch_cases()
    rises = []
    for jk in {c["exchange_over_k"] for c in cases}:
        ratios = [c["best_ratio"] for c in sorted((c for c in cases if c["exchange_over_k"] == jk), key=lambda c: c["width"])]
        rises += [b - a for a, b in zip(ratios[:-1], ratios[1:], strict=True) if b > a]
    assert rises


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


# ------------------------------------------------------------------ the constrained cases' inequalities


def _artifact(slug: str) -> dict:
    return json.loads((ARTIFACTS / f"{slug}.json").read_text(encoding="utf-8"))


def test_more_bandwidth_never_costs_more_in_the_shipped_artifact() -> None:
    """C23's declared inequality, asserted on what was actually shipped.

    More harmonics is a strictly larger feasible set, so the cost cannot rise with bandwidth. The engine
    once returned 2.2 times the analytic optimum at two harmonics and 14 times at six; the case was held
    blocked until the engine could satisfy this, and the artifact must keep satisfying it.
    """
    rows = _artifact("crab-bandwidth")["cost_curve"]
    harmonics = [row["variant"] for row in rows]
    assert harmonics == sorted(harmonics)
    costs = [row["cost"] for row in rows]
    assert all(cost is not None for cost in costs), "every bandwidth in the sweep must reverse the moment"
    for lower, higher in zip(costs, costs[1:], strict=False):
        assert higher <= lower * 1.01, f"more bandwidth cost more: {costs}"


def test_no_constrained_case_reports_a_cost_below_the_analytic_optimum() -> None:
    """The floor: the closed form is the cheapest complete FIELD-DRIVEN reversal at that switching time.

    A field-only constrained solver can match it or pay more. A cost below it means the pulse stopped
    part way and banked the saving, which is the failure the engine's reversal threshold exists to
    prevent. The hybrid case is deliberately excluded: there the current does part of the work, so its
    field cost can and does fall far below the field-only optimum (0.001 of it at the cheapest current),
    and applying this floor to it would be asserting the wrong physics.
    """
    for slug in ("crab-bandwidth", "grape-amplitude-slew"):
        for row in _artifact(slug)["cost_curve"]:
            if row["cost"] is None:
                assert row.get("switched") is False, f"{slug} has no cost but claims to have switched"
                assert row.get("reason"), f"{slug} reports no cost without saying why"
                continue
            assert row["cost"] >= row["analytic_cost"] * 0.995, (
                f"{slug} at variant {row['variant']} costs less than the analytic optimum"
            )


def test_a_cap_that_cannot_reverse_the_moment_reports_no_cost() -> None:
    """C24 exists to find the amplitude below which there is no answer; the artifact must show it.

    A sweep where every cap succeeds would mean the swept window never reaches the constraint, and the
    case would be measuring nothing.
    """
    rows = _artifact("grape-amplitude-slew")["cost_curve"]
    failures = [row for row in rows if row["cost"] is None]
    successes = [row for row in rows if row["cost"] is not None]
    assert failures, "no amplitude cap in the sweep was tight enough to prevent a reversal"
    assert successes, "no amplitude cap in the sweep allowed a reversal"
    # And the failures are the tight caps, not scattered: the threshold is a threshold.
    assert max(row["variant"] for row in failures) < min(row["variant"] for row in successes)


def test_the_hybrid_moves_cost_onto_the_current_as_it_gets_cheaper() -> None:
    """C25's declared behaviour: a cheaper current shifts the optimum away from the field."""
    rows = _artifact("field-plus-current")["cost_curve"]
    prices = [row["variant"] for row in rows]
    shares = [row["field_fraction"] for row in rows]
    assert prices == sorted(prices)
    assert shares[0] < shares[-1], f"a cheaper current did not shift cost onto the current: {shares}"


def test_every_hybrid_point_actually_reversed_the_moment() -> None:
    """The hybrid has no field-cost floor, so what keeps it honest is that every point is a reversal."""
    for row in _artifact("field-plus-current")["cost_curve"]:
        assert row["switched"] is True and row["cost"] is not None, row["variant"]


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


def test_the_chirp_replication_records_the_published_values_and_the_gap() -> None:
    """C08 is a non-replication, and the shipped artifact must say so, value by value.

    Every amplitude the source reports carries the published probability beside the engine's, so the
    gap is in the data the app draws, not only in prose. The engine's own curve must rise with the
    amplitude, which is what a switching threshold is.
    """
    rows = _artifact("sot-down-chirp")["cost_curve"]
    published = {row["variant"]: row["r04"].get("published_rate") for row in rows}
    assert {v for v, p in published.items() if p is not None} == {0.17, 0.18, 0.20}
    rates = [row["success_rate"] for row in rows]
    assert rates == sorted(rates), f"switching probability does not rise with the amplitude: {rates}"
    at_017 = next(row for row in rows if row["variant"] == 0.17)["r04"]
    assert at_017["gap_to_published"] < -0.5, "the engine now reproduces the published value at 0.17 j0"


def test_every_shipped_barrier_came_from_a_converged_minimum_energy_path() -> None:
    """The barrier floors in the free-chain map and in manuscript M2 rest on the string method.

    That solver reports `converged = False` when it hits its iteration cap and still returns a barrier:
    at J/K = 40 on 53 sites it returned 764 K, forty times the continuum wall energy. The lattice bake
    never recorded convergence, so this recomputes the barrier of every distinct chain the product
    ships (seconds each) and requires both convergence and agreement with the shipped value.
    """
    from spinoct.lattice import SpinChain, minimum_energy_path
    from spinoct.units import bohr_magnetons_to_j_per_t, mev_to_joules

    data = json.loads((ARTIFACTS / "lattice_ocp.json").read_text(encoding="utf-8"))
    reference = data["reference"]
    mu = bohr_magnetons_to_j_per_t(reference["mu_bohr"])
    anisotropy = mev_to_joules(reference["anisotropy_mev"])
    chains = {}
    for case in data["cases"]:
        chains.setdefault((case["n_sites"], case["exchange_over_k"]), set()).add(case["barrier_over_nk"])
    for (n_sites, exchange_over_k), shipped in chains.items():
        chain = SpinChain(
            n_sites=n_sites, mu=mu, anisotropy_j=anisotropy, exchange_j=exchange_over_k * anisotropy, alpha=0.1
        )
        path = minimum_energy_path(chain, initial="wall")
        assert path.converged, f"N = {n_sites}: the barrier behind a shipped floor did not converge"
        for value in shipped:
            assert path.barrier / (n_sites * anisotropy) == pytest.approx(value, rel=1e-6)


def test_every_shipped_file_is_strict_json() -> None:
    """Python's json writes Infinity and NaN by default; browsers refuse both.

    A C24 row that did not switch carried `over_analytic: Infinity`, and the whole artifact failed to
    parse in the app, which only a browser gate noticed. Every shipped JSON file must parse with those
    constants rejected, and the writers now refuse to produce them.
    """

    def reject(name: str) -> None:
        raise ValueError(f"non-finite constant {name}")

    shipped = [*ARTIFACTS.glob("*.json"), *(ROOT / "manifests").glob("*.json"), *(ROOT / "models").glob("*.json")]
    assert shipped
    for path in shipped:
        json.loads(path.read_text(encoding="utf-8"), parse_constant=reject)


def test_the_lattice_barrier_converges_onto_the_continuum_wall_energy() -> None:
    """C22 in the shipped data: from below, monotonically, with the deficit falling as 1 / w^2."""
    rows = _artifact("continuum-cross-check")["cost_curve"]
    ratios = [row["barrier_over_continuum"] for row in rows]
    assert all(row["r16"]["converged"] == 1.0 for row in rows), "an unconverged path was shipped"
    assert all(ratio < 1.0 for ratio in ratios), f"a lattice barrier exceeds the continuum value: {ratios}"
    assert ratios == sorted(ratios), f"the barrier does not approach the continuum monotonically: {ratios}"
    scaled = [row["r16"]["deficit_times_width_squared"] for row in rows]
    assert max(scaled) / min(scaled) < 1.2, f"the deficit does not scale as 1 / w^2: {scaled}"

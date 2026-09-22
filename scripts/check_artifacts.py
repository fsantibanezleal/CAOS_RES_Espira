"""Validate the committed artifacts the web replays (Contract 2 on disk). Stdlib only, so CI runs it
without installing the engine. Exit non-zero on any drift.

Checks:
- index.json lists every case file and every case file is listed (declared equals shipped);
- each case artifact is non-empty, carries the index's schema version, and has one pulse per variant;
- novel.json, lattice_ocp.json and patch_ocp.json exist and parse;
- the free chain map is internally consistent: every case key is unique, its best ratio lies between
  its minimum-energy-path floor and the uniform bound (the floor is a rigorous lower bound, and uniform
  rotation is always a feasible candidate), and its reversal map has one row of N sites per time sample;
- the two-dimensional patch sweep (C20, C21) meets the same bounds, a floor is reported only from a
  converged path (null otherwise), every patch is square, and its column-averaged map has one value
  per column.
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / "data" / "artifacts"
RESERVED = {"index.json", "novel.json", "lattice_ocp.json", "patch_ocp.json", "live_parity.json", "pareto.json", "benchmark.json"}
#: Relative slack for the ratio bounds: the costs are floating-point sums of order 1e-12 T^2 s.
TOLERANCE = 1e-9


def check(artifacts: Path) -> list[str]:
    """Every contract violation found in an artifacts directory, as messages (empty when consistent)."""
    errors: list[str] = []
    index_path = artifacts / "index.json"
    if not index_path.exists():
        return [f"missing {index_path} (run scripts/precompute first)"]
    index = json.loads(index_path.read_text(encoding="utf-8"))
    declared = {entry["slug"] for entry in index.get("cases", [])}
    shipped = {p.stem for p in artifacts.glob("*.json") if p.name not in RESERVED}
    if declared != shipped:
        errors.append(f"index and case files differ: {sorted(declared ^ shipped)}")

    for slug in sorted(declared & shipped):
        path = artifacts / f"{slug}.json"
        if path.stat().st_size == 0:
            errors.append(f"{slug}: empty artifact")
            continue
        artifact = json.loads(path.read_text(encoding="utf-8"))
        if artifact.get("schema_version") != index.get("schema_version"):
            errors.append(f"{slug}: schema {artifact.get('schema_version')} != index {index.get('schema_version')}")
        if artifact.get("case", {}).get("slug") != slug:
            errors.append(f"{slug}: artifact names a different case")
        axis = artifact.get("axis", {})
        variants = axis.get("values", [])
        if len(variants) < 6:
            errors.append(f"{slug}: {len(variants)} variants, fewer than the six the case contract requires")
        if len(artifact.get("pulses", [])) != len(variants) or len(artifact.get("cost_curve", [])) != len(variants):
            errors.append(f"{slug}: pulses/cost_curve do not match the {len(variants)} variants")
        if [row.get("variant") for row in artifact.get("cost_curve", [])] != list(variants):
            errors.append(f"{slug}: the cost curve does not follow the declared {axis.get('name')} variants")
        for field in ("kill_criterion", "expectation", "reason"):
            if not str(artifact.get("case", {}).get(field, "")).strip():
                errors.append(f"{slug}: the artifact carries no {field}")

    registry = index.get("registry", [])
    if len(registry) < 26:
        errors.append(f"the index declares {len(registry)} registry rows, fewer than the planned 26 cases")
    baked = {row["slug"] for row in registry if row["status"] == "baked" and row["surface"] == "workbench"}
    if baked != declared:
        errors.append(f"registry baked cases and index cases differ: {sorted(baked ^ declared)}")
    for row in registry:
        if row["status"] == "blocked" and not row["blocked_reason"].strip():
            errors.append(f"registry {row['slug']}: blocked without a reason")
        if row["variants"] < 6:
            errors.append(f"registry {row['slug']}: {row['variants']} variants, fewer than six")

    for name in ("novel.json", "lattice_ocp.json", "benchmark.json"):
        if not (artifacts / name).exists():
            errors.append(f"missing {name}")

    benchmark_path = artifacts / "benchmark.json"
    if benchmark_path.exists():
        benchmark = json.loads(benchmark_path.read_text(encoding="utf-8"))
        if sorted(c["case"] for c in benchmark["cases"]) != sorted(declared):
            errors.append("benchmark cases differ from the index cases")
        if not benchmark["complete"]:
            errors.append("the benchmark reports an incomplete method x variant matrix")
        for case in benchmark["cases"]:
            for method in case["methods"]:
                if method["produced"] + method["not_applicable"] != method["cells"]:
                    errors.append(f"benchmark {case['case']}/{method['method']}: incomplete cells")

    lattice_path = artifacts / "lattice_ocp.json"
    if lattice_path.exists():
        lattice = json.loads(lattice_path.read_text(encoding="utf-8"))
        keys = [c["key"] for c in lattice["cases"]]
        if len(keys) != len(set(keys)):
            errors.append("lattice_ocp: duplicate case keys")
        for case in lattice["cases"]:
            ratio, floor = case["best_ratio"], case["floor_ratio"]
            if ratio > 1.0 + TOLERANCE:
                errors.append(f"lattice_ocp {case['key']}: best ratio {ratio} above the uniform bound")
            if ratio < floor * (1.0 - TOLERANCE):
                errors.append(f"lattice_ocp {case['key']}: best ratio {ratio} below its floor {floor}")
            sz = case["sz_map"]["sz"]
            if len(sz) != len(case["sz_map"]["times_over_t"]) or any(len(row) != case["n_sites"] for row in sz):
                errors.append(f"lattice_ocp {case['key']}: reversal map shape mismatch")

    pareto_path = artifacts / "pareto.json"
    if pareto_path.exists():
        pareto = json.loads(pareto_path.read_text(encoding="utf-8"))
        if pareto.get("schema") != "espira.pareto/1":
            errors.append(f"pareto: schema {pareto.get('schema')}")
        for entry in pareto.get("materials", []):
            points = entry["points"]
            if len(points) < 12:
                errors.append(f"pareto {entry['material']}: {len(points)} points, too few for a trade-off")
            if entry["front_size"] != sum(1 for p in points if not p["dominated"]):
                errors.append(f"pareto {entry['material']}: front size disagrees with the dominated flags")
            times = [p["switching_time_tau0"] for p in points]
            if times != sorted(times) or len(set(times)) != len(times):
                errors.append(f"pareto {entry['material']}: switching times are not a strictly rising sweep")
            # Every objective is positive and finite, or a log axis and a fitted slope are meaningless.
            for p in points:
                if min(p["cost"], p["peak_field_t"], p["bandwidth_hz"]) <= 0.0:
                    errors.append(f"pareto {entry['material']}: a non-positive objective at T = {p['switching_time_tau0']}")
                    break
    else:
        errors.append("missing pareto.json")

    parity_path = artifacts / "live_parity.json"
    if parity_path.exists():
        parity = json.loads(parity_path.read_text(encoding="utf-8"))
        if parity.get("schema") != "espira.live-parity/1":
            errors.append(f"live_parity: schema {parity.get('schema')}")
        if len(parity.get("elliptic_k", [])) < 8 or len(parity.get("protocol", [])) < 6:
            errors.append("live_parity: too few pinned values to exercise the browser implementation")
        for row in parity.get("elliptic_k", []):
            if not 0.0 <= row["m"] < 1.0 or row["k"] < 1.5:
                errors.append(f"live_parity: K({row['m']}) = {row['k']} outside the real branch")
        # A fixture is only a check while the live case is still in the live lane.
        if parity.get("case") not in {row["slug"] for row in registry}:
            errors.append(f"live_parity: names {parity.get('case')}, which is not a declared case")
    else:
        errors.append("missing live_parity.json")

    patch_path = artifacts / "patch_ocp.json"
    if patch_path.exists():
        patch = json.loads(patch_path.read_text(encoding="utf-8"))
        keys = [c["key"] for c in patch["cases"]]
        if len(keys) != len(set(keys)):
            errors.append("patch_ocp: duplicate case keys")
        for case in patch["cases"]:
            ratio, floor = case["best_ratio"], case["floor_ratio"]
            if ratio > 1.0 + TOLERANCE:
                errors.append(f"patch_ocp {case['key']}: best ratio {ratio} above the uniform bound")
            # An unconverged string's top energy is not the saddle, so its floor bounds nothing: it must
            # be withheld (null), and a converged one must be present and below the best ratio.
            if not case["barrier_converged"]:
                if floor is not None or case["barrier_over_nk"] is not None:
                    errors.append(f"patch_ocp {case['key']}: reports a floor from an unconverged path")
            elif floor is None:
                errors.append(f"patch_ocp {case['key']}: converged path but no floor")
            elif ratio < floor * (1.0 - TOLERANCE):
                errors.append(f"patch_ocp {case['key']}: best ratio {ratio} below its floor {floor}")
            if case["n_sites"] != case["width"] ** 2:
                errors.append(f"patch_ocp {case['key']}: {case['n_sites']} sites on a {case['width']}-wide square")
            sz = case["sz_map"]["sz_by_column"]
            if len(sz) != len(case["sz_map"]["times_over_t"]) or any(len(row) != case["width"] for row in sz):
                errors.append(f"patch_ocp {case['key']}: reversal map shape mismatch")
    else:
        errors.append("missing patch_ocp.json")

    return errors


def main() -> int:
    errors = check(ARTIFACTS)
    if errors:
        print("ARTIFACT CHECK FAILED")
        for e in errors:
            print(f"  - {e}")
        return 1
    index = json.loads((ARTIFACTS / "index.json").read_text(encoding="utf-8"))
    print(f"ARTIFACT CHECK OK: {len(index['cases'])} cases, novel.json, lattice_ocp.json, patch_ocp.json, live_parity.json, pareto.json consistent")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

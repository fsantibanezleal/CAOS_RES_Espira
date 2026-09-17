"""Generate the manuscript tables from the committed crossover artifact, so no number is typed by hand.

Usage: python manuscripts/beyond-macrospin/make_tables.py
Reads data/artifacts/lattice_ocp.json and writes tex/tables/*.tex.
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ARTIFACT = ROOT / "data" / "artifacts" / "lattice_ocp.json"
OUT = Path(__file__).resolve().parent / "tex" / "tables"

BS = "\\"


def cell(ratio: float) -> str:
    text = f"{ratio:.3f}"
    return f"{BS}textbf{{{text}}}" if ratio < 0.99 else text


def ratio_table(cases: list[dict], alpha: float, label: str, caption: str) -> str:
    scoped = [c for c in cases if c["alpha"] == alpha]
    times = sorted({c["switching_tau0"] for c in scoped})
    sizes = sorted({c["n_sites"] for c in scoped})
    lookup = {(c["switching_tau0"], c["n_sites"]): c for c in scoped}
    lines = [
        f"{BS}begin{{table}}[t]",
        f"{BS}centering",
        f"{BS}caption{{{caption}}}",
        f"{BS}label{{{label}}}",
        f"{BS}small",
        f"{BS}begin{{tabular}}{{r{'c' * len(sizes)}}}",
        f"{BS}toprule",
        "$T/" + BS + "tau_0$ & " + " & ".join(f"$N={n}$" for n in sizes) + f" {BS}{BS}",
        f"{BS}midrule",
    ]
    for t in times:
        row = " & ".join(cell(lookup[(t, n)]["best_ratio"]) for n in sizes)
        lines.append(f"{t:g} & {row} {BS}{BS}")
    lines.append(f"{BS}midrule")
    t_long = times[-1]
    floor = " & ".join(f"{lookup[(t_long, n)]['floor_ratio']:.3f}" for n in sizes)
    lines.append(f"floor at {t_long:g} & {floor} {BS}{BS}")
    barrier = " & ".join(f"{lookup[(t_long, n)]['barrier_over_nk']:.3f}" for n in sizes)
    lines.append("$" + BS + "Delta E/(NK)$ & " + barrier + f" {BS}{BS}")
    lines += [f"{BS}bottomrule", f"{BS}end{{tabular}}", f"{BS}end{{table}}", ""]
    return "\n".join(lines)


def main() -> int:
    data = json.loads(ARTIFACT.read_text(encoding="utf-8"))
    cases = data["cases"]
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "alpha05.tex").write_text(
        ratio_table(
            cases,
            0.5,
            "tab:alpha05",
            "Cheapest trajectory found over the uniform-rotation cost on the same grid, $J/K = 10$, "
            "$" + BS + "alpha = 0.5$. Bold entries are below uniform rotation by more than one percent. The "
            "last two rows give the barrier floor at the longest switching time and the minimum energy "
            "path barrier relative to $NK$.",
        ),
        encoding="utf-8",
        newline="\n",
    )
    (OUT / "alpha01.tex").write_text(
        ratio_table(
            cases,
            0.1,
            "tab:alpha01",
            "As Table~" + BS + "ref{tab:alpha05} at $" + BS + "alpha = 0.1$.",
        ),
        encoding="utf-8",
        newline="\n",
    )
    saving = [c for c in cases if c["saving"] > 0.01]
    best = max(cases, key=lambda c: c["saving"])
    facts = {
        "n_cases": len(cases),
        "n_saving": len(saving),
        "best_key": best["key"],
        "best_saving_percent": round(100 * best["saving"], 1),
        "best_ratio": round(best["best_ratio"], 4),
        "best_floor": round(best["floor_ratio"], 4),
        "min_ratio_over_floor": round(min(c["best_ratio"] / c["floor_ratio"] for c in cases), 4),
    }
    (OUT / "facts.json").write_text(json.dumps(facts, indent=2), encoding="utf-8", newline="\n")
    print(json.dumps(facts, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

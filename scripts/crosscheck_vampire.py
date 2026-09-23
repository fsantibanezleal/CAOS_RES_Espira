"""Cross-check the engine's LLG dynamics against VAMPIRE, as a separate process (backlog BL-013).

What this checks, and why it is not the other cross-check
--------------------------------------------------------
`crosscheck_spirit.py` asks an independent code for the same energy barrier. That is a check of the
statics: the saddle that puts a floor under every cost this product reports. It says nothing about the
equation of motion the whole product is built on. If the engine's Landau-Lifshitz-Gilbert right-hand
side were wrong, every protocol, every switching verdict and every reliability number would be wrong
together, the barrier would still be right, and no internal test would notice.

VAMPIRE (Evans et al., J. Phys.: Condens. Matter 26, 103202 (2014)) is an atomistic spin-dynamics code
written by other people, with its own integrator (Heun) and its own units. Given the same macrospin and
the same field it must produce the same trajectory as `spinoct.dynamics.integrate_llg`.

Process isolation, and why it matters here
------------------------------------------
VAMPIRE is GPL-2. This product and its engine are MIT. Nothing is linked, nothing is imported, and no
VAMPIRE source enters either repository: the binary is built separately, run as a child process with
input files this script writes, and only its numeric output is read back. The adapter is this one
script, it is run by hand, and CI never installs or runs it. That is what keeps the licences apart.

The conventions, which is where such a comparison usually fails
--------------------------------------------------------------
Both codes integrate the Gilbert form

    (1 + alpha^2) ds/dt = -gamma s x B - alpha gamma s x [s x B]

with `B = B_applied + (2 K / mu) s_z z` for an easy axis along z, so the mapping is direct: VAMPIRE's
`atomic-spin-moment` in Bohr magnetons is the engine's `mu`, its `uniaxial-anisotropy-constant` in
joules per atom is the engine's `anisotropy_j`, and its `damping-constant` is `alpha`.

One constant does NOT match. VAMPIRE hard-codes the gyromagnetic ratio as 1.76e11 rad/(s T)
(`src/main/initialise_variables.cpp`, `gamma_SI`), while the engine uses the CODATA electron value
1.760859...e11. The difference is 4.9e-4 relative, it enters as a rescaling of time, and over a couple
of picoseconds of precession it moves the trajectory by 1.0e-04, which is a hundred times the level the
two codes otherwise agree at. So this script builds the engine's system with VAMPIRE's constant: the
comparison is then about the equation of motion and not about whose CODATA table is newer.

Usage:
    python scripts/crosscheck_vampire.py --binary /path/to/vampire-serial
    python scripts/crosscheck_vampire.py --binary /mnt/e/_Temp/vampire/src/vampire-serial \\
        --runner "wsl.exe -d Ubuntu-24.04 -e"   # Windows: VAMPIRE ships no native binary
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
from datetime import date
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SCHEMA = "espira.external-dynamics-crosscheck/1"
#: VAMPIRE's own gyromagnetic ratio, rad/(s T). Passed to the engine so both codes use one constant.
VAMPIRE_GAMMA = 1.76e11
MU_BOHR = 3.0
ANISOTROPY_J = 2.4031e-23
TIME_STEP_S = 1.0e-17
#: Agreement demanded of the two codes. VAMPIRE prints six significant figures, so a trajectory
#: component near 0.2 cannot be compared below about 1e-06; anything at that level is the same
#: dynamics reached twice, and a drift past it is a finding rather than a tolerance to widen.
TOLERANCE = 1e-5

#: The configurations compared. Each is a starting direction, a static applied field, a damping, how
#: many steps to integrate and how often to write one.
#:
#: The first three are precession and driven relaxation at three dampings. The fourth is an actual
#: reversal, the motion every protocol in this product is a shaped version of, and it has to be set up
#: to be one: the anisotropy field here is 2K/mu = 1.73 T, so a reversing field has to exceed that (the
#: first attempt used 1.2 T and the moment simply stayed on the pole), and it has to run long enough:
#: from a tilt theta0 the angle grows at alpha gamma (B - 2K/mu), which is a 45 ps time constant here,
#: so reaching the equator takes a few hundred picoseconds and the second attempt, at 100 ps, was still
#: comparing two codes that agreed nothing had happened yet (both at m_z = 0.8847). At 400 ps from a
#: 0.2 rad tilt it is a reversal, and the script refuses to write an artifact if it is not.
CASES = (
    {"name": "precession, alpha = 0.1", "alpha": 0.1, "start": (0.3, 0.0, 0.9539392), "field": (0.0, 0.0, 0.5), "steps": 200000, "every": 200},
    {"name": "precession, alpha = 0.01", "alpha": 0.01, "start": (0.3, 0.0, 0.9539392), "field": (0.0, 0.0, 0.5), "steps": 200000, "every": 200},
    {"name": "transverse drive, alpha = 0.05", "alpha": 0.05, "start": (0.0, 0.0, 1.0), "field": (0.4, 0.0, 0.0), "steps": 200000, "every": 200},
    {"name": "reversal, alpha = 0.1", "alpha": 0.1, "start": (0.1987, 0.0, 0.98007), "field": (0.0, 0.0, -3.0), "steps": 40000000, "every": 2000},
)


def _write_inputs(work: Path, case: dict) -> None:
    sx, sy, sz = case["start"]
    bx, by, bz = case["field"]
    strength = float(np.linalg.norm(case["field"]))
    unit = tuple(component / strength for component in case["field"])
    (work / "vamp.mat").write_text(
        "material:num-materials=1\n"
        "material[1]:material-name=Macrospin\n"
        f"material[1]:damping-constant={case['alpha']}\n"
        f"material[1]:atomic-spin-moment={MU_BOHR} !muB\n"
        f"material[1]:uniaxial-anisotropy-constant={ANISOTROPY_J}\n"
        "material[1]:material-element=Fe\n"
        f"material[1]:initial-spin-direction = {sx}, {sy}, {sz}\n",
        encoding="utf-8",
        newline="\n",
    )
    (work / "input").write_text(
        "create:crystal-structure=sc\n"
        "dimensions:unit-cell-size = 3.54 !A\n"
        "dimensions:system-size-x = 3.54 !A\n"
        "dimensions:system-size-y = 3.54 !A\n"
        "dimensions:system-size-z = 3.54 !A\n"
        "material:file=vamp.mat\n"
        "sim:temperature=0.0\n"
        f"sim:time-step={TIME_STEP_S}\n"
        f"sim:applied-field-strength={strength} !T\n"
        f"sim:applied-field-unit-vector = {unit[0]}, {unit[1]}, {unit[2]}\n"
        "sim:integrator=llg-heun\n"
        "sim:program=time-series\n"
        f"sim:total-time-steps={case['steps']}\n"
        f"sim:time-steps-increment={case['every']}\n"
        "output:real-time\n"
        "output:magnetisation\n",
        encoding="utf-8",
        newline="\n",
    )
    del bx, by, bz


def _run_vampire(work: Path, binary: str, runner: list[str]) -> np.ndarray:
    """Run VAMPIRE in ``work`` and return its trajectory, columns (t, mx, my, mz)."""
    for stale in ("output", "log"):
        (work / stale).unlink(missing_ok=True)
    if runner:
        # The working directory has to be expressed in the runner's own filesystem, so the caller
        # passes a binary path in those terms and the script only changes into the directory there.
        posix = subprocess.run(
            [*runner, "bash", "-lc", f"cd {_posix(work)} && {binary} > run.log 2>&1; echo $?"],
            capture_output=True,
            text=True,
            check=False,
        )
        code = posix.stdout.strip().splitlines()[-1] if posix.stdout.strip() else "no output"
        if code != "0":
            raise RuntimeError(f"VAMPIRE failed ({code}): {(work / 'run.log').read_text(errors='ignore')[-800:]}")
    else:
        completed = subprocess.run([binary], cwd=work, capture_output=True, text=True, check=False)
        if completed.returncode != 0:
            raise RuntimeError(f"VAMPIRE failed ({completed.returncode}): {completed.stderr[-800:]}")
    table = np.loadtxt(work / "output")
    return table[:, :4]


def _posix(path: Path) -> str:
    """A Windows path as the WSL runner sees it: D:\\x\\y becomes /mnt/d/x/y."""
    text = str(path).replace("\\", "/")
    if len(text) > 1 and text[1] == ":":
        return f"/mnt/{text[0].lower()}{text[2:]}"
    return text


def _ours(case: dict, times: np.ndarray) -> np.ndarray:
    from spinoct.dynamics import MacrospinSystem
    from spinoct.dynamics.llg import integrate_llg
    from spinoct.units import bohr_magnetons_to_j_per_t

    system = MacrospinSystem(
        mu=bohr_magnetons_to_j_per_t(MU_BOHR),
        anisotropy_j=ANISOTROPY_J,
        alpha=case["alpha"],
        gamma=VAMPIRE_GAMMA,
    )
    start = np.asarray(case["start"], dtype=float)
    start /= np.linalg.norm(start)
    field = np.asarray(case["field"], dtype=float)
    return integrate_llg(start, lambda _t: field, times, system)


def _crossing_time(times: np.ndarray, mz: np.ndarray) -> float | None:
    """When the moment crosses the equator, by linear interpolation. None if it never does."""
    below = np.nonzero(mz <= 0.0)[0]
    if below.size == 0:
        return None
    index = int(below[0])
    if index == 0:
        return float(times[0])
    t0, t1 = times[index - 1], times[index]
    m0, m1 = mz[index - 1], mz[index]
    return float(t0 + (t1 - t0) * m0 / (m0 - m1))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--binary", required=True, help="path to vampire-serial, in the runner's filesystem")
    parser.add_argument("--runner", default="", help='e.g. "wsl.exe -d Ubuntu-24.04 -e" on Windows')
    parser.add_argument(
        "--work",
        default=os.environ.get("ESPIRA_SCRATCH", "E:/_Temp/espira-vampire"),
        help="scratch directory for the generated inputs and outputs (never inside the repo)",
    )
    args = parser.parse_args()
    runner = args.runner.split() if args.runner else []

    import spinoct

    work_root = Path(args.work)
    work_root.mkdir(parents=True, exist_ok=True)
    rows = []
    for index, case in enumerate(CASES):
        work = work_root / f"case{index}"
        work.mkdir(exist_ok=True)
        _write_inputs(work, case)
        theirs = _run_vampire(work, args.binary, runner)
        times = theirs[:, 0]
        ours = _ours(case, times)
        deviation = np.linalg.norm(ours - theirs[:, 1:4], axis=-1)
        ours_crossing = _crossing_time(times, ours[:, 2])
        theirs_crossing = _crossing_time(times, theirs[:, 3])
        rows.append(
            {
                "name": case["name"],
                "alpha": case["alpha"],
                "start": list(case["start"]),
                "applied_field_t": list(case["field"]),
                "samples": int(times.size),
                "duration_s": float(times[-1]),
                "worst_deviation": float(deviation.max()),
                "worst_at_s": float(times[int(deviation.argmax())]),
                "final_ours": [float(v) for v in ours[-1]],
                "final_theirs": [float(v) for v in theirs[-1, 1:4]],
                "reversal_time_ours_s": ours_crossing,
                "reversal_time_theirs_s": theirs_crossing,
                "reversal_time_difference": (
                    None
                    if ours_crossing is None or theirs_crossing is None
                    else abs(ours_crossing - theirs_crossing) / theirs_crossing
                ),
            }
        )
        if case["name"].startswith("reversal") and (ours_crossing is None or theirs_crossing is None):
            raise RuntimeError(
                "the reversal case did not reverse in either code, so it compares nothing: "
                f"our final m_z {ours[-1, 2]:.4f}, theirs {theirs[-1, 3]:.4f}"
            )
        print(
            f"{case['name']:32s} worst |dm| = {deviation.max():.2e} over {times[-1] * 1e12:.1f} ps"
            + (
                f", reversal {ours_crossing * 1e12:.4f} ps against {theirs_crossing * 1e12:.4f} ps"
                if ours_crossing and theirs_crossing
                else ""
            ),
            flush=True,
        )
        shutil.rmtree(work, ignore_errors=True)

    reported = subprocess.run(
        [*runner, "bash", "-lc", f"{args.binary} --version 2>/dev/null | head -2"] if runner else [args.binary, "--version"],
        capture_output=True,
        text=True,
        check=False,
    ).stdout.strip()
    # "vampire version 7.0.0\nGithash 525bc27..." on two lines. One line, with the commit kept short,
    # because this string is shown on the Implementation page beside the engine's own version.
    version = " ".join(reported.split())
    if "Githash" in version:
        head, _, commit = version.partition("Githash")
        version = f"{head.replace('vampire version', '').strip()} (git {commit.strip()[:7]})"
    worst = max(r["worst_deviation"] for r in rows)
    artifact = {
        "schema": SCHEMA,
        "description": (
            "The Landau-Lifshitz-Gilbert trajectory of one macrospin, integrated twice: by spinoct's "
            "norm-preserving Runge-Kutta and by VAMPIRE's Heun integrator, from the same starting "
            "direction under the same static field, with the same moment, anisotropy and damping. "
            "VAMPIRE is GPL-2 and is run as a separate process from generated input files; nothing is "
            "linked and no VAMPIRE code enters this repository."
        ),
        "engines": {
            "spinoct": spinoct.__display_version__,
            "vampire": version or "7.0 (built from source)",
        },
        "gyromagnetic_ratio_rad_per_s_t": VAMPIRE_GAMMA,
        "gyromagnetic_note": (
            "VAMPIRE hard-codes 1.76e11 rad/(s T) while the engine's default is the CODATA electron "
            "value 1.760859e11. The difference is 4.9e-4 and enters as a rescaling of time; left "
            "alone it moves the trajectory by 1.0e-04 over two picoseconds, a hundred times the level "
            "the two codes otherwise agree at. The engine is given VAMPIRE's constant here so the "
            "comparison is about the equation of motion."
        ),
        "moment_bohr": MU_BOHR,
        "anisotropy_j": ANISOTROPY_J,
        "time_step_s": TIME_STEP_S,
        "tolerance": TOLERANCE,
        "measured_on": date.today().isoformat(),
        "worst_deviation": worst,
        "agrees": bool(worst <= TOLERANCE),
        "rows": rows,
    }
    path = ROOT / "data" / "artifacts" / "external_dynamics_crosscheck.json"
    path.write_text(json.dumps(artifact, indent=2, allow_nan=False), encoding="utf-8", newline="\n")
    print(f"worst deviation {worst:.2e} against a tolerance of {TOLERANCE:.0e}; wrote {path}")
    return 0 if artifact["agrees"] else 1


if __name__ == "__main__":
    raise SystemExit(main())

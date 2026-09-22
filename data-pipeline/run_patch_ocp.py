"""Run (or resume) the two-dimensional patch crossover bake (cases C20 and C21).

Usage: python data-pipeline/run_patch_ocp.py [output_dir] [workers]

Separate from run.py because it is hours of single-core solves; it runs in parallel and checkpoints
every case (under $ESPIRA_CHECKPOINT_DIR when set), so rerunning after an interruption continues where
it stopped.
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from espiralab.bake.patch_ocp import bake_patch_ocp, refresh_floors  # noqa: E402


def main() -> int:
    root = Path(__file__).resolve().parents[1]
    argv = [a for a in sys.argv[1:] if a != "--floors"]
    # --floors recomputes only the minimum energy path of each checkpoint, which is where the floor
    # comes from, and leaves the control solves alone. Use it after a change to the path's resolution.
    if "--floors" in sys.argv:
        import os

        env = os.environ.get("ESPIRA_CHECKPOINT_DIR")
        checkpoints = Path(env) if env else root / "data" / ".checkpoints" / "patch_ocp"
        print(f"refreshing floors from {checkpoints}")
        print(f"{len(refresh_floors(checkpoints))} checkpoints updated")
    output = Path(argv[0]) if argv else root / "data" / "artifacts"
    workers = int(argv[1]) if len(argv) > 1 else None
    artifact = bake_patch_ocp(output, workers)
    saving = [c for c in artifact["cases"] if c["saving"] > 0.01]
    print(f"baked {len(artifact['cases'])} patch cases; {len(saving)} with a nonuniform saving above 1%")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

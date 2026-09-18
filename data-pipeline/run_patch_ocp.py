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

from espiralab.bake.patch_ocp import bake_patch_ocp  # noqa: E402


def main() -> int:
    root = Path(__file__).resolve().parents[1]
    output = Path(sys.argv[1]) if len(sys.argv) > 1 else root / "data" / "artifacts"
    workers = int(sys.argv[2]) if len(sys.argv) > 2 else None
    artifact = bake_patch_ocp(output, workers)
    saving = [c for c in artifact["cases"] if c["saving"] > 0.01]
    print(f"baked {len(artifact['cases'])} patch cases; {len(saving)} with a nonuniform saving above 1%")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

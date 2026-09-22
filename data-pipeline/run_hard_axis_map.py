"""Run (or resume) the hard-axis map bake (backlog BL-035, finding F-011).

Usage: python data-pipeline/run_hard_axis_map.py [output_dir] [workers]

Separate from run.py because it is a few hundred numerical optimal-control solves; it runs in parallel
and checkpoints every point (under $ESPIRA_CHECKPOINT_DIR when set), so rerunning after an interruption
continues where it stopped.
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from espiralab.bake.hard_axis import bake_hard_axis_map  # noqa: E402


def main() -> int:
    root = Path(__file__).resolve().parents[1]
    output = Path(sys.argv[1]) if len(sys.argv) > 1 else root / "data" / "artifacts"
    workers = int(sys.argv[2]) if len(sys.argv) > 2 else None
    artifact = bake_hard_axis_map(output, workers)
    summary = artifact["summary"]
    print(
        f"hard-axis map: {summary['helped']} of {summary['points']} points where the hard axis pays; "
        f"best {summary['best']['reduction']:.3f} at ratio {summary['best']['ratio']}, "
        f"alpha {summary['best']['damping']}, T {summary['best']['switching_tau0']} tau0"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

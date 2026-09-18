"""Bake the cross-case novel results (the reliability front and the two-mode lattice comparison).

    python data-pipeline/run_novel.py [artifacts_dir]

Separate from the release sequence because these are cross-case results shown on the Experiments page,
not per-case artifacts, and they carry a Monte-Carlo cost.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from espiralab.bake.novel import bake_novel_results  # noqa: E402


def main() -> int:
    root = Path(__file__).resolve().parents[1]
    output = Path(sys.argv[1]) if len(sys.argv) > 1 else root / "data" / "artifacts"
    output.mkdir(parents=True, exist_ok=True)
    (output / "novel.json").write_text(
        json.dumps(bake_novel_results(), indent=2, allow_nan=False), encoding="utf-8", newline="\n"
    )
    print(f"novel results written to {output / 'novel.json'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

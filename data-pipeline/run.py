"""Run the canonical bake. Usage: python data-pipeline/run.py [output_dir]"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from espiralab.bake import bake_all  # noqa: E402


def main() -> int:
    output = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parents[1] / "data" / "artifacts"
    index = bake_all(output)
    print(f"baked {len(index['cases'])} cases into {output}")
    for row in index["cases"]:
        print(f"  {row['slug']:28s} {row['material_name']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

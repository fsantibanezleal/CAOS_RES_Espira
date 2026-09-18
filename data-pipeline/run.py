"""Run the offline pipeline.

    python data-pipeline/run.py [stage] [artifacts_dir] [manifests_dir]

`stage` defaults to `all`, the release sequence: ingest, preprocess, dataset, features, train, infer,
evaluate, export, validate. The free chain crossover map and the two-dimensional patch sweep are
separate, hours-long bakes (`run_lattice_ocp.py`, `run_patch_ocp.py`), and the cross-case novel results are written by `run_novel.py`.
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from espiralab.pipeline import main  # noqa: E402

if __name__ == "__main__":
    raise SystemExit(main(sys.argv))

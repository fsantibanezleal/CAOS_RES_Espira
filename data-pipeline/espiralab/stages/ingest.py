"""Stage ``ingest``: read the material tables through Contract 1.

Input: ``data/materials/materials.csv`` and ``data/materials/parameters.csv`` (or explicit paths).
Output: a :class:`espiralab.io.ContractReport` with accepted materials, rejections with reasons, and flags.
"""

from __future__ import annotations

from pathlib import Path

from ..io import ContractReport, validate_tables

__all__ = ["DEFAULT_MATERIALS_CSV", "DEFAULT_PARAMETERS_CSV", "ingest"]

_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_MATERIALS_CSV = _ROOT / "data" / "materials" / "materials.csv"
DEFAULT_PARAMETERS_CSV = _ROOT / "data" / "materials" / "parameters.csv"


def ingest(materials_csv: Path = DEFAULT_MATERIALS_CSV, parameters_csv: Path = DEFAULT_PARAMETERS_CSV) -> ContractReport:
    """Validate the tables; never raises on bad rows (they are reported), only on unreadable files."""
    return validate_tables(Path(materials_csv), Path(parameters_csv))

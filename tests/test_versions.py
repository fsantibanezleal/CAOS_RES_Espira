"""The display version agrees everywhere it is written: VERSION, the changelog, the web app, the package
manifest and the pipeline package."""

from __future__ import annotations

import json
import re
from pathlib import Path

import espiralab

ROOT = Path(__file__).resolve().parents[1]


def test_display_version_is_consistent_everywhere() -> None:
    version = (ROOT / "VERSION").read_text(encoding="utf-8").strip()
    assert re.fullmatch(r"\d\.\d{2}\.\d{3}", version)

    changelog = (ROOT / "CHANGELOG.md").read_text(encoding="utf-8")
    first_entry = re.search(r"^## \[(\d\.\d{2}\.\d{3})\]", changelog, flags=re.M)
    assert first_entry and first_entry.group(1) == version

    app_version = re.search(r"APP_VERSION = '([^']+)'", (ROOT / "frontend/src/version.ts").read_text(encoding="utf-8"))
    assert app_version and app_version.group(1) == version

    semver = ".".join(str(int(part)) for part in version.split("."))
    package = json.loads((ROOT / "frontend/package.json").read_text(encoding="utf-8"))
    assert package["version"] == semver

    assert espiralab.__version__ == version

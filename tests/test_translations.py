"""The Spanish page renders the data in Spanish, and the translations cannot drift from the data.

The case registry, the materials database and the bake write their prose in English, like every
technical artifact of this product. Until 0.16.000 the Spanish page showed all of it in English, about
31,000 characters, under a note apologizing for it. The web app now renders each such string from
``frontend/src/content/data-es.json``, keyed by its exact English text. These tests collect every string
the app renders from the committed artifacts, by the same paths the pages read, and hold the file to
them: every string translated, nothing translated that the data no longer carries, and the numbers and
symbols of each translation equal to those of its source. A registry text corrected in English fails
here until its Spanish is corrected too.
"""

from __future__ import annotations

import json
import re
from collections import Counter
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / "data" / "artifacts"
DATA_ES = ROOT / "frontend" / "src" / "content" / "data-es.json"
#: The six Experiments views that print their artifact's description.
DESCRIBED = ("lattice_ocp", "descriptors", "penalty_test", "hard_axis_map", "pareto", "patch_ocp")
#: A number as prose writes it: not glued to a letter (tau0, C07, Fe3GeTe2 are names, not numbers).
NUMBER = re.compile(r"(?<![A-Za-z_\d.])\d+(?:\.\d+)*(?:e[-+]?\d+)?")
#: Notation that must survive translation character for character.
SYMBOL = re.compile(r"xi_[DF]|T\^2|sqrt\([^)]*\)|best_ratio|floor_ratio|C\d\d|R\d\d|M[12] v\d|j0|tau0")


def _load(name: str) -> dict:
    return json.loads((ARTIFACTS / name).read_text(encoding="utf-8"))


def rendered_strings() -> set[str]:
    """Every English string the web app renders from the committed artifacts."""
    found: set[str] = set()

    def add(text: object) -> None:
        if isinstance(text, str) and text.strip():
            found.add(text)

    index = _load("index.json")
    for row in index["cases"]:
        add(row["title"])
        add(row["material_name"])
    for row in index["registry"]:
        add(row["title"])
        add(row.get("blocked_reason"))
        add(row["ground_truth"])
    for row in index["cases"]:
        artifact = _load(f"{row['slug']}.json")
        for key in ("title", "reason", "expectation", "kill_criterion", "ground_truth", "split"):
            add(artifact["case"][key])
        for key in ("label", "note", "unit"):
            add(artifact["observable"][key])
        add(artifact["axis"]["unit"])
        add(artifact.get("pulse_note"))
        add(artifact["material"]["name"])
        add(artifact["material"].get("notes"))
        add(artifact["material"]["easy_axis"])
        # The parameter panel: what each value was published as, how it was measured, and why.
        for parameter in artifact["material"]["provenance"].values():
            add(parameter["input"]["unit"])
            add(parameter["input"]["basis"])
            add(parameter.get("method"))
            add(parameter.get("note"))
        # The pulse and sphere views label their axes and series from the pulse itself.
        pulses = artifact.get("pulses") or {}
        for pulse in pulses.values() if isinstance(pulses, dict) else pulses:
            for key in ("x_label", "x_unit", "signal_label", "signal_unit"):
                add(pulse.get(key))
            for series in pulse.get("signal_series") or []:
                add(series)
    benchmark = _load("benchmark.json")
    for case in benchmark["cases"]:
        for method in case["methods"]:
            add(method.get("notes"))
    for manifest in benchmark["manifests"]:
        add(manifest["lane"])
    for name in DESCRIBED:
        add(_load(f"{name}.json").get("description"))
    novel = _load("novel.json")
    add(novel["notes"].get("reliability"))
    add(novel["notes"].get("lattice"))
    dynamics = _load("external_dynamics_crosscheck.json")
    for row in dynamics["rows"]:
        add(row["name"])
    add(dynamics.get("gyromagnetic_note"))
    return found


@pytest.fixture(scope="module")
def spanish() -> dict[str, str]:
    return json.loads(DATA_ES.read_text(encoding="utf-8"))


def _numbers(text: str) -> list[str]:
    # English prose writes 1,000; the Spanish writes 1000, because a comma is a decimal mark there.
    return sorted(NUMBER.findall(re.sub(r"(\d),(\d{3})\b", r"\1\2", text)))


def test_every_rendered_string_has_a_spanish_version(spanish: dict[str, str]) -> None:
    missing = sorted(rendered_strings() - set(spanish))
    assert not missing, f"{len(missing)} data strings render in English on the Spanish page: {missing[:3]}"


def test_no_translation_outlives_its_source(spanish: dict[str, str]) -> None:
    """A translation keyed by a text the data no longer carries is what is left when the English was
    edited and the Spanish was not: the page then falls back to English for the new text."""
    stale = sorted(set(spanish) - rendered_strings())
    assert not stale, f"{len(stale)} translations for strings no artifact carries: {stale[:3]}"


def test_translations_keep_every_number_and_symbol(spanish: dict[str, str]) -> None:
    for english, translated in spanish.items():
        assert _numbers(english) == _numbers(translated), english[:80]
        assert Counter(SYMBOL.findall(english)) == Counter(SYMBOL.findall(translated)), english[:80]


def test_translations_are_written_in_accented_spanish(spanish: dict[str, str]) -> None:
    """The interface shipped every Spanish string without accents until 0.16.000 ("conmutacion",
    "energia", "Decide: si"). A word ending in an unaccented -cion or -sion is the reliable symptom."""
    unaccented = re.compile(r"\b[a-záéíóúñ]+(?:cion|sion)\b", re.IGNORECASE)
    for translated in spanish.values():
        assert not unaccented.search(translated), translated[:80]


def test_the_number_check_catches_a_changed_number() -> None:
    """The check above has to be able to fail: a translation that moved one digit is caught."""
    assert _numbers("0.810 against 1.000 at 1,000 copies") != _numbers("0.810 frente a 0.952 con 1000 copias")
    assert _numbers("0.810 against 1.000 at 1,000 copies") == _numbers("0.810 frente a 1.000 con 1000 copias")

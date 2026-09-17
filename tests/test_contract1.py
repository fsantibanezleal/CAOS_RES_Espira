"""Contract 1: every rejection reason fires, every flag fires, every conversion reproduces the audit.

The conversions are checked against the per-site values computed by hand in programme dossier 07:
CrI3 D_z = 0.22 meV on S = 3/2 spins gives 0.495 meV; Cr2Ge2Te6 K_u = 3.95e5 erg/cm^3 over six Cr in
0.8301 nm^3 gives 0.0341 meV; Fe3GeTe2 K_u = 1.46e7 erg/cm^3 with M_s = 376 emu/cm^3 at 1.58 mu_B/Fe gives
0.355 meV; FePS3 Delta = 2.66 meV on S = 2 gives 10.64 meV.
"""

from __future__ import annotations

import csv
from pathlib import Path

import pytest

from espiralab.io import validate_tables
from espiralab.stages.ingest import ingest
from espiralab.stages.preprocess import ContractViolation, preprocess

COLUMNS = [
    "material", "parameter", "value", "unit", "basis", "spin_length", "ions_per_cell", "cell_volume_nm3",
    "ms_emu_per_cm3", "moment_for_density_bohr", "low", "high", "provenance", "method", "source_doi", "note",
]
DOI = "10.1103/PhysRevX.8.041028"


def _good_rows(slug: str = "demo") -> list[dict[str, str]]:
    base = {c: "" for c in COLUMNS}
    return [
        base | {"material": slug, "parameter": "moment", "value": "3", "unit": "mu_B", "basis": "per-ion",
                "provenance": "derived", "source_doi": DOI},
        base | {"material": slug, "parameter": "anisotropy", "value": "0.22", "unit": "meV",
                "basis": "spin-operator", "spin_length": "1.5", "provenance": "measured", "source_doi": DOI},
        base | {"material": slug, "parameter": "hard_axis_ratio", "value": "0", "unit": "ratio", "basis": "none",
                "provenance": "assumed", "note": "uniaxial model"},
        base | {"material": slug, "parameter": "damping", "value": "0.01", "unit": "dimensionless",
                "basis": "none", "low": "0.005", "high": "0.02", "provenance": "assumed", "note": "typical"},
        base | {"material": slug, "parameter": "ordering_temperature", "value": "45", "unit": "K", "basis": "none",
                "provenance": "measured", "source_doi": "10.1038/nature22391"},
    ]


def _write(tmp_path: Path, rows: list[dict[str, str]], slugs=("demo",)) -> tuple[Path, Path]:
    materials = tmp_path / "materials.csv"
    with materials.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=["slug", "name", "family", "spin", "easy_axis", "notes"])
        writer.writeheader()
        for slug in slugs:
            writer.writerow({"slug": slug, "name": slug, "family": "test", "spin": "1.5", "easy_axis": "z",
                             "notes": ""})
    parameters = tmp_path / "parameters.csv"
    with parameters.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=COLUMNS)
        writer.writeheader()
        writer.writerows(rows)
    return materials, parameters


def test_good_material_is_accepted_with_its_flags(tmp_path: Path) -> None:
    report = validate_tables(*_write(tmp_path, _good_rows()))
    assert report.ok
    record = report.materials["demo"]
    assert record.values["anisotropy"].value == pytest.approx(0.495)
    flags = {f["flag"] for f in report.flagged}
    assert "assumed" in flags
    assert "converted from meV (spin-operator)" in flags
    assert "wide damping band" not in flags  # 0.02 / 0.005 = 4 is not wider than four


@pytest.mark.parametrize(
    ("mutate", "reason"),
    [
        (lambda r: r[0].update(material="nope"), "unknown material"),
        (lambda r: r[0].update(parameter="exchange"), "unknown parameter"),
        (lambda r: r[0].update(value=""), "missing value"),
        (lambda r: r[0].update(value="three"), "is not numeric"),
        (lambda r: r[0].update(value="nan"), "not finite"),
        (lambda r: r[0].update(unit="emu"), "is not accepted for moment"),
        (lambda r: r[1].update(spin_length=""), "needs a positive spin_length"),
        (lambda r: r[1].update(unit="erg/cm3", basis="volume", value="3.95e5"), "volume basis needs"),
        (lambda r: r[0].update(provenance="guessed"), "unknown provenance"),
        (lambda r: r[0].update(source_doi=""), "needs a source DOI"),
        (lambda r: r[0].update(source_doi="doi:10.1/x"), "malformed DOI"),
        (lambda r: r[2].update(note=""), "needs a written justification"),
        (lambda r: r[0].update(value="42"), "outside its physical range"),
        (lambda r: r[3].update(value="1.5", low="", high=""), "outside its physical range"),
        (lambda r: r[3].update(low="0.02", high="0.03"), "does not contain the value"),
        (lambda r: r[3].update(high=""), "needs both low and high"),
        (lambda r: r.append(dict(r[0])), "duplicate row"),
    ],
)
def test_each_rejection_reason_fires(tmp_path: Path, mutate, reason: str) -> None:
    rows = _good_rows()
    mutate(rows)
    report = validate_tables(*_write(tmp_path, rows))
    assert not report.ok
    assert any(reason in r["reason"] for r in report.rejected), report.rejected


def test_a_material_missing_a_parameter_is_rejected_whole(tmp_path: Path) -> None:
    rows = [r for r in _good_rows() if r["parameter"] != "damping"]
    report = validate_tables(*_write(tmp_path, rows))
    assert "demo" not in report.materials
    assert any("missing required parameters ['damping']" in r["reason"] for r in report.rejected)


def test_wide_damping_band_is_flagged(tmp_path: Path) -> None:
    rows = _good_rows()
    rows[3].update(low="0.003", high="0.03")
    report = validate_tables(*_write(tmp_path, rows))
    assert report.ok
    assert any(f["flag"] == "wide damping band" for f in report.flagged)


def test_volume_conversion_through_the_unit_cell(tmp_path: Path) -> None:
    rows = _good_rows()
    rows[1].update(value="3.95e5", unit="erg/cm3", basis="volume", spin_length="", ions_per_cell="6",
                   cell_volume_nm3="0.8301")
    report = validate_tables(*_write(tmp_path, rows))
    assert report.materials["demo"].values["anisotropy"].value == pytest.approx(0.0341, rel=2e-3)


def test_volume_conversion_through_the_magnetization(tmp_path: Path) -> None:
    rows = _good_rows()
    rows[1].update(value="1.46e7", unit="erg/cm3", basis="volume", spin_length="", ms_emu_per_cm3="376",
                   moment_for_density_bohr="1.58")
    report = validate_tables(*_write(tmp_path, rows))
    assert report.materials["demo"].values["anisotropy"].value == pytest.approx(0.355, rel=2e-3)


def test_the_committed_tables_pass_and_reproduce_the_audit() -> None:
    report = ingest()
    assert report.ok, report.rejected
    materials = preprocess(report)
    expected_anisotropy = {"cri3": 0.495, "cr2ge2te6": 0.0341, "fe3gete2": 0.355, "feps3": 10.64, "crsbr": 0.15,
                           "fe3gate2": 0.31}
    for slug, value in expected_anisotropy.items():
        assert materials[slug].anisotropy_mev == pytest.approx(value, rel=2e-3), slug
    assert materials["cr2ge2te6"].moment_bohr == pytest.approx(2.80)
    assert materials["cr2ge2te6"].curie_kelvin == pytest.approx(61.0)
    assert materials["fe3gete2"].moment_bohr == pytest.approx(1.58)


def test_every_assumed_value_is_flagged_in_the_record() -> None:
    for material in preprocess(ingest()).values():
        for name, record in material.provenance.items():
            if record["provenance"] == "assumed":
                assert "assumed" in record["flags"], (material.slug, name)
                assert record["note"], (material.slug, name)
            else:
                assert record["sources"], (material.slug, name)


def test_strict_preprocess_refuses_a_rejected_table(tmp_path: Path) -> None:
    rows = _good_rows()
    rows[0].update(value="-1")
    # The bad moment row is rejected, and so is its material, which then lacks a required parameter.
    with pytest.raises(ContractViolation, match=r"rejected 2 row\(s\)"):
        preprocess(validate_tables(*_write(tmp_path, rows)), strict=True)

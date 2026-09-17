"""The case registry: the coverage matrix's own contract (ADR-0069 section 4).

Every case declares a variant family of at least six values, a seed, a split, a ground-truth class, what
a domain expert should see, and the kill criterion that would make it a failure. A case that is not
computed says so, and a blocked case names what is missing. The 26 cases of the validated plan are all
declared, so a missing one cannot hide behind the eight that are baked.
"""

from __future__ import annotations

import pytest

from espiralab.cases import (
    CASES,
    baked_cases,
    cases_by_category,
    coverage_counts,
    get_case,
    validate_registry,
)
from espiralab.cases.model import GROUND_TRUTH, SPLITS, STATUSES, SURFACES
from espiralab.materials import material_slugs

PLANNED_CASES = 26


def test_registry_passes_its_own_validation() -> None:
    validate_registry()


def test_the_whole_planned_matrix_is_declared() -> None:
    assert len(CASES) == PLANNED_CASES
    codes = sorted(case.code for case in CASES.values())
    assert codes == [f"C{i:02d}" for i in range(1, PLANNED_CASES + 1)]


def test_coverage_counts_add_up() -> None:
    counts = coverage_counts()
    assert sum(counts.values()) == len(CASES)
    assert counts["baked"] >= 8


@pytest.mark.parametrize("case", list(CASES.values()), ids=lambda c: c.slug)
def test_each_case_declares_its_contract(case) -> None:
    assert case.status in STATUSES
    assert case.split in SPLITS
    assert case.ground_truth in GROUND_TRUTH
    assert case.surface in SURFACES
    assert len(case.axis.values) >= 6, "ADR-0069 section 4: at least six meaningful variants"
    assert list(case.axis.values) == sorted(set(case.axis.values)), "variants are unique and ordered"
    assert case.axis.unit and case.axis.label
    for field in ("reason", "expectation", "kill_criterion"):
        assert len(getattr(case, field).split()) >= 8, f"{field} must say something specific"
    assert case.methods, "a case that runs no method is not a case"


@pytest.mark.parametrize("case", list(CASES.values()), ids=lambda c: c.slug)
def test_a_blocked_case_names_what_is_missing(case) -> None:
    assert (case.status == "blocked") == bool(case.blocked_reason.strip())


@pytest.mark.parametrize("case", list(baked_cases().values()), ids=lambda c: c.slug)
def test_a_baked_case_has_a_system(case) -> None:
    assert case.material is not None or case.synthetic is not None
    if case.material is not None:
        assert case.material in material_slugs()


def test_learned_methods_cannot_train_on_their_test_materials() -> None:
    """A material is either trained on or held out, never both.

    Control cases (oracles, replication, the negative control) may reuse a training material: they score
    nothing and train nothing. What would leak is a material appearing in both the train and test splits.
    """
    trained = {c.material for c in CASES.values() if c.split == "train" and c.material}
    held_out = {c.material for c in CASES.values() if c.split == "test" and c.material}
    assert trained and held_out
    assert not (trained & held_out), f"materials in both splits: {sorted(trained & held_out)}"


def test_categories_partition_the_registry() -> None:
    grouped = cases_by_category()
    assert sorted(c.slug for cases in grouped.values() for c in cases) == sorted(CASES)
    assert len(grouped) == 6


def test_unknown_case_is_rejected() -> None:
    with pytest.raises(KeyError):
        get_case("not-a-case")


def test_switching_time_accessor_refuses_another_axis() -> None:
    assert get_case("crsbr-field").switching_times_tau0 == (2.0, 5.0, 10.0, 20.0, 50.0, 100.0)
    with pytest.raises(AttributeError, match="sweeps"):
        _ = get_case("biaxial-hard-axis").switching_times_tau0

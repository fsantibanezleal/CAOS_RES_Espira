"""Stage ``train``: fit the amortized policy on the training materials only, and register it.

The policy (engine rung R15) maps the damping and the log switching time to the shape parameter of the
optimal pulse, so a new material gets a near-optimal pulse with no optimization at inference. It is
trained here on the damping values of the TRAIN-split materials and scored in `evaluate` on the held-out
ones, which is the only way its claim means anything.

The checkpoint is small (a two-layer network), so it is committed, with a registry entry recording the
version, the engine, the training set, the seed and the acceptance gate it passed.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from functools import cache
from pathlib import Path

import numpy as np
from spinoct.amortized import evaluate_policy, train_amortized_policy
from spinoct.dynamics import MacrospinSystem

from ..materials import get_material
from .dataset import splits

__all__ = ["REGISTRY_PATH", "TrainedPolicy", "load_or_train_policy", "train_policy"]

ROOT = Path(__file__).resolve().parents[3]
CHECKPOINT_PATH = ROOT / "models" / "amortized_policy.json"
REGISTRY_PATH = ROOT / "models" / "registry.json"

#: The switching times, in tau0, the policy is trained over, and the acceptance gate it must pass.
_TRAIN_TIMES = (2.0, 5.0, 10.0, 20.0, 50.0)
#: The damping range the policy is trained over (the family spans 4e-4 to 3e-2), the number of grid
#: points, and how far a training point must stay from a held-out material's damping.
_DAMPING_RANGE = (3e-4, 4e-2)
_DAMPING_POINTS = 14
_EXCLUSION = 0.1
_ACCEPTANCE_COST_RATIO = 1.10
_SEED = 0


def _training_dampings(train_materials: tuple[str, ...], test_materials: tuple[str, ...]) -> np.ndarray:
    """The damping grid the policy trains on.

    Training on the training materials' damping values alone is not enough: four of the six materials
    carry the same assumed damping of 0.01, so the grid would be a single point and the policy could not
    reach the one material with a measured damping three orders of magnitude away. The policy's input is
    the damping itself, not a material identity, so it trains over a log-spaced range covering the family,
    with every point within `_EXCLUSION` of a held-out material's damping removed. The held-out values are
    then interpolation targets the policy has never seen, which is what makes the acceptance gate mean
    something.
    """
    held_out = [get_material(slug).damping for slug in test_materials]
    grid = np.geomspace(_DAMPING_RANGE[0], _DAMPING_RANGE[1], _DAMPING_POINTS)
    keep = [a for a in grid if all(abs(a - h) > _EXCLUSION * h for h in held_out)]
    return np.array(keep)


@dataclass(frozen=True)
class TrainedPolicy:
    """The trained policy with the evidence it passed its gate."""

    checkpoint: dict
    train_materials: tuple[str, ...]
    test_materials: tuple[str, ...]
    held_out_scores: tuple[dict, ...]
    passed: bool


def _weights(policy) -> dict:
    return {
        "w1": policy.w1.tolist(),
        "b1": policy.b1.tolist(),
        "w2": policy.w2.tolist(),
        "b2": float(policy.b2),
        "input_mean": policy.input_mean.tolist(),
        "input_std": policy.input_std.tolist(),
        "target_mean": policy.target_mean,
        "target_std": policy.target_std,
    }


def train_policy(write: bool = True) -> TrainedPolicy:
    """Train on the train split, score on the held-out split, and register the checkpoint.

    Args:
        write: write the checkpoint and the registry entry (the release bake); False for a sandbox run.

    Returns:
        The :class:`TrainedPolicy`.
    """
    by_split = splits()
    train_materials, test_materials = by_split["train"], by_split["test"]
    dampings = _training_dampings(train_materials, test_materials)
    reference = get_material(train_materials[0])

    policy = train_amortized_policy(
        mu=reference.moment_j_per_t,
        anisotropy_j=reference.anisotropy_j,
        alphas=dampings,
        switching_times_tau0=np.array(_TRAIN_TIMES),
        seed=_SEED,
    )

    scores = []
    for slug in test_materials:
        material = get_material(slug)
        system = MacrospinSystem(
            mu=material.moment_j_per_t, anisotropy_j=material.anisotropy_j, alpha=material.damping
        )
        for t_tau0 in (5.0, 20.0):
            evaluation = evaluate_policy(policy, system, system.switching_time_from_tau0(t_tau0))
            scores.append(
                {
                    "material": slug,
                    "switching_time_tau0": t_tau0,
                    "cost_ratio": evaluation.cost_ratio,
                    "switched": bool(evaluation.switched),
                    "predicted_p": evaluation.predicted_p,
                    "true_p": evaluation.true_p,
                }
            )
    passed = all(s["switched"] and s["cost_ratio"] <= _ACCEPTANCE_COST_RATIO for s in scores)

    checkpoint = {
        "schema": "espira.policy/1",
        "method": "R15",
        "engine": "spinoct.amortized",
        "seed": _SEED,
        "train_materials": list(train_materials),
        "train_dampings": [float(a) for a in dampings],
        "train_switching_times_tau0": list(_TRAIN_TIMES),
        "weights": _weights(policy),
    }
    if write:
        CHECKPOINT_PATH.parent.mkdir(parents=True, exist_ok=True)
        CHECKPOINT_PATH.write_text(json.dumps(checkpoint, indent=2, allow_nan=False), encoding="utf-8", newline="\n")
        REGISTRY_PATH.write_text(
            json.dumps(
                {
                    "schema": "espira.model-registry/1",
                    "models": [
                        {
                            "name": "amortized-shape-policy",
                            "method": "R15",
                            "version": "1",
                            "engine": "spinoct.amortized",
                            "license": "MIT",
                            "lane": "precompute",
                            "checkpoint": CHECKPOINT_PATH.name,
                            "train_materials": list(train_materials),
                            "held_out_materials": list(test_materials),
                            "training_dampings": [float(a) for a in dampings],
                            "acceptance": {
                                "rule": "every held-out case reverses and costs at most "
                                f"{_ACCEPTANCE_COST_RATIO:g} times the analytic optimum",
                                "passed": passed,
                                "scores": scores,
                            },
                            "status": "trained" if passed else "trained, gate failed",
                        }
                    ],
                },
                indent=2,
                allow_nan=False,
            ),
            encoding="utf-8",
            newline="\n",
        )
    return TrainedPolicy(checkpoint, train_materials, test_materials, tuple(scores), passed)


@cache
def load_or_train_policy():
    """The trained policy object, trained once per process.

    `infer` needs the policy itself, not its checkpoint, and training it is a second of work; caching
    keeps the release from retraining it for every variant while keeping the training set identical to
    the one the registry records.
    """
    by_split = splits()
    dampings = _training_dampings(by_split["train"], by_split["test"])
    reference = get_material(by_split["train"][0])
    return train_amortized_policy(
        mu=reference.moment_j_per_t,
        anisotropy_j=reference.anisotropy_j,
        alphas=dampings,
        switching_times_tau0=np.array(_TRAIN_TIMES),
        seed=_SEED,
    )

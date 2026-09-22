# The barrier, computed twice by two codes

Artifact: `data/artifacts/external_crosscheck.json`. Script: `scripts/crosscheck_spirit.py`, run by hand
in a separate environment. Backlog BL-013.

## The question

The floor under every switching cost this product reports is an energy barrier computed by the engine's
own climbing-image string method. If that method were wrong, every floor would be wrong together, every
internal test would still pass, and nothing inside the product would notice. The only check that can
catch it comes from outside.

## The method

[Spirit](https://spirit-code.github.io/) is an atomistic spin-dynamics framework written by other
people, and its geodesic nudged elastic band is a different method for the same object. Both codes are
given the same Hamiltonian in the same convention,

    E = -K sum_i (s_i . z)^2 - J sum_<ij> s_i . s_j,

on an open chain with nearest-neighbour exchange at J/K = 10, and both are started from the same
tanh-wall path, which this product's engine generates and the script writes into Spirit's images.

The starting point is part of the method, not a detail. A nudged elastic band relaxes into the valley it
starts in. Started from the straight interpolation between all-up and all-down, which is the coherent
rotation, Spirit converges to a barrier of exactly N K (measured: 11.999995 K at N = 12). That is a
useful check that the two anisotropy conventions agree, and it is not a check of the wall barrier.

## The measurement

| Chain | spinoct, string method | Spirit, GNEB | relative difference |
|---|---|---|---|
| N = 8 | 7.747500 K | 7.747498 K | 2.7e-07 |
| N = 12 | 8.699064 K | 8.699061 K | 3.1e-07 |
| N = 16 | 8.839571 K | 8.839569 K | 1.9e-07 |

Worst relative difference 3.1e-07, against a declared tolerance of 1e-05. Spirit 2.2.0, spinoct
0.18.000. The barrier saturates with length rather than rising as N K, which is the wall path and not
coherent rotation.

## Why Spirit is not a dependency

The product never imports Spirit, and CI never installs it. The cross-check is run by hand in a separate
environment, and its result is committed with both engine versions recorded. The suite here holds the
half it can recompute: our own barrier, recomputed on every test run, must still equal the number the
committed comparison was made against, so the agreement cannot go stale unnoticed.

## What it does not show

One Hamiltonian family, one exchange ratio, three chain lengths, and the one-dimensional case. The
two-dimensional patch barriers of C20 and C21 are not cross-checked here; Spirit can express that
geometry, and doing so is the obvious next step.

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

with nearest-neighbour exchange and open boundaries, and both are started from the same tanh-wall path,
which this product's engine generates and the script writes into Spirit's images.

Two geometries are compared, because the product reports floors on both. The chain is a line of sites at
J/K = 10. The patch is the square element of cases C20 and C21, where the wall is a line rather than a
point; it is the harder half, because a two-dimensional saddle is where a string method is most likely
to be caught out by its own resolution. Sites are indexed `i = y W + x` in both codes, which is what
lets one path be handed to the other unchanged.

The starting point is part of the method, not a detail. A nudged elastic band relaxes into the valley it
starts in. Started from the straight interpolation between all-up and all-down, which is the coherent
rotation, Spirit converges to a barrier of exactly N K (measured: 11.999995 K at N = 12). That is a
useful check that the two anisotropy conventions agree, and it is not a check of the wall barrier.

## The measurement

| Lattice | J/K | spinoct, string method | Spirit, GNEB | barrier / NK | relative difference |
|---|---|---|---|---|---|
| chain, N = 8 | 10 | 7.747500 K | 7.747498 K | 0.968 | 2.7e-07 |
| chain, N = 12 | 10 | 8.699064 K | 8.699061 K | 0.725 | 3.1e-07 |
| chain, N = 16 | 10 | 8.839571 K | 8.839569 K | 0.552 | 1.9e-07 |
| patch, 8 x 8 | 10 | 61.979997 K | 61.980082 K | 0.968 | 1.4e-06 |
| patch, 12 x 12 | 10 | 104.388765 K | 104.388835 K | 0.725 | 6.6e-07 |
| patch, 8 x 8 | 2.5 | 34.317118 K | 34.317118 K | 0.536 | 8.1e-09 |

Worst relative difference 1.4e-06, against a declared tolerance of 1e-05. Spirit 2.2.0, spinoct
0.18.000. Every row's barrier is below the coherent saddle N K, which is what says these are wall paths
and not the rotation both codes would find from a straight interpolation: on the 8 x 8 patch at
J/K = 2.5 the wall costs 0.536 of it.

The largest deviation is on the 8 x 8 patch at J/K = 10, the row closest to the coherent saddle at 0.968
N K, where the wall and the rotation are nearly degenerate and the two methods are choosing between two
almost equal saddles. The deepest wall in the table, the same patch at J/K = 2.5, is where they agree
best, to 8.1e-09. That ordering is the expected one, and its absence would have been the finding.

## Why Spirit is not a dependency

The product never imports Spirit, and CI never installs it. The cross-check is run by hand in a separate
environment, and its result is committed with both engine versions recorded. The suite here holds the
half it can recompute: our own barrier, recomputed on every test run, must still equal the number the
committed comparison was made against, so the agreement cannot go stale unnoticed.

## What it does not show

One Hamiltonian family, two exchange ratios, six lattices. Both codes are static: they agree about the
saddle, which is the floor under the cost, and neither of them says anything here about the dynamics
that reach it. That is the other half of BL-013, checked by a different code with a different method:
VAMPIRE, run under process isolation, re-integrates the equation of motion, in
[11_external-dynamics-crosscheck.md](11_external-dynamics-crosscheck.md).

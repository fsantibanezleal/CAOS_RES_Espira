# The two-dimensional patch: where the crossover moves

Artifact: `data/artifacts/patch_ocp.json`. Bake: `python data-pipeline/run_patch_ocp.py` (hours,
parallel and checkpointed; `--floors` recomputes only the minimum energy paths). Shown in Experiments,
"Two-dimensional patch". Cases C20 and C21, finding F-020.

## The question

A chain is one dimension; a real element is a patch. Does the crossover of
[02_free-chain-crossover.md](02_free-chain-crossover.md) survive in two dimensions, and where does it
sit?

## The method

The same free search on a square W x W patch with nearest-neighbour exchange, at two anisotropy regimes
with everything else fixed (damping 0.5, T = 160 tau0): J/K = 10, whose wall is 2.24 sites wide, and
J/K = 2.5, whose wall is 1.12 sites wide. Sides 4, 8, 12, 16, 24 and 32. The gradient uses the patch's
own colouring, `(x + 2y) mod 5`, a perfect code that costs 60 evaluations per gradient whatever the
patch size.

## The measurement, and the expectation it refuted

C21 declared, before anything was computed, that a narrower wall would push the crossover to larger
patches. The measurement says the opposite.

| Side W | J/K = 10 (wall 2.24 sites) | J/K = 2.5 (wall 1.12 sites) |
|---|---|---|
| 4 | 1.0000 (reverses coherently) | 0.9412 |
| 8 | 0.9575 | 0.5653 |
| 12 | 0.7130 | 0.4933 |
| 16 | 0.5738 | 0.5440 |
| 24 | 0.4957 | 0.4916 |
| 32 | 0.5156 | 0.5930 |

Values are cost over the uniform bound on the same grid. The crossover tracks the wall width: the
narrower wall wins already on the smallest patch, where the wider one still reverses coherently.

## What bounds it

The ratios are upper bounds, as on the chain. Above W = 12 they stop falling steadily with size because
the searches reach their 1,500-iteration cap there, so the true optimum is bracketed between the ratio
and the floor rather than located. The floors are rigorous and keep falling (0.3148, 0.2461, 0.1707 and
0.1304 at W = 12, 16, 24 and 32 for J/K = 2.5).

## The floor that was withheld, and why it was not an iteration problem

Version 0.10.000 shipped W = 32 at J/K = 2.5 with no floor: the string method had not converged in
200,000 iterations. The cause was the path, not the iteration count. With images spaced about one site
apart and a wall 1.12 sites wide, neighbouring images differ by more than the wall itself, so the
climbing image hops between lattice positions instead of settling; the barrier wandered by about a part
in a thousand. spinoct 0.17.000 added `recommended_images`, about three images per wall width, and the
same path converges in 1,185 iterations and 30 seconds. See finding F-021.

## What it does not show

Material-free, like the chain: the result is in sites and wall widths. One damping and one switching
time, chosen where the one-dimensional answer is clearest.

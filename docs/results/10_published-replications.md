# The published replications: what reproduces, and what does not

Artifacts: `data/artifacts/kickoff-replication.json` (case C10) and
`data/artifacts/prb107-biaxial-figures.json` (case C05). Both are baked by the main pipeline. Finding
F-025, backlog BL-002 and BL-014.

## The question

This product exists because of one paper, and it rests on a lineage of four more. A product that only
ever agrees with itself is not evidence of anything. These two cases check it against numbers other
people published, at their settings, and record both what reproduces and what does not.

## C10: the kickoff paper's peak switching fields

The source reports, for monolayer CrSBr, the peak amplitude of the optimal pulse at named switching
times, beside the static antiparallel field a conventional protocol needs at the same time. The peak
field of a coherent rotation does not depend on how many spins rotate together, so those numbers are
directly comparable with this product's macrospin.

At the damping the database assumes for CrSBr (0.01):

| Switching time | this product | published | ratio |
|---|---|---|---|
| 4 ps | 4.47 T | 4.6 T | 0.97 |
| 126 ps | 150.4 mT | 150 mT | 1.00 |
| 140 ps | 136.2 mT | 135 mT | 1.01 |
| 2 ns | 19.7 mT | 9.6 mT | 2.06 |

Three of the four reproduce within 3 per cent, two within 1. The fourth needs a damping near 0.001 to
reproduce, and the paper states a range of 0.001 to 0.05 for this family, so that point is a parameter
difference rather than a disagreement about the physics: at 0.001 this product gives 9.8 mT.

**The source contradicts itself at one point.** For the same 126 ps it says the optimal protocol needs
"a field of an order of magnitude smaller (0.11 T)" in one section and "only 150 mT" in another. An
independent computation lands on 150.4 mT. The case carries both published values and the ratio to each,
so a reader can see which one it reproduces instead of being handed a choice already made.

**The energies are not replicated, and the case says why.** They are extensive, quoted for a
50 x 50 nm^2 element, and the source's cost functional carries a prefactor it declares proportional to a
unit-cell volume and then sets to one, with a device resistance of one ohm. The constant that turns a
cost in T^2 s into the joules it prints cannot be reconstructed from the text, and this product does not
invent one.

## C05: the biaxial paper's thermal-robustness table

The lineage paper publishes eight measured success rates of its optimal protocol under thermal
fluctuations, at four barrier-to-temperature ratios and two dampings, with its protocol in an appendix:
a switching time of two Larmor times, a hard-axis ratio of five, and three stages (equilibration at zero
field to reach a Boltzmann distribution, the pulse with the noise on, a final equilibration).

Over 1,000 copies per cell, every published cell reproduces within the Monte-Carlo interval:

| Barrier / kT | this product, alpha = 0.01 | published | this product, alpha = 0.1 | published |
|---|---|---|---|---|
| 30 | 96.0 | 95.3 | 96.9 | 96.8 |
| 50 | 98.2 | 98.4 | 99.0 | 98.9 |
| 70 | 99.6 | 99.6 | 99.9 | 99.6 |
| 80 | 99.9 | 99.9 | 100.0 | 99.8 |

## The trap this case fell into first

At a damping of 0.1 the table reproduced immediately. At 0.01 this product returned 100 per cent in
every cell against a published 95.3 to 99.9, which reads like a clean non-replication of someone else's
work. It was not. Reaching a Boltzmann distribution takes a dissipation time, tau0 over the damping, and
the fixed two-Larmor-time equilibration that suffices at 0.1 is ten times too short at 0.01: the
ensemble started with a spread of 0.0013 against a Boltzmann 0.017, so no copy could fail. Equilibrating
for ten dissipation times gives 96.0 against the published 95.3.

Ruled out along the way: the post-pulse relaxation stage, which moves the rate by 0.3 points, and
multiple optimal branches, since six seeds find one optimum at both dampings.

The case now records the equilibrium spread it starts from, at every cell, and a test holds that spread
to falling like one over the barrier. An ensemble that cannot fail is visible in the artifact instead of
flattering the result.

## Where to see it

Both comparisons are drawn in the app, on the Experiments page under Published replications: the peak
field against switching time on log axes, the success rate against the barrier at both dampings, and
the tables under each chart. A browser gate (`e2e/replications.mjs`) compares every rendered cell with
the committed artifact, so the page cannot show an agreement the artifact does not have, and it fails
the build if the point that does not reproduce is ever dropped from the table.

## What these do not show

C10 compares fields, not energies, and one material. C05 compares one protocol at one switching time and
hard-axis ratio, with this product's own optimal path rather than the source's: agreement means the two
paths are equally robust, not that they are the same path.

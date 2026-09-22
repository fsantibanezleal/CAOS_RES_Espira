# The device trade-off: what a shorter deadline costs

Artifact: `data/artifacts/pareto.json`, written by the main bake (milliseconds per point, the family is
closed form). Shown in Experiments, "Device trade-offs (R14)". Backlog BL-025.

## The question

Every workbench case reports one scalar: a cost at a switching time. A device does not get to pick one
objective. It has to supply a peak field from a real generator, over a real bandwidth, within a time
budget, and those pull against each other.

## The method

`spinoct.pareto` evaluates the analytic optimal-control family on four objectives at once (switching
time, field cost, peak field, 99 per cent spectral width) over 24 log-spaced switching times from 0.5 to
200 tau0, for every material in the database, and marks which points are dominated.

## Two things the measurement corrected

**Counting the deadline as an objective empties the question.** Every point in the sweep sits at a
different switching time, so no point can be at least as good as another everywhere, and the "front" is
the whole sweep by construction. That is an artefact of the framing, not a result. The bake therefore
also ranks the three quantities the hardware must supply with the deadline fixed; there only one point
of 24 survives.

**The bandwidth is not monotone in the time budget.** The cost and the peak field fall like 1/T (fitted
log-log slopes -1.00 and -0.96), but the 99 per cent spectral width does not: it falls with a slope of
-0.32 and a large fit residual, and on CrSBr there are **11 pairs where the slower protocol demands the
wider band**, the worst widening it 1.54 times between 3.10 and 4.02 tau0. Checked against the estimator
itself: the widths hold to four digits from 2,048 to 131,072 samples, so this is the pulse family, not
the transform's frequency grid. The optimal pulse turns with the precession, and as the budget grows the
lobe carrying the last per cent of the energy changes, which moves the width in jumps.

So "slower is easier to generate" is true for the amplifier and false for the band.

## The measurement, per material

The family is universal in reduced units at a given damping, so materials sharing a damping share every
fitted slope exactly; what separates them is the absolute scale. A test holds both facts, so a change
that broke the reduction would fail rather than pass quietly.

## What it does not show

The front is over the analytic uniaxial family only: it does not include constrained protocols (cases
C23 and C24 price those separately), nor a circuit model. The cost stays in tesla-squared-seconds and is
never converted to joules here.

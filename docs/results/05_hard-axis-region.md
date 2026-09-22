# Where a hard axis actually reduces the switching cost

Artifact: `data/artifacts/hard_axis_map.json`. Bake: `python data-pipeline/run_hard_axis_map.py`
(parallel, checkpointed, a few minutes). Shown in Experiments, "Where the hard axis pays".
Backlog BL-035, finding F-011.

## The question

A hard axis is the one mechanism in this literature that can beat the free-macrospin cost: the internal
torque does part of the work, so the applied field has less to supply. Case C04 measures that along one
line, sweeping the hard-axis ratio at a single damping and switching time, and found the benefit is not
monotone. The question a designer actually asks is wider: over what region of hard-axis ratio, damping
and switching time does the mechanism pay at all?

## The method

Each point solves the biaxial optimal control path numerically (`spinoct.numeric.ImageOCPSolver`, four
seeds, 2,500 iterations) and divides it into the uniaxial closed-form optimum of the same system:

    reduction = uniaxial closed-form cost / biaxial numerical cost

Above one the hard axis paid for itself; below one it charged more than it saved. The grid is seven
hard-axis ratios (0 to 8), four dampings (0.001 to 0.5) and seven switching times (2 to 200 tau0), 196
points on the product's synthetic reference macrospin. The map is in reduced units, so any material with
the same damping and reduced switching time sits at the same point of it.

## The control, and why it decides what counts

At a hard-axis ratio of zero the biaxial system **is** the uniaxial one, so the numerical solver should
return the closed form exactly. It returns it to within about a per cent at most points, and drifts to
26 per cent in the long-time corner where the optimum approaches its infinite-time floor. Reading a raw
reduction of 1.005 as "the hard axis helped" would be reading that drift.

Every cell is therefore divided by the control at its own damping and switching time, and a cell counts
as evidence only when the control holds to 5 per cent, the solve converged, and the uniaxial optimum is
not already at its infinite-time floor. The map draws the rest crossed out.

## The measurement

- 145 of 196 cells are evidence. The other 51: 44 unconverged solves, 7 where the optimum is already its
  own floor, and the cells whose control drifts past 5 per cent.
- The hard axis pays in **80 of those 145**, and all of them sit at short switching times.
- The best point is **4.32 times** the uniaxial cost, at ratio 4, damping 0.001 and T = 2 tau0.
- At damping 0.01 the benefit reaches T = 20 tau0 and is gone beyond it; at damping 0.1 and 0.5 it ends
  sooner. At long switching times the hard axis's own in-plane barrier costs more than it saves, which is
  the non-monotonicity C04 found, now located in the full parameter region.

## What it does not show

The map is computed for the synthetic reference system, so it transfers to a material through its
damping and its reduced switching time, not through its absolute scale. It says nothing about materials
whose hard axis is not a simple biaxial term, and nothing about the long-time corner it excludes: there
the question is real but this method cannot answer it, which is why those cells are drawn apart rather
than filled in.

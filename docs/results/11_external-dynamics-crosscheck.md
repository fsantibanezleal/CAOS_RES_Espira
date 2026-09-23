# The trajectory, integrated twice by two codes

Artifact: `data/artifacts/external_dynamics_crosscheck.json`. Script: `scripts/crosscheck_vampire.py`,
run by hand against a separately built binary. Backlog BL-013.

## The question

The other external cross-check compares an energy barrier, and a barrier is static. It says nothing
about the equation of motion, which is what the entire product is: every protocol is a field applied to
a Landau-Lifshitz-Gilbert trajectory, every switching verdict is that trajectory reaching the far pole,
every reliability number is an ensemble of them. If the engine's right-hand side were wrong, all of
that would be wrong together, the barrier would still be right, and no internal test would notice.

## The method

[VAMPIRE](https://vampire.york.ac.uk/) is an atomistic spin-dynamics code written by other people, with
its own integrator (Heun) and its own units. Both codes are given the same macrospin, the same starting
direction and the same static field, and the trajectories are compared sample by sample.

Both integrate the Gilbert form

    (1 + alpha^2) ds/dt = -gamma s x B - alpha gamma s x [s x B]

with `B = B_applied + (2 K / mu) s_z z`, so the mapping is direct: VAMPIRE's `atomic-spin-moment` in
Bohr magnetons is the engine's `mu`, its `uniaxial-anisotropy-constant` in joules per atom is the
engine's `anisotropy_j`, and its `damping-constant` is `alpha`.

**One constant is not shared, and it matters more than everything else here.** VAMPIRE hard-codes the
gyromagnetic ratio as `1.76e11` rad/(s T); the engine uses the CODATA electron value
`1.760859...e11`. The difference is 4.9e-4, it enters as a rescaling of time, and over two picoseconds
of precession it moves the trajectory by `1.0e-04`: a hundred times the level at which the two codes
otherwise agree. Left unnoticed, that single rounded constant would have looked like a real
disagreement between two implementations of the same equation. The script gives the engine VAMPIRE's
constant, so the comparison is about the equation of motion.

## The measurement

| Configuration | alpha | field (T) | duration | worst deviation |
|---|---|---|---|---|
| precession | 0.1 | 0, 0, 0.5 | 2 ps | 7.9e-07 |
| precession | 0.01 | 0, 0, 0.5 | 2 ps | 8.3e-07 |
| transverse drive | 0.05 | 0.4, 0, 0 | 2 ps | 6.7e-07 |
| reversal | 0.1 | 0, 0, -3.0 | 400 ps | 4.7e-06 |

Worst deviation 4.7e-06 in the length of the moment vector, against a declared tolerance of 1e-05,
which is set by VAMPIRE printing six significant figures. On the reversal the two codes put the moment
through the equator at **78.7319 ps** and **78.7319 ps**.

## The row that had to be made into a reversal

The reversal row is the one that matters, because it is the motion every protocol in this product is a
shaped version of, and it took two attempts to make it one.

The first used a reversing field of 1.2 T. The anisotropy field here is `2K/mu = 1.73 T`, so the field
was below the Stoner-Wohlfarth threshold and the moment simply stayed near the pole: both codes agreed,
to seven digits, that nothing happened. The second raised the field to 3 T but ran for 100 ps, and a
damped reversal at `alpha = 0.1` grows the tilt angle at `alpha gamma (B - 2K/mu)`, a 45 ps time
constant, so both codes again agreed on a moment still at `m_z = 0.8847`.

A comparison that cannot fail is not a check. The script now refuses to write an artifact if the row
called a reversal did not cross the equator in both codes, the artifact records both crossing times,
and the checker and the browser gate both reject a reversal row without them.

## Why VAMPIRE is not a dependency

VAMPIRE is GPL-2; this product and its engine are MIT. Nothing is linked, nothing is imported, no
VAMPIRE source enters either repository: the binary is built separately, run as a child process over
input files the adapter writes into a scratch directory, and only its numeric output is read back. The
adapter is one script, run by hand, and CI never installs or runs it. That is what keeps the licences
apart, and it is the reason the adapter was specified this way rather than as a library.

## What it does not show

One macrospin, zero temperature, static fields. It does not compare the shaped pulses themselves (the
input format takes a constant field, not an arbitrary waveform), the lattice cases, or the stochastic
integrator at finite temperature. What it does establish is that the equation of motion underneath all
of those, with damping, precession and anisotropy together, is the same equation in both codes.

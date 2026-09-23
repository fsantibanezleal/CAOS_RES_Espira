# Live-lane parity: does the browser compute the same thing?

Artifact: `data/artifacts/live_parity.json`, written by the main bake. Shown in Implementation,
"Live-lane parity", and gated by `frontend/e2e/parity.mjs`. Backlog BL-008.

## The question

The lane gate measures runtime and artifact size and puts cases C03 and C10 in the live lane, which
means the browser evaluates their closed forms rather than replaying the bake. A lane verdict of "live" is a claim
until something on the client can actually evaluate the case, and an implementation can agree with the
engine at one working point and disagree elsewhere.

## The method

Two implementations of the same closed form, written separately so agreement is a check and not a copy:
`spinoct/analytic/sot.py` in Python and `frontend/src/engine/sotAnalytic.ts` in TypeScript. The fixture
pins, from the offline lane:

- the complete elliptic integral of the first kind `K(m)` in the parameter convention, from SciPy, over
  twelve moduli from 0 to 0.999. The grid reaches the singular end on purpose: `K(m)` diverges
  logarithmically as m approaches one, and an arithmetic-geometric mean that stops one step early goes
  wrong there first;
- the protocol's own quantities (mean current, fast-switching cost, characteristic time) over the case's
  six switching times, from the engine.

The Implementation page recomputes both in the browser and reports the largest relative deviation; the
gate fails the build when it exceeds the committed tolerance.

## The measurement

- Elliptic integral: worst relative deviation **2.4e-16**, against a tolerance of 1e-13.
- Protocol: worst relative deviation **1.3e-16**, against a tolerance of 1e-9.

Both are at the level of double-precision rounding, including at m = 0.999.

## What it does not show

Parity is not correctness: it shows that two implementations of the same equations agree, and the
equations themselves are checked against their source and against the analytic oracles (cases C01 to
C04). The fixture covers C03's closed form; C10, the second live case, is checked the other way, by
the workbench recomputing its peak field in the browser and the observable gate comparing that number
with the committed artifact at every working point.

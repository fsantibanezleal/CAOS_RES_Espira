// The uniaxial closed-form optimal control path, in the browser.
//
// Written separately from the engine's Python, on purpose: the live lane's whole value is that two
// implementations of one closed form agree, and a transcription would prove nothing. The engine is
// spinoct.analytic.uniaxial; the identities are Kwiatkowski, Badarneh, Berkov and Bessarab,
// Phys. Rev. Lett. 126, 177206 (2021).
//
// What the browser needs for case C10 is the PEAK amplitude of the optimal pulse, which is the number
// the kickoff paper publishes and the case compares against. Getting it wrong is easy: the amplitude
//
//     b(u) = K / (mu p sqrt(1+a^2)) [dn(u|m) + a p sn(u|m)],   m = -a^2 p^2 < 0,
//
// runs over u from 0 to 4K(m) across the pulse (the polar angle is half the Jacobi amplitude, and the
// amplitude reaches 2 pi at u = 4K). At the start, the midpoint and the end sn = 0 and dn = 1, so all
// three give one value, and it is neither extremum: for a negative parameter the amplitude is largest
// a quarter of the way through, at u = K(m), where sn = 1 and dn = sqrt(1 + a^2 p^2), and smallest at
// three quarters, u = 3K(m), where sn = -1. The engine once reported the start-and-midpoint value as
// the peak (F-028). So no Jacobi functions are needed here at all: the peak is closed form once p is
// known, and p follows from the switching time through the complete elliptic integral this module
// already has.

import { completeK } from './sotAnalytic';

export const BROWSER_METHOD = 'R05';

export interface UniaxialInput {
  alpha: number;
  gamma: number;
  anisotropyJ: number;
  mu: number;
  tau0S: number;
  switchingTime: number;
}

/** Solve `T = 4 tau0 (1 + a^2) p K(-a^2 p^2)` for the shape parameter `p`.
 *
 * The right-hand side is strictly increasing in `p`, so a bracketing search is safe and the root is
 * unique. The bracket is derived, not guessed: `K(m) < K(0) = pi/2` for every `m < 0`, so
 * `T < 2 pi tau0 (1 + a^2) p` and therefore `p > T / (2 pi tau0 (1 + a^2))`, which is a rigorous lower
 * bound; doubling from there terminates because `p K(-a^2 p^2)` grows without bound.
 *
 * The `(1 + a^2)` in that bound is load-bearing and was missing here at first. Without it the "lower
 * bound" sits ABOVE the root at short switching times, where `m` is nearly zero and `K(m)` is nearly
 * `K(0)`: the expansion loop then never runs, the bracket is a point, and the answer comes back high
 * by exactly a factor of `1 + a^2`. At `alpha = 0.01` that is one part in ten thousand, which is a
 * hundred times the level this lane is checked at, and it showed up only against the engine.
 */
export function solveShapeParameter(input: UniaxialInput): number {
  const { alpha, tau0S, switchingTime } = input;
  if (switchingTime <= 0) throw new Error('switchingTime must be positive');
  if (alpha === 0) return switchingTime / (2 * Math.PI * tau0S);

  const scale = 4 * tau0S * (1 + alpha * alpha);
  const timeFor = (p: number) => scale * p * completeK(-(alpha * alpha) * p * p);

  let low = switchingTime / (2 * Math.PI * tau0S * (1 + alpha * alpha));
  let high = low;
  for (let i = 0; i < 200 && timeFor(high) < switchingTime; i += 1) high *= 2;
  // Bisection on a monotone function: 200 halvings is far past double precision, and the loop is
  // bounded so a pathological input cannot hang the page.
  for (let i = 0; i < 200; i += 1) {
    const mid = 0.5 * (low + high);
    if (timeFor(mid) < switchingTime) low = mid;
    else high = mid;
    if (high - low <= 1e-14 * high) break;
  }
  return 0.5 * (low + high);
}

/** The largest field amplitude the optimal pulse demands, in tesla. Exact, not sampled. */
export function peakAmplitude(input: UniaxialInput): number {
  const { alpha, anisotropyJ, mu } = input;
  const p = solveShapeParameter(input);
  const prefactor = anisotropyJ / (mu * p * Math.sqrt(1 + alpha * alpha));
  return prefactor * (Math.sqrt(1 + alpha * alpha * p * p) + alpha * p);
}

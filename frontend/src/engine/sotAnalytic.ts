// The live lane, made real: the closed-form optimal spin-orbit-torque protocol evaluated in the
// browser, not replayed from the bake.
//
// The lane gate (espiralab/core/gate.py) lets a case run live only when every method it declares has a
// closed form cheap enough for the browser, its measured runtime is under 250 ms and its artifact under
// 512 kB. C03 is the first case to pass, and a verdict of "live" would be a claim rather than a fact if
// nothing here could compute it. This module is that implementation; the workbench recomputes the case
// on the client and shows the agreement with the committed artifact, and a browser gate fails the build
// if the two ever disagree by more than a part in a million.
//
// Source: Vlasov, Kwiatkowski, Lobanov, Uzdin, Bessarab, "Optimal protocol for spin-orbit torque
// switching of a perpendicular nanomagnet", Phys. Rev. B 105, 134404 (2022),
// https://doi.org/10.1103/PhysRevB.105.134404. Equations 8, 9, 11 and 12; the same equations the
// engine implements in spinoct/analytic/sot.py, written independently here so the agreement is a check
// and not a copy of one arithmetic path.

/** The rung this module implements for the browser. A Python test reads this name and refuses a
 * manifest that puts a case in the live lane without an implementation here. */
export const BROWSER_METHOD = 'R06';

/** Relative tolerance of the arithmetic-geometric mean iteration; it converges quadratically. */
const AGM_TOLERANCE = 1e-15;
const AGM_MAX_STEPS = 60;

/**
 * The complete elliptic integral of the first kind, K(m), in the PARAMETER convention (m = k^2).
 *
 * Computed by the arithmetic-geometric mean: K(m) = pi / (2 agm(1, sqrt(1 - m))). The engine uses the
 * same convention, which is the one that matters: K(k^2) and K(k) differ, and mixing them silently
 * changes every current this module reports.
 */
export function completeK(m: number): number {
  if (m >= 1) return Number.POSITIVE_INFINITY;
  let a = 1;
  let b = Math.sqrt(1 - m);
  for (let step = 0; step < AGM_MAX_STEPS; step++) {
    const nextA = 0.5 * (a + b);
    const nextB = Math.sqrt(a * b);
    if (Math.abs(nextA - nextB) <= AGM_TOLERANCE * Math.abs(nextA)) {
      a = nextA;
      break;
    }
    a = nextA;
    b = nextB;
  }
  return Math.PI / (2 * a);
}

export interface SotInput {
  /** Gilbert damping. */
  alpha: number;
  /** Gyromagnetic ratio, rad / (s T). */
  gamma: number;
  /** Anisotropy energy per site, J. */
  anisotropyJ: number;
  /** Moment, J / T. */
  mu: number;
  /** Total spin-orbit-torque coupling magnitude, dimensionless in the reference reduced units. */
  xi: number;
  /** The field-like to damping-like balance angle, radians. */
  beta: number;
  /** Switching time, s. */
  switchingTime: number;
}

export interface SotResult {
  /** The natural current scale j0 = K / (mu xi), reduced units. */
  currentScale: number;
  /** The time-averaged optimal current, Eq. 8, reduced units. */
  meanCurrentReduced: number;
  /** The fast-switching cost asymptote, Eq. 9, reduced units. */
  costFastReduced: number;
  /** The characteristic switching time at the ideal ratio, Eq. 12, s. */
  characteristicTimeS: number;
  /** Whether this balance angle is the one that forbids switching, xi_F = alpha xi_D. */
  forbidden: boolean;
}

/** The balance angle giving the ideal ratio xi_D = -alpha xi_F, Eq. 11. */
export function idealSotRatioBeta(alpha: number): number {
  return -Math.atan(alpha);
}

/** Evaluate the closed-form protocol. Pure arithmetic: no allocation beyond the returned object. */
export function sotOptimalProtocol(input: SotInput): SotResult {
  const { alpha, gamma, anisotropyJ, mu, xi, beta, switchingTime } = input;
  const eta = Math.atan(alpha);
  const modulusParameter = Math.sin(beta + eta) ** 2;
  const k = completeK(modulusParameter);
  const currentScale = anisotropyJ / (mu * xi);
  // tau0 = mu / (2 gamma K) is the engine's Larmor timescale; Eq. 12 is written in it.
  const tau0 = mu / (2 * gamma * anisotropyJ);
  return {
    currentScale,
    meanCurrentReduced: (4 * currentScale * Math.sqrt(1 + alpha * alpha) * k) / switchingTime,
    costFastReduced: (4 * (1 + alpha * alpha) * k * k) / (switchingTime * gamma * gamma * xi * xi),
    characteristicTimeS: ((1 + alpha * alpha) * Math.PI * Math.PI * tau0) / (2 * alpha),
    forbidden: Math.abs(Math.tan(beta) - alpha) <= 1e-9 * Math.max(1, Math.abs(alpha)),
  };
}

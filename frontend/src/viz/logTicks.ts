// Tick labels for a uPlot logarithmic axis, shared by every log chart in the app.
//
// A log axis hands its formatter every minor split as well as the decades: 1, 2, 3 ... 9, 10, 20, 30.
// Labelling all of them works in the first decade and fails in the upper ones, where the log spacing
// packs the minors together and their labels run into one another: the Published replications chart
// shipped printing "500600708090000" under its x axis because it had its own formatter instead of this
// one. So the decades are labelled and the minors are left as grid lines only, and what was actually
// drawn is written onto the chart's host element, because uPlot paints ticks on a canvas that no DOM
// query can read and a gate has to be able to see what a reader sees.

import type uPlot from 'uplot';

/** Plain, locale-free axis text: a Spanish page must not print "0,01" under an English legend. */
export function axisLabel(value: number): string {
  return Math.abs(value) >= 1e5 || (value !== 0 && Math.abs(value) < 1e-4)
    ? value.toExponential(0)
    : String(Number(value.toPrecision(6)));
}

/**
 * A uPlot `values` callback for a log axis: decades labelled, minors blank.
 *
 * @param host the chart's container; the drawn labels are recorded on it as `data-x-ticks` or
 *   `data-y-ticks`, joined by `|`, for the browser gates.
 * @param which which axis this is.
 */
export function logDecadeTicks(host: HTMLElement, which: 'x' | 'y') {
  return (_u: uPlot, splits: number[]): (string | null)[] => {
    const drawn = splits.map((v) => {
      if (v == null || !Number.isFinite(v) || v <= 0) return null;
      const decade = Math.log10(v);
      return Math.abs(decade - Math.round(decade)) < 1e-9 ? axisLabel(v) : null;
    });
    host.dataset[which === 'x' ? 'xTicks' : 'yTicks'] = drawn.filter(Boolean).join('|');
    return drawn;
  };
}

/**
 * The whole decades that contain every value, as a uPlot range. uPlot's own log range can land a point
 * on the frame: the kickoff paper's 9.6 mT sat on the bottom edge of a 0.01 T axis.
 */
export function decadeRange(values: (number | null | undefined)[]): [number, number] {
  const positive = values.filter((v): v is number => v != null && Number.isFinite(v) && v > 0);
  if (!positive.length) return [1, 10];
  const low = 10 ** Math.floor(Math.log10(Math.min(...positive)));
  const high = 10 ** Math.ceil(Math.log10(Math.max(...positive)));
  return high > low ? [low, high] : [low, low * 10];
}

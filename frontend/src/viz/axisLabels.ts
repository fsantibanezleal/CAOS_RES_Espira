// uPlot draws axis titles on its canvas, where no DOM query can read them. The Spanish page drew
// "Switching success rate  (fraction of copies)" under a Spanish heading through 0.15.004, and the
// language gate never saw it for exactly that reason. Every chart records the titles it drew on its
// host element, beside the tick labels logTicks.ts already records, and the gates read them there.

import type uPlot from 'uplot';

/** Record a chart's axis titles on its host as `data-x-label` and `data-y-label`. */
export function recordAxisLabels(host: HTMLElement, x: string, y: string): void {
  host.dataset.xLabel = x;
  host.dataset.yLabel = y;
}

/** Record the axis titles of a uPlot options object, for charts that build their titles inline. */
export function recordPlotAxes(host: HTMLElement, opts: uPlot.Options): void {
  const title = (i: number): string => {
    const label = opts.axes?.[i]?.label;
    return typeof label === 'string' ? label : '';
  };
  recordAxisLabels(host, title(0), title(1));
}

// The case's curve: its DECLARED observable against its variant family. Most cases report the field
// switching cost, drawn with the free-macrospin cost, the universal floor and the damping band as
// references. Two do not: the spin-orbit-torque oracle reports a current in reduced units and the
// thermal case a success rate, and for those the field-cost references are meaningless and are not
// drawn. The chart reads what the case declared rather than assuming every number is a cost, which is
// the units rule the conventions require. Interactive (uPlot): hover for a value read-out at the cursor.

import { useEffect, useRef } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import type { CostRow, MethodBlock, Observable } from '../data/contract';

//: The chart never shrinks below this, and leaves this much room for the legend and axis labels.
const _MIN_HEIGHT = 320;
const _CHROME = 44;
//: Distinct strokes for the per-method series of a case that does not report a field cost.
const _METHOD_STROKES = ['#3b82f6', '#f59e0b', '#10b981', '#a855f7'];
//: Room for a tick like "8.3e+10" plus the axis label, so neither is clipped or overlaps the other.
const _Y_AXIS_PX = 78;

/** A tick label for a physical quantity: plain when it is readable, exponential when it is not.
 *
 * The values on these axes run from 1e-12 (a switching cost) through 1 (a success rate) to 1e11 (a
 * reduced current). A fixed format is unreadable for at least one of them, and uPlot's default turns
 * the x axis into dates. */
function tick(value: number | null | undefined): string {
  // uPlot passes null for a split it cannot place and for the cursor value outside the data, and a
  // formatter that throws there aborts the redraw: the chart then keeps whatever size it had, which is
  // how one chart stayed 90 px wide inside a 1000 px stage.
  if (value === null || value === undefined || !Number.isFinite(value)) return '';
  if (value === 0) return '0';
  const magnitude = Math.abs(value);
  if (magnitude >= 0.01 && magnitude < 1000) {
    return Number(value.toPrecision(3)).toString();
  }
  return value.toExponential(1).replace('e+', 'e');
}

interface Props {
  rows: CostRow[];
  axis: { label: string; unit: string };
  observable: Observable;
  /** The rungs the case declared, in order; used to draw one series per method. */
  methods: string[];
  theme: 'light' | 'dark';
}

function cssVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

/** A metric of one method's block in a row, or null when this method does not report it. */
function metricOf(row: CostRow, method: string, key: string): number | null {
  const block = row[method.toLowerCase()] as MethodBlock | undefined;
  const value = block?.[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function CostChart({ rows, axis, observable, methods, theme }: Props): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const plotRef = useRef<uPlot | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const t = rows.map((r) => r.variant);

    const stroke = cssVar('--color-fg', theme === 'dark' ? '#e8e8e8' : '#1a1a1a');
    const grid = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
    const accent = cssVar('--color-accent', '#3b82f6');

    // A log axis cannot show a zero (the search-seed family is indexed from zero), and it only helps
    // when the sweep spans decades: over a factor of two it spends the width on empty space.
    const logX = t.every((v) => v > 0) && Math.max(...t) / Math.min(...t) > 20;
    // The x series' formatter is what the legend shows at the cursor; the default is locale number
    // formatting, which renders 0.327 as "0,327" in some locales and a date when time is left on.
    const series: uPlot.Series[] = [{ label: `${axis.label} (${axis.unit})`, value: (_u, v) => tick(v) }];
    const data: (number | null)[][] = [t];
    let yLabel: string;
    let logY: boolean;
    let bounded = false;

    if (observable.is_field_cost) {
      yLabel = 'switching cost  Phi  (T^2 s)';
      logY = true;
      series.push(
        {
          label: 'damping band high',
          stroke: 'transparent',
          fill: theme === 'dark' ? 'rgba(59,130,246,0.14)' : 'rgba(59,130,246,0.10)',
          points: { show: false },
        },
        {
          label: 'damping band low',
          stroke: 'transparent',
          fill: cssVar('--color-bg', theme === 'dark' ? '#0f0f10' : '#ffffff'),
          points: { show: false },
        },
        { label: 'optimal cost', stroke: accent, width: 2.5, points: { show: true, size: 6 }, value: (_u, v) => tick(v) },
        { label: 'free macrospin', stroke: '#f59e0b', width: 1.5, dash: [6, 4], value: (_u, v) => tick(v) },
        { label: 'universal floor', stroke: '#10b981', width: 1.5, dash: [2, 3], value: (_u, v) => tick(v) },
      );
      data.push(
        rows.map((r) => r.cost_high_damping ?? null),
        rows.map((r) => r.cost_low_damping ?? null),
        rows.map((r) => r.cost ?? null),
        rows.map((r) => r.cost_free ?? null),
        rows.map((r) => r.cost_floor ?? null),
      );
    } else {
      yLabel = `${observable.label}  (${observable.unit})`;
      // A success rate lives in [0, 1] and a reduced current spans decades: pick the scale from the data.
      const values = rows
        .flatMap((r) => methods.map((method) => metricOf(r, method, observable.key)))
        .filter((v): v is number => v !== null && v > 0);
      // A bounded fraction (a switching probability) is always drawn on a linear 0 to 1 axis: a log axis
      // stretches the tail near zero and crushes the region near one, which is where a published
      // replication target usually sits. Other quantities go log when they span decades.
      const allValues = rows.flatMap((r) =>
        methods.flatMap((method) => [metricOf(r, method, observable.key), metricOf(r, method, 'published_rate')]),
      );
      bounded = allValues.every((v) => v === null || (v >= 0 && v <= 1));
      logY = !bounded && values.length > 0 && Math.max(...values) / Math.min(...values) > 20;
      methods.forEach((method, i) => {
        const column = rows.map((r) => metricOf(r, method, observable.key));
        if (column.every((v) => v === null)) return;
        series.push({
          label: `${method}  ${observable.label.toLowerCase()}`,
          stroke: _METHOD_STROKES[i % _METHOD_STROKES.length],
          width: 2.5,
          points: { show: true, size: 6 },
          value: (_u, v) => tick(v),
        });
        data.push(column);
        // A replication case carries the source's published values beside the engine's own; drawing
        // them on the same axes is what makes a gap visible instead of a footnote.
        const published = rows.map((r) => metricOf(r, method, 'published_rate'));
        if (published.some((v) => v !== null)) {
          series.push({
            label: `${method}  published`,
            stroke: '#ef4444',
            width: 0,
            points: { show: true, size: 9, fill: '#ef4444' },
            value: (_u, v) => tick(v),
          });
          data.push(published);
        }
      });
    }

    const height = Math.max(_MIN_HEIGHT, (ref.current.parentElement?.clientHeight ?? 0) - _CHROME);
    const opts: uPlot.Options = {
      width: ref.current.parentElement?.clientWidth || ref.current.clientWidth || 640,
      height,
      // uPlot treats x as a time axis by default, which turns a switching time of 2 tau0 into a date in
      // 1969. Every axis here is a physical quantity, never a timestamp.
      scales: {
        x: { time: false, distr: logX ? 3 : 1 },
        y: bounded ? { distr: 1, range: [0, 1] } : { distr: logY ? 3 : 1 },
      },
      axes: [
        {
          label: `${axis.label}  (${axis.unit})`,
          stroke,
          grid: { stroke: grid },
          ticks: { stroke: grid },
          values: (_u, splits) => splits.map((v) => tick(v)),
        },
        {
          label: yLabel,
          stroke,
          grid: { stroke: grid },
          ticks: { stroke: grid },
          size: _Y_AXIS_PX,
          values: (_u, splits) => splits.map((v) => tick(v)),
        },
      ],
      series,
      legend: { show: true },
    };

    plotRef.current?.destroy();
    plotRef.current = new uPlot(opts, data as uPlot.AlignedData, ref.current);

    // A sub-tab panel is hidden until it is selected, so a chart built at mount measures a zero-width
    // container and stays that size: the case that caught this rendered 90 px wide inside a 1000 px
    // stage. Observing the container resizes the plot when the panel becomes visible, not only when the
    // window changes.
    const resize = () => {
      // Measure the SIZED box, which is the flex parent; the chart's own div takes its width.
      const width = ref.current?.parentElement?.clientWidth ?? ref.current?.clientWidth ?? 0;
      if (width <= 0) return;
      plotRef.current?.setSize({
        width,
        height: Math.max(_MIN_HEIGHT, (ref.current!.parentElement?.clientHeight ?? 0) - _CHROME),
      });
    };
    const observer = new ResizeObserver(resize);
    observer.observe(ref.current);
    if (ref.current.parentElement) observer.observe(ref.current.parentElement);
    window.addEventListener('resize', resize);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', resize);
      plotRef.current?.destroy();
      plotRef.current = null;
    };
  }, [rows, axis, observable, methods, theme]);

  return <div ref={ref} style={{ width: '100%' }} />;
}

// The optimal pulse waveform: field amplitude and its two transverse components over the switching
// window. Interactive uPlot with a cursor read-out. The amplitude symmetry b(0)=b(T/2)=b(T) and the
// quarter/three-quarter extrema are the analytic signatures visible here.

import { useEffect, useRef } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import type { ReferencePulse } from '../data/contract';
import { tr } from '../content/dataText';
import { recordAxisLabels } from './axisLabels';

interface Props {
  pulse: ReferencePulse;
  theme: 'light' | 'dark';
  es: boolean;
}

function cssVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

//: The chart never shrinks below this, and leaves this much room for the legend and axis labels.
const _MIN_HEIGHT = 320;
const _CHROME = 44;

/** Fill the stage: a fixed chart height leaves the instrument under the measured ADR-0071 floor. */
function chartHeight(element: HTMLElement): number {
  return Math.max(_MIN_HEIGHT, (element.parentElement?.clientHeight ?? 0) - _CHROME);
}

/** A readable, locale-free number: null-safe, plain in [0.01, 1000), exponential otherwise. */
function plain(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '';
  if (value === 0) return '0';
  const magnitude = Math.abs(value);
  return magnitude >= 0.01 && magnitude < 1000
    ? Number(value.toPrecision(3)).toString()
    : value.toExponential(1).replace('e+', 'e');
}

export function PulseChart({ pulse, theme, es }: Props): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const plotRef = useRef<uPlot | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    // Time in picoseconds for a readable axis, unless the case declares another x axis (a barrier is
    // drawn against its path coordinate, not time).
    const xScale = pulse.x_scale ?? 1e12;
    // The labels a case declares are data (English in the artifact) and go through the translation
    // table; the defaults are the interface's own.
    const xLabel = pulse.x_label ? tr(pulse.x_label, es) : es ? 'tiempo' : 'time';
    const xUnit = tr(pulse.x_unit ?? 'ps', es);
    const t = pulse.time_s.map((s) => s * xScale);
    // A field is stored in tesla and shown in mT; a case whose signal is a current declares its own
    // label, unit and scale, and is never labelled a field.
    const scale = pulse.signal_scale ?? 1e3;
    const signalLabel = pulse.signal_label ? tr(pulse.signal_label, es) : es ? 'campo' : 'field';
    const signalUnit = tr(pulse.signal_unit ?? 'mT', es);
    const symbol = pulse.signal_label === 'current' ? 'j' : 'b';
    const amp = pulse.field_amplitude_t.map((b) => b * scale);
    const bx = pulse.field_x_t.map((b) => b * scale);
    const by = pulse.field_y_t.map((b) => b * scale);

    const stroke = cssVar('--color-fg', theme === 'dark' ? '#e8e8e8' : '#1a1a1a');
    const grid = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
    const accent = cssVar('--color-accent', '#3b82f6');

    const opts: uPlot.Options = {
      width: ref.current.parentElement?.clientWidth || ref.current.clientWidth || 640,
      height: chartHeight(ref.current),
      // The x axis is an elapsed time in picoseconds, not a timestamp: uPlot's default time formatting
      // would label a 33 ps pulse with dates in 1969.
      scales: { x: { time: false } },
      // Explicit, locale-free number formatting: the default printed 0.05 as "0,05" in a
      // comma-decimal locale.
      axes: [
        {
          label: `${xLabel}  (${xUnit})`,
          stroke,
          grid: { stroke: grid },
          ticks: { stroke: grid },
          values: (_u, splits) => splits.map((v) => plain(v)),
        },
        {
          label: `${signalLabel}  (${signalUnit})`,
          stroke,
          grid: { stroke: grid },
          ticks: { stroke: grid },
          values: (_u, splits) => splits.map((v) => plain(v)),
        },
      ],
      series: [
        { label: `${xLabel} (${xUnit})`, value: (_u, v) => plain(v) },
        { label: pulse.signal_series?.[0] ? tr(pulse.signal_series[0], es) : `|${symbol}|`, stroke: accent, width: 2.5, value: (_u, v) => plain(v) },
        { label: pulse.signal_series?.[1] ? tr(pulse.signal_series[1], es) : `${symbol}_x`, stroke: '#f59e0b', width: 1.3, value: (_u, v) => plain(v) },
        ...(pulse.signal_series && pulse.signal_series.length < 3
          ? []
          : [{ label: `${symbol}_y`, stroke: '#10b981', width: 1.3, value: (_u: uPlot, v: number | null) => plain(v) }]),
      ],
      legend: { show: true },
    };
    const data: uPlot.AlignedData =
      pulse.signal_series && pulse.signal_series.length < 3 ? [t, amp, bx] : [t, amp, bx, by];
    plotRef.current?.destroy();
    plotRef.current = new uPlot(opts, data, ref.current);
    recordAxisLabels(ref.current, `${xLabel}  (${xUnit})`, `${signalLabel}  (${signalUnit})`);

    // A hidden sub-tab panel has no width, so a chart built at mount would stay that size once the
    // panel is shown. Observe the container rather than only the window.
    const resize = () => {
      // Measure the SIZED box, which is the flex parent; the chart's own div takes its width.
      const width = ref.current?.parentElement?.clientWidth ?? ref.current?.clientWidth ?? 0;
      if (width <= 0) return;
      plotRef.current?.setSize({ width, height: chartHeight(ref.current!) });
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
  }, [pulse, theme, es]);

  return <div ref={ref} style={{ width: '100%' }} />;
}

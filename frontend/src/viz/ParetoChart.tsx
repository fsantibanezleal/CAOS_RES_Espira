// The device trade-off (R14): the three objectives that pull against the switching time, each divided
// by its own value at the longest switching time so quantities in T^2 s, tesla and hertz can share one
// axis. Log-log, because the cost and the peak field are power laws in the time budget and the
// bandwidth is not, which is the point the chart has to make visible.
// Interactive (uPlot): hover for values, click a legend entry to solo or hide a series. Sized by a
// ResizeObserver, so a chart built inside a hidden tab takes its width when the tab opens.

import { useEffect, useRef } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import type { ParetoMaterial } from '../data/contract';
import { logDecadeTicks } from './logTicks';
import { recordPlotAxes } from './axisLabels';

interface Props {
  item: ParetoMaterial;
  theme: 'light' | 'dark';
  es: boolean;
}

const HEIGHT = 380;
const SERIES = [
  { key: 'cost' as const, colour: '#3b82f6', en: 'field cost', es: 'costo de campo' },
  { key: 'peak_field_t' as const, colour: '#ec4899', en: 'peak field', es: 'campo pico' },
  { key: 'bandwidth_hz' as const, colour: '#f59e0b', en: 'bandwidth', es: 'ancho de banda' },
];

function cssVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

/** Plain, locale-free: a Spanish page must not print "0,8" beside a legend's "0.83". */
function plain(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '-';
  const absolute = Math.abs(value);
  if (absolute !== 0 && (absolute < 0.01 || absolute >= 1000)) return value.toExponential(2);
  return String(Number(value.toPrecision(4)));
}

export function ParetoChart({ item, theme, es }: Props): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const plotRef = useRef<uPlot | null>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host || !item.points.length) return;
    const points = [...item.points].sort((a, b) => a.switching_time_tau0 - b.switching_time_tau0);
    const times = points.map((p) => p.switching_time_tau0);
    const last = points[points.length - 1];

    const stroke = cssVar('--color-fg', theme === 'dark' ? '#e8e8e8' : '#1a1a1a');
    const grid = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
    // Label the decades only and leave the minor splits blank (see logTicks.ts for why); labelling
    // them all printed a row of placeholder dashes under this plot once.
    const tick = (which: 'x' | 'y') => logDecadeTicks(host, which);

    const data = [
      times,
      ...SERIES.map((s) => points.map((p) => p[s.key] / last[s.key])),
    ] as unknown as uPlot.AlignedData;

    const opts: uPlot.Options = {
      width: Math.max(host.clientWidth, 280),
      height: HEIGHT,
      scales: { x: { time: false, distr: 3 }, y: { distr: 3 } },
      axes: [
        {
          label: es ? 'tiempo de conmutación  T (tau0)' : 'switching time  T (tau0)',
          stroke,
          grid: { stroke: grid },
          ticks: { stroke: grid },
          values: tick('x'),
        },
        {
          label: es ? 'relativo a T = 200 tau0' : 'relative to T = 200 tau0',
          stroke,
          grid: { stroke: grid },
          ticks: { stroke: grid },
          values: tick('y'),
        },
      ],
      series: [
        { label: 'T', value: (_u, v) => plain(v) },
        ...SERIES.map((s) => ({
          label: es ? s.es : s.en,
          stroke: s.colour,
          width: 2,
          points: { show: true, size: 5 },
          value: (_u: uPlot, v: number | null) => plain(v),
        })),
      ],
      legend: { show: true },
    };
    plotRef.current?.destroy();
    plotRef.current = new uPlot(opts, data, host);
    recordPlotAxes(host, opts);

    const observer = new ResizeObserver(() => {
      if (host.clientWidth > 0) plotRef.current?.setSize({ width: host.clientWidth, height: HEIGHT });
    });
    observer.observe(host);
    return () => {
      observer.disconnect();
      plotRef.current?.destroy();
      plotRef.current = null;
    };
  }, [item, theme, es]);

  return <div ref={ref} data-testid="pareto-chart" data-material={item.material} style={{ width: '100%' }} />;
}

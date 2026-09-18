// The two-dimensional patch crossover: the cheapest trajectory found over uniform rotation (an upper
// bound on the true optimum) against the patch side, one series per anisotropy regime, with the
// minimum-energy-path floor (a rigorous lower bound) of the selected regime and the uniform line at one.
// Interactive (uPlot): hover for values, click a legend entry to solo or hide a series. Sized by a
// ResizeObserver, so a chart built inside a hidden tab takes its width when the tab opens.

import { useEffect, useRef } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import type { PatchOCPCase } from '../data/contract';

interface Props {
  cases: PatchOCPCase[];
  selectedJK: number;
  theme: 'light' | 'dark';
  es: boolean;
}

const PALETTE = ['#3b82f6', '#ec4899', '#f59e0b', '#8b5cf6'];
const HEIGHT = 360;

function cssVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

const fixed = (_u: uPlot, v: number | null) => (v == null ? '-' : v.toFixed(4));
/** Axis ticks without the browser locale, so a Spanish page never prints "0,8" beside a legend's "0.8353". */
const localeFree = (_u: uPlot, splits: number[]) => splits.map((v) => String(+v.toFixed(6)));

export function PatchChart({ cases, selectedJK, theme, es }: Props): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const plotRef = useRef<uPlot | null>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host || !cases.length) return;
    const widths = [...new Set(cases.map((c) => c.width))].sort((a, b) => a - b);
    const regimes = [...new Set(cases.map((c) => c.exchange_over_k))].sort((a, b) => b - a);
    const lookup = (jk: number, w: number) => cases.find((c) => c.exchange_over_k === jk && c.width === w);

    const stroke = cssVar('--color-fg', theme === 'dark' ? '#e8e8e8' : '#1a1a1a');
    const grid = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

    const series: uPlot.Series[] = [
      { label: 'W', value: (_u: uPlot, v: number | null) => (v == null ? '-' : `${v}`) },
      ...regimes.map((jk, i) => ({
        label: `J/K = ${jk}`,
        stroke: PALETTE[i % PALETTE.length],
        width: jk === selectedJK ? 3 : 1.5,
        points: { show: true, size: jk === selectedJK ? 7 : 4 },
        value: fixed,
      })),
      {
        label: es ? `piso MEP (J/K = ${selectedJK})` : `MEP floor (J/K = ${selectedJK})`,
        stroke: '#10b981',
        width: 1.5,
        dash: [2, 3],
        value: fixed,
      },
      { label: es ? 'rotacion uniforme' : 'uniform rotation', stroke, width: 1, dash: [6, 4], value: fixed },
    ];
    const data = [
      widths,
      ...regimes.map((jk) => widths.map((w) => lookup(jk, w)?.best_ratio ?? null)),
      widths.map((w) => lookup(selectedJK, w)?.floor_ratio ?? null),
      widths.map(() => 1),
    ] as unknown as uPlot.AlignedData;

    const opts: uPlot.Options = {
      width: Math.max(host.clientWidth, 280),
      height: HEIGHT,
      scales: { x: { time: false }, y: { range: [0, 1.08] } },
      axes: [
        {
          label: es ? 'lado del parche  W (sitios)' : 'patch side  W (sites)',
          stroke,
          grid: { stroke: grid },
          ticks: { stroke: grid },
        },
        {
          label: es ? 'costo / costo uniforme' : 'cost / uniform cost',
          stroke,
          grid: { stroke: grid },
          ticks: { stroke: grid },
          values: (u: uPlot, splits: number[]) => {
            const drawn = localeFree(u, splits);
            host.dataset.yTicks = drawn.join('|'); // the labels as drawn, for the gate to read
            return drawn;
          },
        },
      ],
      series,
      legend: { show: true },
    };
    plotRef.current?.destroy();
    plotRef.current = new uPlot(opts, data, host);

    const observer = new ResizeObserver(() => {
      if (host.clientWidth > 0) plotRef.current?.setSize({ width: host.clientWidth, height: HEIGHT });
    });
    observer.observe(host);
    return () => {
      observer.disconnect();
      plotRef.current?.destroy();
      plotRef.current = null;
    };
  }, [cases, selectedJK, theme, es]);

  return <div ref={ref} data-testid="patch-chart" style={{ width: '100%' }} />;
}

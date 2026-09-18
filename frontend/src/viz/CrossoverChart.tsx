// The free chain crossover: the cheapest trajectory found over uniform rotation (an upper bound on the
// true optimum) against chain length, one series per switching time, with the minimum-energy-path floor
// (a rigorous lower bound) for the selected switching time and the uniform line at one. Interactive
// (uPlot): hover for values, click a legend entry to solo or hide a series.

import { useEffect, useRef } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import type { LatticeOCPCase } from '../data/contract';

interface Props {
  cases: LatticeOCPCase[];
  selectedT: number;
  theme: 'light' | 'dark';
  es: boolean;
}

const PALETTE = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];
/** Axis ticks without the browser locale, so a Spanish page never prints "0,8" beside a legend's "0.8353". */
const localeFree = (_u: uPlot, splits: number[]) => splits.map((v) => String(+v.toFixed(6)));

function cssVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

export function CrossoverChart({ cases, selectedT, theme, es }: Props): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const plotRef = useRef<uPlot | null>(null);

  useEffect(() => {
    if (!ref.current || !cases.length) return;
    const sizes = [...new Set(cases.map((c) => c.n_sites))].sort((a, b) => a - b);
    const times = [...new Set(cases.map((c) => c.switching_tau0))].sort((a, b) => a - b);
    const lookup = (t: number, n: number) => cases.find((c) => c.switching_tau0 === t && c.n_sites === n);

    const stroke = cssVar('--color-fg', theme === 'dark' ? '#e8e8e8' : '#1a1a1a');
    const grid = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

    const ratioSeries = times.map((t) => sizes.map((n) => lookup(t, n)?.best_ratio ?? null));
    const floor = sizes.map((n) => lookup(selectedT, n)?.floor_ratio ?? null);
    const unity = sizes.map(() => 1);

    const series: uPlot.Series[] = [
      { label: 'N' },
      ...times.map((t, i) => ({
        label: `T = ${t} tau0`,
        stroke: PALETTE[i % PALETTE.length],
        width: t === selectedT ? 3 : 1.5,
        points: { show: true, size: t === selectedT ? 7 : 4 },
        value: (_u: uPlot, v: number | null) => (v == null ? '-' : v.toFixed(4)),
      })),
      {
        label: es ? `piso MEP (T = ${selectedT} tau0)` : `MEP floor (T = ${selectedT} tau0)`,
        stroke: '#10b981',
        width: 1.5,
        dash: [2, 3],
        value: (_u: uPlot, v: number | null) => (v == null ? '-' : v.toFixed(4)),
      },
      { label: es ? 'rotacion uniforme' : 'uniform rotation', stroke, width: 1, dash: [6, 4] },
    ];

    const width = ref.current.clientWidth || 640;
    const opts: uPlot.Options = {
      width,
      height: 360,
      scales: { x: { time: false }, y: { range: [0, 1.08] } },
      axes: [
        { label: es ? 'longitud de la cadena  N (sitios)' : 'chain length  N (sites)', stroke, grid: { stroke: grid }, ticks: { stroke: grid } },
        {
          label: es ? 'costo / costo uniforme' : 'cost / uniform cost',
          stroke,
          grid: { stroke: grid },
          ticks: { stroke: grid },
          values: localeFree,
        },
      ],
      series,
      legend: { show: true },
    };
    const data = [sizes, ...ratioSeries, floor, unity] as unknown as uPlot.AlignedData;
    plotRef.current?.destroy();
    plotRef.current = new uPlot(opts, data, ref.current);

    const onResize = () => plotRef.current?.setSize({ width: ref.current!.clientWidth, height: 360 });
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      plotRef.current?.destroy();
      plotRef.current = null;
    };
  }, [cases, selectedT, theme, es]);

  return <div ref={ref} data-testid="crossover-chart" style={{ width: '100%' }} />;
}

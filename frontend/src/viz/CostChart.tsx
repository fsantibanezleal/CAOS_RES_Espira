// The switching-cost curve: optimal cost against switching time, with the free-macrospin cost and the
// universal floor as reference lines, and the damping uncertainty band. Interactive (uPlot): hover for
// a value read-out at the cursor. Log-log, because both axes span orders of magnitude.

import { useEffect, useRef } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import type { CostRow } from '../data/contract';

interface Props {
  rows: CostRow[];
  theme: 'light' | 'dark';
}

function cssVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

export function CostChart({ rows, theme }: Props): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const plotRef = useRef<uPlot | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const t = rows.map((r) => r.switching_time_tau0);
    const optimal = rows.map((r) => r.cost);
    const free = rows.map((r) => r.cost_free);
    const floor = rows.map((r) => r.cost_floor);
    const bandLow = rows.map((r) => r.cost_low_damping);
    const bandHigh = rows.map((r) => r.cost_high_damping);

    const stroke = cssVar('--color-fg', theme === 'dark' ? '#e8e8e8' : '#1a1a1a');
    const grid = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
    const accent = cssVar('--color-accent', '#3b82f6');

    const width = ref.current.clientWidth || 640;
    const opts: uPlot.Options = {
      width,
      height: 360,
      scales: { x: { distr: 3 }, y: { distr: 3 } },
      axes: [
        {
          label: 'switching time  T / tau0',
          stroke,
          grid: { stroke: grid },
          ticks: { stroke: grid },
        },
        {
          label: 'switching cost  Phi  (T^2 s)',
          stroke,
          grid: { stroke: grid },
          ticks: { stroke: grid },
        },
      ],
      series: [
        { label: 'T / tau0' },
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
        { label: 'optimal cost', stroke: accent, width: 2.5, points: { show: true, size: 6 } },
        { label: 'free macrospin', stroke: '#f59e0b', width: 1.5, dash: [6, 4] },
        { label: 'universal floor', stroke: '#10b981', width: 1.5, dash: [2, 3] },
      ],
      legend: { show: true },
    };

    const data: uPlot.AlignedData = [t, bandHigh, bandLow, optimal, free, floor];
    plotRef.current?.destroy();
    plotRef.current = new uPlot(opts, data, ref.current);

    const onResize = () => plotRef.current?.setSize({ width: ref.current!.clientWidth, height: 360 });
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      plotRef.current?.destroy();
      plotRef.current = null;
    };
  }, [rows, theme]);

  return <div ref={ref} style={{ width: '100%' }} />;
}

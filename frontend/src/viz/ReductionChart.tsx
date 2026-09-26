// The Benchmark's chart: for every baked case, the optimal cost against the conventional static-field cost
// on a log axis, one point per case, with the reduction factor read at the cursor. A case whose static
// field never reversed the moment has no static point, and says so in the legend rather than plotting a
// zero. Interactive (uPlot), theme-aware, and it records its axis titles for the language gate.

import { useEffect, useRef } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import type { CaseArtifact } from '../data/contract';
import { recordAxisLabels } from './axisLabels';

const _MIN_HEIGHT = 300;
const _Y_AXIS_PX = 78;

function tick(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '';
  if (value === 0) return '0';
  const magnitude = Math.abs(value);
  if (magnitude >= 0.01 && magnitude < 1000) return Number(value.toPrecision(3)).toString();
  return value.toExponential(1).replace('e+', 'e');
}

function cssVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

interface Props {
  artifacts: CaseArtifact[];
  theme: 'light' | 'dark';
  es: boolean;
}

export function ReductionChart({ artifacts, theme, es }: Props): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const plotRef = useRef<uPlot | null>(null);

  useEffect(() => {
    if (!ref.current || artifacts.length === 0) return;
    // Only cases that report a field cost belong on a field-cost axis (the observable rule).
    const rows = artifacts.filter((a) => a.observable.is_field_cost && Number.isFinite(a.static_baseline.optimal_cost));
    if (rows.length === 0) return;
    const x = rows.map((_r, i) => i + 1);
    const optimal = rows.map((r) => r.static_baseline.optimal_cost);
    const staticCost = rows.map((r) => (r.static_baseline.static_switched ? r.static_baseline.static_cost : null));
    const factor = rows.map((r) => (r.static_baseline.static_switched && r.static_baseline.reduction_factor ? r.static_baseline.reduction_factor : null));
    const codes = rows.map((r) => r.case.code);

    const stroke = cssVar('--color-fg', theme === 'dark' ? '#e8e8e8' : '#1a1a1a');
    const grid = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
    const accent = cssVar('--color-accent', '#3b82f6');
    const xLabel = es ? 'caso' : 'case';
    const yLabel = es ? 'costo de conmutación  Phi  (T^2 s)' : 'switching cost  Phi  (T^2 s)';

    const opts: uPlot.Options = {
      width: ref.current.parentElement?.clientWidth || ref.current.clientWidth || 640,
      height: Math.max(_MIN_HEIGHT, (ref.current.parentElement?.clientHeight ?? 0) - 44),
      scales: { x: { time: false, distr: 1, range: [0.5, rows.length + 0.5] }, y: { distr: 3 } },
      axes: [
        {
          label: xLabel,
          stroke,
          grid: { stroke: grid },
          ticks: { stroke: grid },
          splits: () => x,
          values: () => codes,
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
      series: [
        { label: xLabel, value: (_u, v) => (v === null || v === undefined ? '' : codes[Math.round(v) - 1] ?? '') },
        { label: es ? 'costo óptimo' : 'optimal cost', stroke: accent, width: 0, points: { show: true, size: 9, fill: accent }, value: (_u, v) => tick(v) },
        { label: es ? 'campo estático' : 'static field', stroke: '#f59e0b', width: 0, points: { show: true, size: 9, fill: '#f59e0b' }, value: (_u, v) => (v === null || v === undefined ? (es ? 'sin inversión' : 'no reversal') : tick(v)) },
        { label: es ? 'factor de reducción' : 'reduction factor', stroke: 'transparent', show: false, value: (_u, v) => (v === null || v === undefined ? '-' : `${Number(Number(v).toPrecision(3))}x`) },
      ],
      legend: { show: true },
    };

    plotRef.current?.destroy();
    plotRef.current = new uPlot(opts, [x, optimal, staticCost, factor] as uPlot.AlignedData, ref.current);
    recordAxisLabels(ref.current, xLabel, yLabel);

    const resize = () => {
      const width = ref.current?.parentElement?.clientWidth ?? ref.current?.clientWidth ?? 0;
      if (width <= 0) return;
      plotRef.current?.setSize({ width, height: Math.max(_MIN_HEIGHT, (ref.current!.parentElement?.clientHeight ?? 0) - 44) });
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
  }, [artifacts, theme, es]);

  return <div ref={ref} className="bench-chart" style={{ width: '100%' }} />;
}

// The prediction test (BL-020): the measured failure rate against the longitudinal field, one series
// per thermal stability factor, with the deterministic penalty drawn on the same axis in its own units.
//
// The penalty is what the engine offers instead of an ensemble; the points are the ensemble. If the
// claim holds, the two fall together. Interactive (uPlot): hover for values, click a legend entry to
// solo or hide a series. Sized by a ResizeObserver so a hidden tab does not fix its width.

import { useEffect, useRef } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import type { PenaltyTestArtifact } from '../data/contract';
import { recordPlotAxes } from './axisLabels';

interface Props {
  data: PenaltyTestArtifact;
  theme: 'light' | 'dark';
  es: boolean;
}

const HEIGHT = 380;
const PALETTE = ['#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6'];

function cssVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

const plain = (_u: uPlot, v: number | null) => (v == null ? '-' : String(Number(v.toPrecision(4))));

export function PenaltyChart({ data, theme, es }: Props): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const plotRef = useRef<uPlot | null>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host || !data.cells.length) return;
    const fields = data.axes.br_over_anisotropy;
    const stabilities = data.axes.stability_factor;
    const cell = (stability: number, field: number) =>
      data.cells.find((c) => c.stability_factor === stability && c.br_over_anisotropy === field);

    const stroke = cssVar('--color-fg', theme === 'dark' ? '#e8e8e8' : '#1a1a1a');
    const grid = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
    // The penalty is the same at every stability factor: it is deterministic and reads the path only.
    const penalty = fields.map((f) => cell(stabilities[0], f)?.penalty_over_floor ?? null);
    const scale = Math.max(...penalty.map((p) => p ?? 0)) || 1;

    const data2d = [
      fields,
      ...stabilities.map((s) => fields.map((f) => cell(s, f)?.failure_rate ?? null)),
      penalty.map((p) => (p == null ? null : p / scale)),
    ] as unknown as uPlot.AlignedData;

    const opts: uPlot.Options = {
      width: Math.max(host.clientWidth, 280),
      height: HEIGHT,
      scales: { x: { time: false }, y: { range: [0, 1.05] } },
      axes: [
        {
          label: es ? 'campo longitudinal  B_r / campo de anisotropía' : 'longitudinal field  B_r / anisotropy field',
          stroke,
          grid: { stroke: grid },
          ticks: { stroke: grid },
          values: (_u, splits) => splits.map((v) => String(Number(v.toPrecision(4)))),
        },
        {
          label: es ? 'fracción que no invierte' : 'fraction that fails to reverse',
          stroke,
          grid: { stroke: grid },
          ticks: { stroke: grid },
          values: (_u, splits) => splits.map((v) => String(Number(v.toPrecision(4)))),
        },
      ],
      series: [
        { label: 'B_r', value: plain },
        ...stabilities.map((s, i) => ({
          label: `K/kT = ${s}`,
          stroke: PALETTE[i % PALETTE.length],
          width: 2,
          points: { show: true, size: 6 },
          value: plain,
        })),
        {
          label: es ? 'penalización (escalada)' : 'penalty (scaled)',
          stroke,
          width: 2,
          dash: [6, 4],
          points: { show: true, size: 4 },
          value: plain,
        },
      ],
      legend: { show: true },
    };
    plotRef.current?.destroy();
    plotRef.current = new uPlot(opts, data2d, host);
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
  }, [data, theme, es]);

  return <div ref={ref} data-testid="penalty-chart" style={{ width: '100%' }} />;
}

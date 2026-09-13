// The optimal pulse waveform: field amplitude and its two transverse components over the switching
// window. Interactive uPlot with a cursor read-out. The amplitude symmetry b(0)=b(T/2)=b(T) and the
// quarter/three-quarter extrema are the analytic signatures visible here.

import { useEffect, useRef } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import type { ReferencePulse } from '../data/contract';

interface Props {
  pulse: ReferencePulse;
  theme: 'light' | 'dark';
}

function cssVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

export function PulseChart({ pulse, theme }: Props): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const plotRef = useRef<uPlot | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    // Time in picoseconds for a readable axis.
    const t = pulse.time_s.map((s) => s * 1e12);
    const amp = pulse.field_amplitude_t.map((b) => b * 1e3); // mT
    const bx = pulse.field_x_t.map((b) => b * 1e3);
    const by = pulse.field_y_t.map((b) => b * 1e3);

    const stroke = cssVar('--color-text', theme === 'dark' ? '#e8e8e8' : '#1a1a1a');
    const grid = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
    const accent = cssVar('--color-accent', '#3b82f6');

    const opts: uPlot.Options = {
      width: ref.current.clientWidth || 640,
      height: 320,
      axes: [
        { label: 'time  (ps)', stroke, grid: { stroke: grid }, ticks: { stroke: grid } },
        { label: 'field  (mT)', stroke, grid: { stroke: grid }, ticks: { stroke: grid } },
      ],
      series: [
        { label: 't (ps)' },
        { label: '|b|', stroke: accent, width: 2.5 },
        { label: 'b_x', stroke: '#f59e0b', width: 1.3 },
        { label: 'b_y', stroke: '#10b981', width: 1.3 },
      ],
      legend: { show: true },
    };
    const data: uPlot.AlignedData = [t, amp, bx, by];
    plotRef.current?.destroy();
    plotRef.current = new uPlot(opts, data, ref.current);

    const onResize = () => plotRef.current?.setSize({ width: ref.current!.clientWidth, height: 320 });
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      plotRef.current?.destroy();
      plotRef.current = null;
    };
  }, [pulse, theme]);

  return <div ref={ref} style={{ width: '100%' }} />;
}

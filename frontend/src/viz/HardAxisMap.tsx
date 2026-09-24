// Where a hard axis actually reduces the switching cost: the measured region, drawn as a heatmap of
// hard-axis ratio against switching time at one damping.
//
// Colour is the cost reduction against the control, the same numerical method solving the uniaxial
// system it already has a closed form for. Blue means the hard axis paid for itself, red means it
// charged more than it saved, and a cell the method cannot be trusted on is drawn grey with a cross
// rather than coloured: at long switching time the control drifts by up to a quarter and the solver
// stops converging, which would otherwise read as a strong result. Hover reads out the cell.

import { useEffect, useRef, useState } from 'react';
import type { HardAxisMapArtifact, HardAxisPoint } from '../data/contract';

interface Props {
  data: HardAxisMapArtifact;
  damping: number;
  theme: 'light' | 'dark';
  es: boolean;
}

const HEIGHT = 360;
const PAD = { left: 74, right: 18, top: 16, bottom: 52 };

/** Blue above one, red below, on a log scale saturating at a factor of two either way.
 *
 * Two, not four: most of the map sits between 0.5 and 2, and saturating at four washed that range out
 * to nearly white, which hid the whole region where the hard axis charges more than it saves. */
function colourFor(value: number): string {
  const t = Math.max(-1, Math.min(1, Math.log(value) / Math.log(2)));
  const magnitude = Math.round(255 - 175 * Math.abs(t));
  return t >= 0 ? `rgb(${magnitude},${magnitude},255)` : `rgb(255,${magnitude},${magnitude})`;
}

export function HardAxisMap({ data, damping, theme, es }: Props): React.JSX.Element {
  const ref = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  const [hover, setHover] = useState<HardAxisPoint | null>(null);

  const ratios = data.axes.ratio;
  const times = data.axes.switching_tau0;
  const cell = (ratio: number, time: number) =>
    data.points.find((p) => p.damping === damping && p.ratio === ratio && p.switching_tau0 === time) ?? null;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const observer = new ResizeObserver(() => setWidth(Math.max(host.clientWidth, 320)));
    observer.observe(host);
    setWidth(Math.max(host.clientWidth, 320));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = width * ratio;
    canvas.height = HEIGHT * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${HEIGHT}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const fg = theme === 'dark' ? '#e8e8e8' : '#1a1a1a';
    const muted = theme === 'dark' ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)';
    ctx.clearRect(0, 0, width, HEIGHT);

    const plotW = width - PAD.left - PAD.right;
    const plotH = HEIGHT - PAD.top - PAD.bottom;
    const cellW = plotW / ratios.length;
    const cellH = plotH / times.length;

    times.forEach((time, row) => {
      ratios.forEach((r, column) => {
        const point = cell(r, time);
        const x = PAD.left + column * cellW;
        const y = PAD.top + row * cellH;
        if (!point || !point.reliable || point.reduction_vs_control == null) {
          ctx.fillStyle = theme === 'dark' ? '#2a2a2a' : '#e6e6e6';
          ctx.fillRect(x, y, cellW, cellH);
          ctx.strokeStyle = muted;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x + 4, y + 4);
          ctx.lineTo(x + cellW - 4, y + cellH - 4);
          ctx.moveTo(x + cellW - 4, y + 4);
          ctx.lineTo(x + 4, y + cellH - 4);
          ctx.stroke();
        } else {
          ctx.fillStyle = colourFor(point.reduction_vs_control);
          ctx.fillRect(x, y, cellW, cellH);
          ctx.fillStyle = '#1a1a1a';
          ctx.font = '11px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(point.reduction_vs_control.toFixed(2), x + cellW / 2, y + cellH / 2);
        }
        ctx.strokeStyle = theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';
        ctx.strokeRect(x, y, cellW, cellH);
      });
    });

    ctx.fillStyle = fg;
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ratios.forEach((r, column) => {
      ctx.fillText(String(r), PAD.left + (column + 0.5) * cellW, PAD.top + plotH + 6);
    });
    ctx.fillText(
      es ? 'razón de eje duro  K_duro / K_fácil' : 'hard-axis ratio  K_hard / K_easy',
      PAD.left + plotW / 2,
      HEIGHT - 20,
    );
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    times.forEach((time, row) => {
      ctx.fillText(String(time), PAD.left - 8, PAD.top + (row + 0.5) * cellH);
    });
    ctx.save();
    ctx.translate(14, PAD.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText(es ? 'tiempo de conmutación (tau0)' : 'switching time (tau0)', 0, 0);
    ctx.restore();
  }, [data, damping, width, theme, es, ratios, times]);

  const onMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = ref.current;
    if (!canvas) return;
    const box = canvas.getBoundingClientRect();
    const x = event.clientX - box.left - PAD.left;
    const y = event.clientY - box.top - PAD.top;
    const plotW = width - PAD.left - PAD.right;
    const plotH = HEIGHT - PAD.top - PAD.bottom;
    if (x < 0 || y < 0 || x > plotW || y > plotH) return setHover(null);
    const column = Math.min(ratios.length - 1, Math.floor((x / plotW) * ratios.length));
    const row = Math.min(times.length - 1, Math.floor((y / plotH) * times.length));
    setHover(cell(ratios[column], times[row]));
  };

  return (
    <div ref={hostRef} style={{ width: '100%' }}>
      <canvas
        ref={ref}
        data-testid="hard-axis-map"
        data-damping={damping}
        data-cells={ratios.length * times.length}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        style={{ display: 'block' }}
      />
      <p className="muted" data-testid="hard-axis-hover">
        {hover
          ? `${es ? 'razón' : 'ratio'} ${hover.ratio}, T = ${hover.switching_tau0} tau0: ${
              hover.reliable && hover.reduction_vs_control != null
                ? `${hover.reduction_vs_control.toFixed(3)} ${es ? 'contra el control' : 'against the control'}`
                : hover.at_floor
                  ? es
                    ? 'el óptimo uniaxial ya está en su piso de tiempo infinito'
                    : 'the uniaxial optimum is already at its infinite-time floor'
                  : es
                    ? `sin evidencia aquí (control ${hover.control?.toFixed(3)}, ${hover.converged ? 'convergido' : 'sin converger'})`
                    : `no evidence here (control ${hover.control?.toFixed(3)}, ${hover.converged ? 'converged' : 'not converged'})`
            }`
          : es
            ? 'Pasa el cursor por una celda para leerla.'
            : 'Hover a cell to read it.'}
      </p>
    </div>
  );
}

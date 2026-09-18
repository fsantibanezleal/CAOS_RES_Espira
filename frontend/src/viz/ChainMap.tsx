// The reversal of every site over time for one baked case: s_z(t, site) as a heatmap, time down, site
// across. A uniform rotation is a stack of identical rows; a domain wall is a diagonal front. Diverging
// colour from +1 (up) through 0 to -1 (down). Hover reads out the site, the time fraction and s_z.

import { useEffect, useRef, useState } from 'react';
import type { LatticeOCPCase } from '../data/contract';

interface Props {
  /** Only the reversal map and the column count are read, so a patch passes its y-averaged map. */
  item: Pick<LatticeOCPCase, 'n_sites'> & { sz_map: { times_over_t: number[]; sz: number[][] } };
  theme: 'light' | 'dark';
  es: boolean;
  /** The horizontal axis label and the hover noun: a site on a chain, a column of sites on a patch. */
  axisLabel?: { en: string; es: string; noun: { en: string; es: string } };
  /** Distinct per use, so two maps in different tabs never share a test id. */
  testId?: string;
}

const HEIGHT = 340;
const PAD = { left: 46, right: 12, top: 10, bottom: 34 };

function colour(sz: number): [number, number, number] {
  // +1 blue (59,130,246), 0 neutral grey, -1 red (239,68,68).
  const t = Math.max(-1, Math.min(1, sz));
  const neutral = [210, 210, 214];
  const end = t >= 0 ? [59, 130, 246] : [239, 68, 68];
  const w = Math.abs(t);
  return [0, 1, 2].map((k) => Math.round(neutral[k] + (end[k] - neutral[k]) * w)) as [number, number, number];
}

export function ChainMap({ item, theme, es, axisLabel, testId = 'chain-map' }: Props): React.JSX.Element {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [width, setWidth] = useState(640);
  const [hover, setHover] = useState<{ site: number; time: number; sz: number } | null>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setWidth(el.clientWidth || 640));
    observer.observe(el);
    setWidth(el.clientWidth || 640);
    return () => observer.disconnect();
  }, []);

  const rows = item.sz_map.sz.length;
  const cols = item.n_sites;

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = Math.round(width * dpr);
    c.height = Math.round(HEIGHT * dpr);
    c.style.width = `${width}px`;
    c.style.height = `${HEIGHT}px`;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const text = theme === 'dark' ? '#e8e8e8' : '#1a1a1a';
    ctx.clearRect(0, 0, width, HEIGHT);
    const plotW = width - PAD.left - PAD.right;
    const plotH = HEIGHT - PAD.top - PAD.bottom;
    const cw = plotW / cols;
    const rh = plotH / rows;
    for (let r = 0; r < rows; r += 1) {
      for (let s = 0; s < cols; s += 1) {
        const [red, green, blue] = colour(item.sz_map.sz[r][s]);
        ctx.fillStyle = `rgb(${red},${green},${blue})`;
        ctx.fillRect(PAD.left + s * cw, PAD.top + r * rh, Math.ceil(cw), Math.ceil(rh));
      }
    }
    ctx.fillStyle = text;
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(axisLabel ? (es ? axisLabel.es : axisLabel.en) : es ? 'sitio' : 'site', PAD.left + plotW / 2, HEIGHT - 8);
    for (const s of [0, Math.floor((cols - 1) / 2), cols - 1]) {
      ctx.fillText(String(s), PAD.left + (s + 0.5) * cw, PAD.top + plotH + 14);
    }
    ctx.textAlign = 'right';
    for (const f of [0, 0.5, 1]) {
      ctx.fillText(f.toFixed(1), PAD.left - 6, PAD.top + f * plotH + 4);
    }
    ctx.save();
    ctx.translate(12, PAD.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('t / T', 0, 0);
    ctx.restore();
  }, [item, width, theme, es, rows, cols, axisLabel]);

  const onMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left - PAD.left;
    const y = event.clientY - rect.top - PAD.top;
    const plotW = width - PAD.left - PAD.right;
    const plotH = HEIGHT - PAD.top - PAD.bottom;
    if (x < 0 || y < 0 || x >= plotW || y >= plotH) {
      setHover(null);
      return;
    }
    const site = Math.floor((x / plotW) * cols);
    const row = Math.floor((y / plotH) * rows);
    setHover({ site, time: item.sz_map.times_over_t[row], sz: item.sz_map.sz[row][site] });
  };

  return (
    <div ref={wrap} style={{ width: '100%' }}>
      <canvas
        ref={canvas}
        data-testid={testId}
        data-sites={cols}
        data-rows={rows}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        style={{ display: 'block', cursor: 'crosshair' }}
      />
      <p className="muted" style={{ minHeight: '1.4em', margin: '4px 0 0' }}>
        {hover
          ? `${axisLabel ? axisLabel.noun[es ? 'es' : 'en'] : es ? 'sitio' : 'site'} ${hover.site}, t/T = ${hover.time.toFixed(3)}, s_z = ${hover.sz.toFixed(3)}`
          : es
            ? 'Azul: arriba (s_z = +1). Rojo: abajo (s_z = -1). Pase el cursor para leer valores.'
            : 'Blue: up (s_z = +1). Red: down (s_z = -1). Hover to read values.'}
      </p>
    </div>
  );
}

// The optimal control path drawn on the unit sphere: the moment spirals from the north pole to the
// south pole, precessing as it goes. An orthographic projection on a canvas with a draggable view
// angle and a scrubber that reports the moment direction and time at a point on the path. No autoplay
// and no compute in the browser: the path is the committed artifact, replayed.

import { useEffect, useRef, useState } from 'react';
import type { ReferencePulse } from '../data/contract';

interface Props {
  pulse: ReferencePulse;
  theme: 'light' | 'dark';
}

/** Below this the poles and their labels collide; above it the projection gains nothing. The floor
 * is deliberately small: the sphere must fit the box it was given rather than push past it, and the
 * bounded case list keeps the box comfortably above this in practice. */
const MIN_SPHERE_PX = 140;
const MAX_SPHERE_PX = 460;

function cssVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

export function SphereTrajectory({ pulse, theme }: Props): React.JSX.Element {
  const ref = useRef<HTMLCanvasElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  // The drawing box is measured, not assumed: sizing the sphere from the width alone overflows the
  // stage at a short viewport, and the overflow lands on the footer.
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [yaw, setYaw] = useState(0.6);
  const [pitch, setPitch] = useState(0.35);
  const [cursor, setCursor] = useState(Math.floor(pulse.time_s.length / 2));
  const dragging = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const element = boxRef.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setBox((previous) =>
        Math.abs(previous.width - width) < 1 && Math.abs(previous.height - height) < 1
          ? previous
          : { width, height },
      );
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // The sphere is a square inscribed in the measured box, so it never pushes the panel past the stage.
  const size = Math.max(MIN_SPHERE_PX, Math.min(box.width || MIN_SPHERE_PX, box.height || MIN_SPHERE_PX, MAX_SPHERE_PX));

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cx = size / 2;
    const cy = size / 2;
    const radius = size * 0.42;

    const text = cssVar('--color-fg', theme === 'dark' ? '#e8e8e8' : '#1a1a1a');
    const accent = cssVar('--color-accent', '#3b82f6');
    const faint = theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)';

    // Rotate a point (world z is the easy axis, pointing up) into view space.
    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);
    const cosP = Math.cos(pitch);
    const sinP = Math.sin(pitch);
    const project = (x: number, y: number, z: number): [number, number, number] => {
      // yaw about world z, then pitch about view x.
      const x1 = x * cosY - y * sinY;
      const y1 = x * sinY + y * cosY;
      const z1 = z;
      const y2 = y1 * cosP - z1 * sinP;
      const z2 = y1 * sinP + z1 * cosP;
      return [cx + x1 * radius, cy - z2 * radius, y2]; // screen x, screen y, depth
    };

    ctx.clearRect(0, 0, size, size);

    // Sphere outline.
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = faint;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Latitude/longitude wires.
    ctx.strokeStyle = faint;
    for (let lat = -60; lat <= 60; lat += 30) {
      ctx.beginPath();
      const r = Math.cos((lat * Math.PI) / 180);
      const zc = Math.sin((lat * Math.PI) / 180);
      for (let a = 0; a <= 360; a += 6) {
        const rad = (a * Math.PI) / 180;
        const [sx, sy] = project(r * Math.cos(rad), r * Math.sin(rad), zc);
        if (a === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
    }

    // The trajectory.
    ctx.beginPath();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2.5;
    for (let i = 0; i < pulse.sx.length; i++) {
      const [sx, sy] = project(pulse.sx[i], pulse.sy[i], pulse.sz[i]);
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.stroke();

    // Poles.
    const drawPole = (z: number, label: string) => {
      const [sx, sy] = project(0, 0, z);
      ctx.fillStyle = text;
      ctx.beginPath();
      ctx.arc(sx, sy, 3, 0, 2 * Math.PI);
      ctx.fill();
      ctx.font = '12px system-ui, sans-serif';
      ctx.fillText(label, sx + 6, sy);
    };
    drawPole(1, '+z (start)');
    drawPole(-1, '-z (end)');

    // The cursor marker.
    const i = Math.max(0, Math.min(cursor, pulse.sx.length - 1));
    const [mx, my] = project(pulse.sx[i], pulse.sy[i], pulse.sz[i]);
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(mx, my, 5, 0, 2 * Math.PI);
    ctx.fill();
  }, [pulse, theme, yaw, pitch, cursor, size]);

  const onDown = (e: React.PointerEvent) => {
    dragging.current = { x: e.clientX, y: e.clientY };
  };
  const onMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    setYaw((y) => y + (e.clientX - dragging.current!.x) * 0.01);
    setPitch((p) => Math.max(-1.4, Math.min(1.4, p + (e.clientY - dragging.current!.y) * 0.01)));
    dragging.current = { x: e.clientX, y: e.clientY };
  };
  const onUp = () => {
    dragging.current = null;
  };

  const i = Math.max(0, Math.min(cursor, pulse.sx.length - 1));
  const tps = (pulse.time_s[i] * 1e12).toFixed(2);

  return (
    <div className="sphere-panel">
      <div className="sphere-box" ref={boxRef}>
        <canvas
          ref={ref}
          style={{ touchAction: 'none', cursor: 'grab' }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerLeave={onUp}
        />
      </div>
      <div className="sphere-scrub">
        <label>
          t = {tps} ps, s = ({pulse.sx[i].toFixed(2)}, {pulse.sy[i].toFixed(2)},{' '}
          {pulse.sz[i].toFixed(2)})
        </label>
        <input
          type="range"
          min={0}
          max={pulse.sx.length - 1}
          value={cursor}
          onChange={(e) => setCursor(Number(e.target.value))}
          style={{ width: '100%', marginTop: 4 }}
          aria-label="scrub along the trajectory"
        />
      </div>
      <p className="sphere-note">
        Drag to rotate. The moment spirals from the north pole to the south pole, precessing as the
        internal torque assists the reversal.
      </p>
    </div>
  );
}

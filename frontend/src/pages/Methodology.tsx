// Methodology: the six method families of the ladder, transcribed from the primary sources and from the
// engine's theory pages (CAOS_SpinOCT docs/theory), with the build's exact behaviour and constants. One
// family per sub-tab (ADR-0016 section 6, ADR-0017): dense prose, captioned equations, a hand-authored
// theme-aware diagram, one honest callout and the DOIs. At most six peers in the rail (ADR-0071 section 5).

import { useShellLang, SubTabs, Equation, InlineMath, Callout, Figure, Cite, Refs } from '@fasl-work/caos-app-shell';

type Lang = 'en' | 'es';

function pick(lang: Lang, en: string, es: string): string {
  return lang === 'es' ? es : en;
}

/* ------------------------------------------------------------------------------------------------ */
/* Diagrams. Inline SVG on the shell's dg-* tokens, so they repaint with the theme; labels follow the  */
/* page language. Every coordinate is fixed, which is what makes the drawing verifiable by eye.        */
/* ------------------------------------------------------------------------------------------------ */

function ProblemDiagram({ lang }: { lang: Lang }): React.JSX.Element {
  return (
    <svg className="fig-svg wide" viewBox="0 0 760 320" role="img" aria-label={pick(lang, 'The optimal control problem on the unit sphere', 'El problema de control óptimo sobre la esfera unitaria')}>
      <circle cx="190" cy="165" r="120" className="dg-box" />
      <ellipse cx="190" cy="165" rx="120" ry="34" className="dg-curve-faint" />
      <line x1="190" y1="20" x2="190" y2="310" className="dg-axis" />
      <text x="198" y="34" className="dg-axis-label">+z</text>
      <text x="198" y="306" className="dg-axis-label">-z</text>
      <circle cx="190" cy="45" r="4.5" className="dg-node" />
      <circle cx="190" cy="285" r="4.5" className="dg-node" />
      <path d="M190 45 C 262 80, 118 150, 205 195 S 160 262, 190 285" className="dg-curve" />
      <line x1="205" y1="195" x2="262" y2="171" className="dg-marker" />
      <text x="266" y="168" className="dg-marker-label">b(t)</text>
      <line x1="205" y1="195" x2="226" y2="226" className="dg-asymptote" />
      <text x="230" y="238" className="dg-tick">s(t)</text>
      <text x="80" y="60" className="dg-note">{pick(lang, 'the moment s, a unit vector', 'el momento s, un vector unitario')}</text>
      <text x="60" y="300" className="dg-note">{pick(lang, 'reversed within the time T', 'invertido dentro del tiempo T')}</text>

      <rect x="380" y="30" width="350" height="118" rx="10" className="dg-box accent" />
      <text x="398" y="56" className="dg-box-title accent">{pick(lang, 'Minimize the source cost', 'Minimizar el costo de la fuente')}</text>
      <text x="398" y="82" className="dg-node-label">Phi = integral |b(t)|^2 dt</text>
      <text x="398" y="104" className="dg-box-sub">{pick(lang, 'units: tesla squared second, not joules', 'unidades: tesla al cuadrado por segundo, no julios')}</text>
      <text x="398" y="124" className="dg-box-sub">{pick(lang, 'subject to Landau-Lifshitz-Gilbert dynamics', 'sujeto a la dinámica de Landau-Lifshitz-Gilbert')}</text>

      <rect x="380" y="166" width="350" height="134" rx="10" className="dg-box" />
      <text x="398" y="190" className="dg-box-title">{pick(lang, 'Four things called "switching energy"', 'Cuatro cosas llamadas "energía de conmutación"')}</text>
      <text x="398" y="214" className="dg-box-sub">1 {pick(lang, 'source energy: what Phi measures', 'energía de la fuente: lo que mide Phi')}</text>
      <text x="398" y="234" className="dg-box-sub">2 {pick(lang, 'magnetic dissipation: zero at alpha = 0', 'disipación magnética: cero con alpha = 0')}</text>
      <text x="398" y="254" className="dg-box-sub">3 {pick(lang, 'Zeeman work: zero for a symmetric reversal', 'trabajo Zeeman: cero en una inversión simétrica')}</text>
      <text x="398" y="274" className="dg-box-sub">4 {pick(lang, 'cell energy: a device number, another object', 'energía de celda: un número de dispositivo, otro objeto')}</text>
      <text x="398" y="292" className="dg-note">{pick(lang, 'every figure in this product names which one it shows', 'cada figura de este producto dice cuál muestra')}</text>
    </svg>
  );
}

function ClosedFormDiagram({ lang }: { lang: Lang }): React.JSX.Element {
  // Left: the uniaxial pulse amplitude over one window, dn(u) + alpha p sn(u): equal at 0, T/2 and T,
  // maximal at T/4, minimal at 3T/4. Right: the minimum cost against the switching time on log axes,
  // between the free-macrospin asymptote (1/T) and the universal floor.
  const x0 = 50;
  const w = 280;
  const pulse = Array.from({ length: 57 }, (_, i) => {
    const u = i / 56;
    const y = 150 - 70 * (0.62 + 0.28 * Math.sin(2 * Math.PI * u) - 0.08 * Math.cos(4 * Math.PI * u));
    return `${i === 0 ? 'M' : 'L'}${(x0 + w * u).toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
  const cost = Array.from({ length: 41 }, (_, i) => {
    const s = i / 40;
    const y = 60 + 150 * (1 - Math.exp(-3.2 * s)) - 12 * s;
    return `${i === 0 ? 'M' : 'L'}${(430 + 280 * s).toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
  return (
    <svg className="fig-svg wide" viewBox="0 0 760 320" role="img" aria-label={pick(lang, 'The closed-form pulse and the cost against switching time', 'El pulso de forma cerrada y el costo frente al tiempo de conmutación')}>
      <line x1={x0} y1="230" x2={x0 + w} y2="230" className="dg-axis" />
      <line x1={x0} y1="230" x2={x0} y2="60" className="dg-axis" />
      <text x={x0 + w - 6} y="248" className="dg-axis-label" textAnchor="end">t</text>
      <text x={x0 + 6} y="72" className="dg-axis-label">b(t)</text>
      <path d={pulse} className="dg-curve" />
      <line x1={x0 + w / 4} y1="230" x2={x0 + w / 4} y2="70" className="dg-marker" />
      <text x={x0 + w / 4 + 4} y="84" className="dg-marker-label">T/4 max</text>
      <line x1={x0 + (3 * w) / 4} y1="230" x2={x0 + (3 * w) / 4} y2="70" className="dg-marker" />
      <text x={x0 + (3 * w) / 4 + 4} y="222" className="dg-marker-label">3T/4 min</text>
      <text x={x0} y="248" className="dg-tick">0</text>
      <text x={x0 + w / 2 - 8} y="248" className="dg-tick">T/2</text>
      <text x={x0 + w - 4} y="264" className="dg-tick" textAnchor="end">T</text>
      <text x={x0} y="290" className="dg-note">{pick(lang, 'b(0) = b(T/2) = b(T); spread 2 alpha K / (mu sqrt(1 + alpha^2))', 'b(0) = b(T/2) = b(T); amplitud 2 alpha K / (mu sqrt(1 + alpha^2))')}</text>
      <text x={x0} y="306" className="dg-note">{pick(lang, 'mean amplitude pi sqrt(1 + alpha^2) / (gamma T), potential-independent', 'amplitud media pi sqrt(1 + alpha^2) / (gamma T), independiente del potencial')}</text>

      <line x1="430" y1="230" x2="710" y2="230" className="dg-axis" />
      <line x1="430" y1="230" x2="430" y2="50" className="dg-axis" />
      <text x="704" y="248" className="dg-axis-label" textAnchor="end">log T</text>
      <text x="436" y="62" className="dg-axis-label">log Phi</text>
      <path d="M430 60 L710 198" className="dg-curve-faint" />
      <text x="560" y="112" className="dg-tick">Phi_f = pi^2 (1 + alpha^2) / (gamma^2 T)</text>
      <line x1="430" y1="210" x2="710" y2="210" className="dg-asymptote" />
      <text x="436" y="226" className="dg-marker-label">Phi_inf = 4 alpha K / (gamma mu)</text>
      <path d={cost} className="dg-curve" />
      <line x1="640" y1="230" x2="640" y2="170" className="dg-marker" />
      <text x="646" y="180" className="dg-marker-label">T_eps</text>
      <text x="430" y="290" className="dg-note">{pick(lang, 'Phi_m(T) between the free-macrospin cost and the floor', 'Phi_m(T) entre el costo de macrospin libre y el piso')}</text>
      <text x="430" y="306" className="dg-note">{pick(lang, 'T_eps = 2 ln(4 / eps) (alpha + 1 / alpha) tau0 reaches 1 + eps of the floor', 'T_eps = 2 ln(4 / eps) (alpha + 1 / alpha) tau0 llega a 1 + eps del piso')}</text>
    </svg>
  );
}

function NumericalDiagram({ lang }: { lang: Lang }): React.JSX.Element {
  // Left: the polygeodesic of images with the midpoint fields. Right: the biaxial energy surface seen
  // from +z, saddles on the hard axis, and an optimal path that crosses the equator away from them.
  const images = Array.from({ length: 8 }, (_, i) => {
    const a = (Math.PI * i) / 7;
    return { x: 190 - 120 * Math.sin(a) * Math.cos(a * 0.9 - 0.3), y: 45 + 120 * (1 - Math.cos(a)) };
  });
  return (
    <svg className="fig-svg wide" viewBox="0 0 760 320" role="img" aria-label={pick(lang, 'The image chain of the numerical optimal control path and the biaxial energy surface', 'La cadena de imágenes de la trayectoria numérica y la superficie de energía biaxial')}>
      <circle cx="190" cy="165" r="120" className="dg-box" />
      {images.slice(0, -1).map((p, i) => {
        const q = images[i + 1];
        return <line key={`e${i}`} x1={p.x} y1={p.y} x2={q.x} y2={q.y} className="dg-curve" />;
      })}
      {images.map((p, i) => (
        <circle key={`n${i}`} cx={p.x} cy={p.y} r={i === 0 || i === images.length - 1 ? 5 : 3.5} className="dg-node" />
      ))}
      {images.slice(0, -1).map((p, i) => {
        const q = images[i + 1];
        const mx = (p.x + q.x) / 2;
        const my = (p.y + q.y) / 2;
        const dx = q.y - p.y;
        const dy = -(q.x - p.x);
        const n = Math.hypot(dx, dy) || 1;
        return <line key={`b${i}`} x1={mx} y1={my} x2={mx + (16 * dx) / n} y2={my + (16 * dy) / n} className="dg-marker" />;
      })}
      <text x="60" y="40" className="dg-note">{pick(lang, 'Q interior images move; the endpoints are clamped', 'Q imágenes interiores se mueven; los extremos quedan fijos')}</text>
      <text x="60" y="300" className="dg-note">{pick(lang, 'the field at each midpoint comes from inverting the dynamics', 'el campo en cada punto medio sale de invertir la dinámica')}</text>
      <text x="238" y="120" className="dg-marker-label">B_{'{p+1/2}'}</text>

      <ellipse cx="560" cy="165" rx="150" ry="150" className="dg-box" />
      <ellipse cx="560" cy="165" rx="150" ry="40" className="dg-curve-faint" />
      <line x1="410" y1="165" x2="710" y2="165" className="dg-axis" />
      <text x="700" y="158" className="dg-axis-label" textAnchor="end">x ({pick(lang, 'hard', 'duro')})</text>
      <text x="566" y="30" className="dg-axis-label">z ({pick(lang, 'easy', 'fácil')})</text>
      <circle cx="410" cy="165" r="6" className="dg-fill-warn" />
      <circle cx="710" cy="165" r="6" className="dg-fill-warn" />
      <text x="418" y="150" className="dg-marker-label">{pick(lang, 'saddle', 'silla')}</text>
      <text x="664" y="150" className="dg-marker-label">{pick(lang, 'saddle', 'silla')}</text>
      <path d="M560 15 C 640 60, 470 130, 600 175 S 520 270, 560 315" className="dg-curve" />
      <circle cx="600" cy="175" r="4" className="dg-node" />
      <text x="608" y="196" className="dg-tick">phi_m {pick(lang, 'in', 'en')} (pi/4, pi/2)</text>
      <text x="420" y="300" className="dg-note">{pick(lang, 'the optimal path never passes through the saddle', 'la trayectoria óptima nunca pasa por la silla')}</text>
    </svg>
  );
}

function RealizabilityDiagram({ lang }: { lang: Lang }): React.JSX.Element {
  // Measured on the reference macrospin (3 Bohr magnetons, 0.15 meV, alpha 0.1, T = 10 tau0), spinoct
  // theory page 13, 2026-09-17: CRAB cost over the analytic optimum per harmonic count, and the GRAPE
  // amplitude-cap points. These are the engine's numbers, not a sketch.
  const crab: [number, number][] = [
    [1, 2.15],
    [2, 1.39],
    [3, 1.21],
    [4, 1.16],
    [6, 1.13],
    [8, 1.14],
  ];
  const x = (h: number) => 70 + ((h - 1) / 7) * 260;
  const y = (r: number) => 230 - ((r - 1.0) / 1.3) * 170;
  return (
    <svg className="fig-svg wide" viewBox="0 0 760 320" role="img" aria-label={pick(lang, 'The price of realizability: cost over the optimum against bandwidth and against an amplitude cap', 'El precio de la realizabilidad: costo sobre el óptimo frente al ancho de banda y frente a un tope de amplitud')}>
      <line x1="70" y1="230" x2="340" y2="230" className="dg-axis" />
      <line x1="70" y1="230" x2="70" y2="50" className="dg-axis" />
      <text x="336" y="250" className="dg-axis-label" textAnchor="end">{pick(lang, 'harmonics (CRAB)', 'armónicos (CRAB)')}</text>
      <text x="76" y="60" className="dg-axis-label">{pick(lang, 'cost / optimum', 'costo / óptimo')}</text>
      <line x1="70" y1={y(1)} x2="340" y2={y(1)} className="dg-asymptote" />
      <text x="76" y={y(1) - 6} className="dg-marker-label">1.00 {pick(lang, 'unconstrained', 'sin restricción')}</text>
      <line x1="70" y1={y(1.13)} x2="340" y2={y(1.13)} className="dg-marker" />
      <text x="240" y={y(1.13) - 6} className="dg-marker-label">1.13 {pick(lang, 'floor', 'piso')}</text>
      <path d={crab.map(([h, r], i) => `${i === 0 ? 'M' : 'L'}${x(h).toFixed(1)} ${y(r).toFixed(1)}`).join(' ')} className="dg-curve" />
      {crab.map(([h, r]) => (
        <g key={h}>
          <circle cx={x(h)} cy={y(r)} r="4" className="dg-node" />
          <text x={x(h) + 6} y={y(r) - 8} className="dg-tick">{r.toFixed(2)}</text>
          <text x={x(h) - 3} y="246" className="dg-tick">{h}</text>
        </g>
      ))}
      <text x="70" y="290" className="dg-note">{pick(lang, 'monotone down to a floor about 13 per cent above the optimum', 'monótono hasta un piso cerca de 13 por ciento sobre el óptimo')}</text>
      <text x="70" y="306" className="dg-note">{pick(lang, 'a band-limited pulse must vanish at both ends of the window', 'un pulso de banda limitada debe anularse en ambos extremos de la ventana')}</text>

      <line x1="430" y1="230" x2="710" y2="230" className="dg-axis" />
      <line x1="430" y1="230" x2="430" y2="50" className="dg-axis" />
      <text x="706" y="250" className="dg-axis-label" textAnchor="end">{pick(lang, 'amplitude cap (anisotropy fields)', 'tope de amplitud (campos de anisotropía)')}</text>
      <text x="436" y="60" className="dg-axis-label">{pick(lang, 'cost / optimum (GRAPE)', 'costo / óptimo (GRAPE)')}</text>
      <rect x="430" y="50" width="70" height="180" className="dg-fill-warn" />
      <text x="436" y="120" className="dg-marker-label">{pick(lang, 'no', 'sin')}</text>
      <text x="436" y="136" className="dg-marker-label">{pick(lang, 'reversal', 'inversión')}</text>
      <text x="436" y="152" className="dg-tick">&lt; 0.45</text>
      <line x1="500" y1="230" x2="500" y2="50" className="dg-marker" />
      <path d="M520 118 C 560 160, 600 196, 700 199" className="dg-curve" />
      <circle cx="530" cy="130" r="4" className="dg-node" />
      <text x="536" y="122" className="dg-tick">1.08 {pick(lang, 'at', 'en')} 0.63</text>
      <circle cx="700" cy="199" r="4" className="dg-node" />
      <text x="632" y="190" className="dg-tick">1.003 {pick(lang, 'at', 'en')} 20</text>
      <line x1="430" y1="200" x2="710" y2="200" className="dg-asymptote" />
      <text x="430" y="290" className="dg-note">{pick(lang, 'a capped run that does not reverse reports no cost and the reason', 'una corrida con tope que no invierte reporta sin costo y la razón')}</text>
      <text x="430" y="306" className="dg-note">{pick(lang, 'engine numbers, spinoct theory page 13, measured 2026-09-17', 'números del motor, página de teoría 13 de spinoct, medidos el 2026-09-17')}</text>
    </svg>
  );
}

function ReliabilityDiagram({ lang }: { lang: Lang }): React.JSX.Element {
  // Left: the polar angle from 0 to pi with the hyperbolic stretch of the bare path, pi/4 to 3pi/4, and
  // its disappearance once B_r reaches one anisotropy field. Right: the measured front at a stability
  // factor of one (docs/results/01): success 0.735 to 0.985, added cost 2.5x, 10.1x, 15.8x.
  return (
    <svg className="fig-svg wide" viewBox="0 0 760 320" role="img" aria-label={pick(lang, 'The hyperbolic stretch of the bare path and the measured cost of reliability', 'El tramo hiperbólico de la trayectoria desnuda y el costo medido de la fiabilidad')}>
      <line x1="60" y1="120" x2="340" y2="120" className="dg-axis" />
      <text x="60" y="140" className="dg-tick">0</text>
      <text x="126" y="140" className="dg-tick">pi/4</text>
      <text x="192" y="140" className="dg-tick">pi/2</text>
      <text x="256" y="140" className="dg-tick">3pi/4</text>
      <text x="330" y="140" className="dg-tick">pi</text>
      <text x="60" y="60" className="dg-axis-label">theta {pick(lang, 'along the reversal', 'a lo largo de la inversión')}, B_r = 0</text>
      <rect x="130" y="94" width="140" height="26" className="dg-fill-warn" />
      <text x="136" y="88" className="dg-marker-label">{pick(lang, 'hyperbolic: w1 w2 <= 0', 'hiperbólico: w1 w2 <= 0')}</text>
      <line x1="60" y1="220" x2="340" y2="220" className="dg-axis" />
      <text x="60" y="176" className="dg-axis-label">B_r = K / mu</text>
      <rect x="60" y="194" width="280" height="26" className="dg-fill-accent" />
      <text x="66" y="188" className="dg-marker-label">{pick(lang, 'bounded everywhere: w1 w2 > 0', 'acotado en todas partes: w1 w2 > 0')}</text>
      <text x="60" y="270" className="dg-note">w1 = B_r + (K / mu) cos 2 theta</text>
      <text x="60" y="288" className="dg-note">w2 = B_r + (K / mu) cos^2 theta</text>
      <text x="60" y="306" className="dg-note">{pick(lang, 'the hyperbolic fraction: 0.50, 0.42, 0.33, 0.23, 0.00 as B_r rises', 'la fracción hiperbólica: 0,50, 0,42, 0,33, 0,23, 0,00 al subir B_r')}</text>

      <line x1="430" y1="230" x2="710" y2="230" className="dg-axis" />
      <line x1="430" y1="230" x2="430" y2="50" className="dg-axis" />
      <text x="706" y="250" className="dg-axis-label" textAnchor="end">B_r / (K / mu)</text>
      <text x="436" y="60" className="dg-axis-label">{pick(lang, 'success rate, stability factor 1', 'tasa de éxito, factor de estabilidad 1')}</text>
      <path d="M440 176 C 500 120, 560 96, 640 92 L 700 90" className="dg-curve" />
      <circle cx="440" cy="176" r="4" className="dg-node" />
      <text x="446" y="192" className="dg-tick">0.735</text>
      <circle cx="640" cy="92" r="4" className="dg-node" />
      <text x="612" y="82" className="dg-tick">0.985</text>
      <text x="434" y="246" className="dg-tick">0</text>
      <text x="632" y="246" className="dg-tick">1</text>
      <text x="700" y="246" className="dg-tick">2.5</text>
      <text x="430" y="272" className="dg-marker-label">{pick(lang, 'price, over the bare optimal cost:', 'precio, sobre el costo óptimo desnudo:')}</text>
      <text x="430" y="290" className="dg-note">{pick(lang, '1 anisotropy field 2.5x · 2 fields 10.1x · 2.5 fields 15.8x', '1 campo de anisotropía 2,5x · 2 campos 10,1x · 2,5 campos 15,8x')}</text>
      <text x="430" y="306" className="dg-note">{pick(lang, 'at stability factor 20 the bare pulse already reverses every copy', 'con factor de estabilidad 20 el pulso desnudo ya invierte todas las copias')}</text>
    </svg>
  );
}

function LatticeDiagram({ lang }: { lang: Lang }): React.JSX.Element {
  // Top: a chain reversing uniformly (every site at the same angle) against a chain reversing through
  // a domain wall. Bottom: the measured crossover cells at J/K = 10, alpha = 0.1 (spinoct theory page
  // 12): ratio to the uniform bound, with the two sub-uniform cells and the barrier floor row.
  const sites = 12;
  const arrow = (cx: number, cy: number, angle: number, key: string) => {
    const L = 14;
    const dx = L * Math.sin(angle);
    const dy = -L * Math.cos(angle);
    return <line key={key} x1={cx - dx / 2} y1={cy - dy / 2} x2={cx + dx / 2} y2={cy + dy / 2} className="dg-curve" markerEnd="url(#md-arrow)" />;
  };
  const cols = ['N = 4', 'N = 8', 'N = 12', 'N = 16', 'N = 24', 'N = 32'];
  const rows: { label: string; values: string[]; hot?: number[] }[] = [
    { label: 'T = 20 tau0', values: ['1.000', '1.000', '1.000', '1.000', '1.000', '1.000'] },
    { label: 'T = 60 tau0', values: ['1.000', '1.000', '1.000', '1.000', '1.000', '1.000'] },
    { label: 'T = 150 tau0', values: ['1.000', '1.000', '0.864', '0.899', pick(lang, 'not found', 'no hallado'), pick(lang, 'not found', 'no hallado')], hot: [2, 3] },
    { label: pick(lang, 'floor', 'piso'), values: ['1.000', '0.968', '0.725', '0.552', '0.369', '0.277'] },
  ];
  return (
    <svg className="fig-svg wide" viewBox="0 0 760 330" role="img" aria-label={pick(lang, 'Uniform rotation against a domain wall, and the measured crossover of the free chain', 'Rotación uniforme frente a una pared de dominio, y el cruce medido de la cadena libre')}>
      <defs>
        <marker id="md-arrow" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
          <path d="M0 0 L5 3 L0 6 z" className="dg-fill-accent" />
        </marker>
      </defs>
      <text x="40" y="28" className="dg-box-title">{pick(lang, 'uniform rotation: every site at the same angle, exchange never paid', 'rotación uniforme: cada sitio en el mismo ángulo, sin pagar intercambio')}</text>
      {Array.from({ length: sites }, (_, i) => arrow(60 + i * 30, 52, 0.9, `u${i}`))}
      <text x="40" y="96" className="dg-box-title">{pick(lang, 'domain wall: a reversed end sweeps through, a few sites move at once', 'pared de dominio: un extremo invertido avanza, pocos sitios se mueven a la vez')}</text>
      {Array.from({ length: sites }, (_, i) => arrow(60 + i * 30, 120, Math.PI / (1 + Math.exp((i - 5.5) * 1.4)), `w${i}`))}
      <text x="420" y="52" className="dg-note">{pick(lang, 'cost <= N x single-site cost, exactly', 'costo <= N x costo de un sitio, exacto')}</text>
      <text x="420" y="120" className="dg-note">{pick(lang, 'floor: Phi >= 4 alpha dE_MEP / (gamma mu)', 'piso: Phi >= 4 alpha dE_MEP / (gamma mu)')}</text>

      <text x="40" y="164" className="dg-box-title">{pick(lang, 'cost over the uniform bound, J/K = 10, alpha = 0.1', 'costo sobre la cota uniforme, J/K = 10, alpha = 0,1')}</text>
      {cols.map((c, j) => (
        <text key={c} x={190 + j * 92} y="186" className="dg-tick">{c}</text>
      ))}
      {rows.map((r, i) => (
        <g key={r.label}>
          <text x="40" y={210 + i * 30} className="dg-tick">{r.label}</text>
          {r.values.map((v, j) => (
            <g key={`${i}-${j}`}>
              <rect x={182 + j * 92} y={194 + i * 30} width="86" height="24" className={r.hot?.includes(j) ? 'dg-fill-accent' : i === rows.length - 1 ? 'dg-fill-warn' : 'dg-box'} />
              <text x={190 + j * 92} y={210 + i * 30} className="dg-tick">{v}</text>
            </g>
          ))}
        </g>
      ))}
      <text x="40" y="326" className="dg-note">{pick(lang, 'each ratio is a feasible trajectory (an upper bound); the floor row is rigorous; the optimum is bracketed, not located', 'cada razón es una trayectoria factible (cota superior); la fila del piso es rigurosa; el óptimo queda acotado, no ubicado')}</text>
    </svg>
  );
}

/* ------------------------------------------------------------------------------------------------ */
/* The six families.                                                                                  */
/* ------------------------------------------------------------------------------------------------ */

function Problem({ lang }: { lang: Lang }): React.JSX.Element {
  const es = lang === 'es';
  return (
    <div className="prose method-tab">
      <p>
        {es
          ? 'Un bit magnético se modela como un momento unitario s, el macrospin. Invertirlo es llevarlo de +z a -z dentro de un tiempo de conmutación T, y la dinámica que obedece en el camino es la ecuación de Landau-Lifshitz-Gilbert con el campo aplicado b sumado al campo interno, donde alfa es el amortiguamiento de Gilbert, gamma la razón giromagnética y el campo interno deriva de la energía sin el término Zeeman. El reloj del problema es el tiempo de Larmor de la anisotropía, tau0 = mu / (2 gamma K): en la base de materiales de este producto va desde 0,062 ps en FePS3 hasta 13,5 ps en Cr2Ge2Te6, con CrSBr en 3,29 ps, y cada tiempo de conmutación de cada caso se declara en múltiplos de él.'
          : 'A magnetic bit is modelled as a unit moment s, the macrospin. Reversing it means taking it from +z to -z within a switching time T, and the dynamics it obeys on the way is the Landau-Lifshitz-Gilbert equation with the applied field b added to the internal field, where alpha is the Gilbert damping, gamma the gyromagnetic ratio and the internal field derives from the energy without its Zeeman term. The clock of the problem is the Larmor time of the anisotropy, tau0 = mu / (2 gamma K): across this product’s material database it runs from 0.062 ps in FePS3 to 13.5 ps in Cr2Ge2Te6, with CrSBr at 3.29 ps, and every switching time of every case is declared in multiples of it.'}
      </p>
      <Equation
        tex={String.raw`(1+\alpha^2)\,\dot{\vec s} = -\gamma\,\vec s \times (\vec b_i + \vec b) - \alpha\gamma\,\vec s \times [\vec s \times (\vec b_i + \vec b)],\qquad \vec b_i = -\frac{1}{\mu}\frac{\partial E}{\partial \vec s}`}
        caption={es ? 'La ecuación de movimiento: precesión y amortiguamiento alrededor del campo total; el campo interno excluye el término Zeeman.' : 'The equation of motion: precession and damping about the total field; the internal field excludes the Zeeman term.'}
      />
      <p>
        {es
          ? 'El costo que se minimiza es el calentamiento Joule del circuito que genera el campo: la corriente es lineal en el campo generado y el calor va como la corriente al cuadrado integrada en el pulso, de modo que Phi es la integral del módulo cuadrado del campo. Sus unidades son tesla al cuadrado por segundo, no julios, y es la energía que gasta la fuente externa, no la que disipa el imán: con alfa = 0 el imán no consume nada y Phi sigue siendo positivo. La literatura llama "energía de conmutación" al menos a cuatro objetos distintos, la energía de la fuente, la disipación magnética proporcional a alfa por la integral de la velocidad al cuadrado, el trabajo Zeeman, que integra a cero en una inversión simétrica, y la energía de celda de un dispositivo, dominada por el transistor de acceso. Este producto nombra cuál muestra en cada figura, y su motor se niega a convertir Phi a julios sin una constante de circuito explícita en julios por tesla cuadrado segundo.'
          : 'The cost being minimized is the Joule heating of the circuit that generates the field: the current is linear in the generated field and the heat goes as current squared integrated over the pulse, so Phi is the integral of the squared field magnitude. Its units are tesla squared second, not joules, and it is the energy the external source spends, not the energy the magnet dissipates: at alpha = 0 the magnet consumes nothing and Phi is still positive. The literature calls at least four distinct objects "the switching energy": the source energy, the magnetic dissipation proportional to alpha times the integral of the squared velocity, the Zeeman work, which integrates to zero for a symmetric reversal, and the cell energy of a device, dominated by its access transistor. This product names which one every figure shows, and its engine refuses to convert Phi to joules without an explicit circuit constant in joules per tesla squared second.'}{' '}
        <Cite id="barros2011" /> <Cite id="kwiatkowski2021" />
      </p>
      <Equation
        tex={String.raw`\Phi[\vec b] = \int_0^T \bigl|\vec b(t)\bigr|^2\, dt`}
        caption={es ? 'El costo de la fuente, en T^2 s. Se convierte en julios solo a través de una constante de circuito declarada.' : 'The source cost, in T^2 s. It becomes joules only through a declared circuit constant.'}
      />
      <p>
        {es
          ? 'La maniobra que hace resoluble el problema es invertir la ecuación de movimiento: despejar el campo como función de la trayectoria y su velocidad, de modo que la optimización con restricción sobre el par (campo, trayectoria) se vuelve una optimización sin restricción sobre la trayectoria sola. Solo entra la parte transversal del campo interno, porque la parte longitudinal no afecta la dinámica de un vector unitario. Al sustituir, Phi queda como la integral de un lagrangiano A que depende de s y de su derivada, y su minimizador es la trayectoria de control óptimo; el pulso se recupera sustituyendo esa trayectoria de vuelta en la relación inversa. La trayectoria óptima es un objeto dinámico, fijado por T y alfa, distinto del camino de mínima energía, que es una propiedad de la superficie de energía: no pasa por el punto de silla.'
          : 'The move that makes the problem solvable is to invert the equation of motion: solve it for the field as a function of the trajectory and its velocity, so that the constrained optimization over the pair (field, trajectory) becomes an unconstrained one over the trajectory alone. Only the transverse part of the internal field enters, because the longitudinal part does not affect the dynamics of a unit vector. Substituting, Phi becomes the integral of a Lagrangian A of s and its derivative, and its minimizer is the optimal control path; the pulse is recovered by substituting that path back into the inverse relation. The optimal path is a dynamical object, set by T and alpha, distinct from the minimum energy path, which is a property of the energy surface alone: it does not pass through the saddle point.'}{' '}
        <Cite id="kwiatkowski2021" />
      </p>
      <Equation
        tex={String.raw`\vec b(\vec s,\dot{\vec s}) = \frac{\alpha}{\gamma}\,\dot{\vec s} + \frac{1}{\gamma}\,\vec s\times\dot{\vec s} - \vec b_i^{\perp},\qquad \Phi[\vec s] = \int_0^T A(\vec s,\dot{\vec s})\,dt`}
        caption={es ? 'La relación inversa y el funcional de la trayectoria sola, con A = ((1 + alfa^2) / gamma^2) |ds/dt|^2 - (2 alfa / gamma) ds/dt . b_perp - (2 / gamma) (s x ds/dt) . b_perp + |b_perp|^2.' : 'The inverse relation and the functional of the trajectory alone, with A = ((1 + alpha^2) / gamma^2) |ds/dt|^2 - (2 alpha / gamma) ds/dt . b_perp - (2 / gamma) (s x ds/dt) . b_perp + |b_perp|^2.'}
      />
      <p>
        {es
          ? 'El contrato de unidades de este producto fija la forma canónica: la anisotropía K en meV por ion magnético sobre vectores unitarios, E = -K s_z^2; el momento mu en magnetones de Bohr; gamma en radianes por segundo por tesla; el campo en tesla. El Contrato 1 convierte cada valor publicado a esa forma, una anisotropía sobre operadores de espín se multiplica por S al cuadrado, una anisotropía por volumen pasa por la celda unitaria o por la magnetización de saturación, y rechaza una fila sin DOI o fuera de su rango físico. El piso universal, Phi_inf = 4 alfa K / (gamma mu), es lineal en el amortiguamiento, que es el parámetro peor medido de toda la familia bidimensional y se asume para la mayoría de los materiales de la base: por eso cada costo se reporta como banda sobre el intervalo de amortiguamiento y el panel de parámetros marca cada valor asumido.'
          : 'This product’s units contract fixes the canonical form: the anisotropy K in meV per magnetic ion on unit vectors, E = -K s_z^2; the moment mu in Bohr magnetons; gamma in radians per second per tesla; the field in tesla. Contract 1 converts every published value to that form, an anisotropy on spin operators is multiplied by S squared, a volume anisotropy goes through the unit cell or the saturation magnetization, and it rejects a row without a DOI or outside its physical range. The universal floor, Phi_inf = 4 alpha K / (gamma mu), is linear in the damping, which is the worst-measured parameter of the whole two-dimensional family and is assumed for most materials in the database: that is why every cost is reported as a band over the damping interval and the parameter panel badges every assumed value.'}
      </p>
      <Figure caption={es ? 'El problema: una trayectoria de +z a -z sobre la esfera, el pulso siempre transversal, el costo de la fuente y las cuatro cosas que la literatura llama energía de conmutación.' : 'The problem: a path from +z to -z on the sphere, the pulse always transverse, the source cost, and the four things the literature calls a switching energy.'}>
        <ProblemDiagram lang={lang} />
      </Figure>
      <Callout variant="honest" title={es ? 'Lo que este número es y lo que no' : 'What this number is and is not'}>
        <p>
          {es
            ? 'La cantidad primaria que reporta Espira es Phi en T^2 s, porque no depende de ningún modelo. Las cifras en nanojulios del artículo de referencia fijan el prefactor de circuito c en uno tras declararlo proporcional al volumen de la celda unitaria, de modo que la constante que convierte sus T^2 s en julios no puede reconstruirse a partir del texto. Espira replica sus campos pico (caso C10), no sus energías, y muestra la energía de un dispositivo comercial solo como contexto de otra clase, nunca como un factor de reducción.'
            : 'The primary quantity Espira reports is Phi in T^2 s, because it depends on no model. The nanojoule figures of the kickoff paper set the circuit prefactor c to one after declaring it proportional to the unit-cell volume, so the constant that turns their T^2 s into joules cannot be reconstructed from the text. Espira replicates their peak fields (case C10), not their energies, and shows a commercial device’s energy only as context of another kind, never as a reduction factor.'}
        </p>
      </Callout>
      <Refs ids={['kwiatkowski2021', 'barros2011', 'badarneh2026']} label="Refs" />
    </div>
  );
}

function ClosedForms({ lang }: { lang: Lang }): React.JSX.Element {
  const es = lang === 'es';
  return (
    <div className="prose method-tab">
      <p>
        {es
          ? 'Para un imán puramente uniaxial, E = -K s_z^2, las ecuaciones de Euler-Lagrange del funcional se separan en coordenadas esféricas: el ángulo polar obedece tau0^2 theta_pp = alfa^2 sen(4 theta) / (4 (1 + alfa^2)^2), que es la ecuación de sine-Gordon, y el azimut avanza con tau0 phi_p = cos(theta) / (1 + alfa^2). La solución es una amplitud de Jacobi con parámetro elíptico -alfa^2 p^2, donde el parámetro de forma p queda fijado implícitamente por el tiempo de conmutación a través de la integral elíptica completa de primera especie, T = 4 tau0 (1 + alfa^2) p K(-alfa^2 p^2). El rung R05 del motor evalúa exactamente esto, y es la referencia contra la que se acepta todo solucionador numérico antes de usarlo donde no hay forma cerrada.'
          : 'For a purely uniaxial magnet, E = -K s_z^2, the Euler-Lagrange equations of the functional separate in spherical coordinates: the polar angle obeys tau0^2 theta_pp = alpha^2 sin(4 theta) / (4 (1 + alpha^2)^2), which is the sine-Gordon equation, and the azimuth advances with tau0 phi_p = cos(theta) / (1 + alpha^2). The solution is a Jacobi amplitude with elliptic parameter -alpha^2 p^2, where the shape parameter p is fixed implicitly by the switching time through the complete elliptic integral of the first kind, T = 4 tau0 (1 + alpha^2) p K(-alpha^2 p^2). Rung R05 of the engine evaluates exactly this, and it is the reference every numerical solver is accepted against before it is used where no closed form exists.'}{' '}
        <Cite id="kwiatkowski2021" />
      </p>
      <Equation
        tex={String.raw`\theta(t) = \tfrac12\,\mathrm{am}\!\left(\frac{t}{p\,\tau_0(1+\alpha^2)}\,\middle|\,-\alpha^2 p^2\right),\qquad T = 4\tau_0(1+\alpha^2)\,p\,\mathcal K(-\alpha^2p^2)`}
        caption={es ? 'La trayectoria óptima uniaxial: una amplitud de Jacobi; el parámetro de forma p se resuelve a partir de T.' : 'The uniaxial optimal path: a Jacobi amplitude; the shape parameter p is solved from T.'}
      />
      <p>
        {es
          ? 'El pulso óptimo es siempre perpendicular al momento, con componentes alfa e_theta + e_phi sobre la raíz de 1 + alfa^2, y su amplitud es una combinación de dos funciones elípticas de Jacobi con el mismo argumento u = t / (p tau0 (1 + alfa^2)). De esa forma cerrada salen las identidades que el motor usa como oráculos en sus pruebas unitarias: el pulso vale lo mismo en 0, T/2 y T; su máximo cae en T/4 y su mínimo en 3T/4, separados por 2 alfa K / (mu raíz(1 + alfa^2)); su amplitud media es pi raíz(1 + alfa^2) / (gamma T), independiente del potencial magnético; y el costo mínimo es Phi_m = 2 K [2 E(m) - K(m)] / (gamma mu p). Una primera transcripción leyó el parámetro elíptico como un sumando dentro del corchete, porque el PDF corta la línea entre las dos funciones; la forma correcta se confirmó contra cuatro de esas identidades antes de escribir código, y el término espurio rompe tres.'
          : 'The optimal pulse is always perpendicular to the moment, with components alpha e_theta + e_phi over the square root of 1 + alpha^2, and its amplitude is a combination of two Jacobi elliptic functions of the same argument u = t / (p tau0 (1 + alpha^2)). From that closed form come the identities the engine uses as oracles in its unit tests: the pulse takes the same value at 0, T/2 and T; its maximum falls at T/4 and its minimum at 3T/4, separated by 2 alpha K / (mu sqrt(1 + alpha^2)); its mean amplitude is pi sqrt(1 + alpha^2) / (gamma T), independent of the magnetic potential; and the minimum cost is Phi_m = 2 K [2 E(m) - K(m)] / (gamma mu p). A first transcription read the elliptic parameter as a summand inside the bracket, because the PDF wraps the line between the two functions; the correct form was confirmed against four of those identities before any code was written, and the spurious term breaks three of them.'}
      </p>
      <Equation
        tex={String.raw`b(t) = \frac{K}{\mu\,p\sqrt{1+\alpha^2}}\Bigl[\mathrm{dn}(u\,|\,-\alpha^2p^2) + \alpha p\,\mathrm{sn}(u\,|\,-\alpha^2p^2)\Bigr],\qquad u = \frac{t}{p\,\tau_0(1+\alpha^2)}`}
        caption={es ? 'La amplitud del pulso óptimo uniaxial. El parámetro elíptico pertenece a ambas funciones; no es un sumando.' : 'The amplitude of the uniaxial optimal pulse. The elliptic parameter belongs to both functions; it is not a summand.'}
      />
      <p>
        {es
          ? 'Dos asíntotas encierran el costo. Para conmutación rápida, T mucho menor que (alfa + 1/alfa) tau0, Phi_m tiende a pi^2 (1 + alfa^2) / (gamma^2 T), el costo de girar un macrospin sin potencial alguno, y la anisotropía de eje fácil nunca ayuda: Phi_m(T) es mayor o igual que ese costo libre, con igualdad solo en alfa = 0. Para conmutación lenta, Phi_m se acerca exponencialmente al piso universal Phi_inf = 4 alfa K / (gamma mu), y el tiempo T_eps = 2 ln(4/eps) (alfa + 1/alfa) tau0 llega a 1 + eps veces el piso. R05 escribe en cada fila el costo, su razón al costo libre, su razón al piso y las amplitudes pico y media en catorce casos; el caso C10 barre los tiempos en picosegundos del artículo de referencia y pone el campo pico junto al valor publicado: 150,4 mT a 126 ps, sobre los 150 mT de su sección 2.2 y no los 0,11 T de su sección 2.1, y el caso registra ambos valores en vez de elegir en silencio.'
          : 'Two asymptotes bracket the cost. For fast switching, T much shorter than (alpha + 1/alpha) tau0, Phi_m tends to pi^2 (1 + alpha^2) / (gamma^2 T), the cost of turning a macrospin with no potential at all, and easy-axis anisotropy never helps: Phi_m(T) is greater than or equal to that free cost, with equality only at alpha = 0. For slow switching, Phi_m approaches the universal floor Phi_inf = 4 alpha K / (gamma mu) exponentially, and the time T_eps = 2 ln(4/eps) (alpha + 1/alpha) tau0 reaches 1 + eps times the floor. R05 writes into every row the cost, its ratio to the free cost, its ratio to the floor and the peak and mean amplitudes across fourteen cases; case C10 sweeps the kickoff paper’s picosecond times and puts the peak field beside the published value: 150.4 mT at 126 ps, landing on the 150 mT of its section 2.2 and not the 0.11 T of its section 2.1, and the case records both values instead of choosing silently.'}{' '}
        <Cite id="badarneh2026" />
      </p>
      <Equation
        tex={String.raw`\Phi_{\mathrm m} = \frac{2K\,[\,2\mathcal E(m)-\mathcal K(m)\,]}{\gamma\mu\,p},\qquad \Phi_f = \frac{\pi^2(1+\alpha^2)}{\gamma^2 T},\qquad \Phi_\infty = \frac{4\alpha K}{\gamma\mu},\qquad m = -\alpha^2p^2`}
        caption={es ? 'El costo mínimo exacto, el costo de macrospin libre y el piso de tiempo infinito. Todo costo del banco de trabajo se lee contra los dos últimos.' : 'The exact minimum cost, the free-macrospin cost and the infinite-time floor. Every workbench cost is read against the last two.'}
      />
      <p>
        {es
          ? 'La corriente como control tiene su propia forma cerrada. Con torque de espín-órbita, la ecuación de movimiento gana un término tipo campo y uno tipo amortiguamiento, xi_F = xi cos(beta) y xi_D = xi sen(beta), el costo es la integral de la corriente al cuadrado, y la corriente media óptima es 4 j0 raíz(1 + alfa^2) K[sen^2(beta + eta)] / T con eta = arctan(alfa) y j0 = K / (mu xi), independiente de la altura de la barrera. En la razón ideal xi_D = -alfa xi_F el torque queda enteramente polar, el problema colapsa sobre el problema de campo y el pulso es una corriente rotatoria con frecuencia decreciente; en la razón xi_F = alfa xi_D el costo diverge y no hay conmutación. Es el rung R06, el único lo bastante barato para el navegador: el caso C03 corre en el carril en vivo, evaluado en TypeScript con la integral elíptica por la media aritmético-geométrica, y su acuerdo con el artefacto guardado se muestra en el banco de trabajo; hoy es exacto, y una compuerta falla la construcción sobre una parte en un millón.'
          : 'Current as the control has its own closed form. With spin-orbit torque the equation of motion gains a field-like and a damping-like term, xi_F = xi cos(beta) and xi_D = xi sin(beta), the cost is the integral of the squared current, and the optimal mean current is 4 j0 sqrt(1 + alpha^2) K[sin^2(beta + eta)] / T with eta = arctan(alpha) and j0 = K / (mu xi), independent of the barrier height. At the ideal ratio xi_D = -alpha xi_F the torque is entirely polar, the problem collapses onto the field-driven one and the pulse is a rotating current with a falling frequency; at the ratio xi_F = alpha xi_D the cost diverges and there is no switching. This is rung R06, the one cheap enough for the browser: case C03 runs in the live lane, evaluated in TypeScript with the complete elliptic integral by the arithmetic-geometric mean, and its agreement with the committed artifact is shown on the workbench; today it is exact, and a gate fails the build above one part in a million.'}{' '}
        <Cite id="vlasov2022" />
      </p>
      <Equation
        tex={String.raw`\langle j_{\mathrm m}\rangle = \frac{4\,j_0\sqrt{1+\alpha^2}\;\mathcal K\!\left[\sin^2(\beta+\eta)\right]}{T},\qquad j_0 = \frac{K}{\mu\,\xi},\qquad \eta = \arctan\alpha`}
        caption={es ? 'La corriente media del protocolo óptimo de espín-órbita. Diverge cuando beta + eta se acerca a pi/2, la razón prohibida.' : 'The mean current of the optimal spin-orbit-torque protocol. It diverges as beta + eta approaches pi/2, the forbidden ratio.'}
      />
      <Figure caption={es ? 'Izquierda: la forma del pulso uniaxial en una ventana, con sus simetrías exactas. Derecha: el costo mínimo frente al tiempo de conmutación, entre la asíntota de macrospin libre y el piso universal.' : 'Left: the shape of the uniaxial pulse over one window, with its exact symmetries. Right: the minimum cost against the switching time, between the free-macrospin asymptote and the universal floor.'}>
        <ClosedFormDiagram lang={lang} />
      </Figure>
      <Callout variant="honest" title={es ? 'Controles positivos, y dónde terminan' : 'Positive controls, and where they end'}>
        <p>
          {es
            ? 'Estas formas cerradas valen para un solo momento con anisotropía uniaxial. Los materiales con eje duro y las redes no tienen forma cerrada, y sus números vienen de los solucionadores de las pestañas siguientes, cada uno aceptado primero aquí: el solucionador de imágenes converge al costo exacto desde arriba, y esa convergencia es su compuerta de aceptación. La razón prohibida de espín-órbita es una región real donde el protocolo no existe; el caso C03 la marca en la fila en vez de dibujar un costo.'
            : 'These closed forms hold for a single moment with uniaxial anisotropy. Materials with a hard axis, and lattices, have no closed form, and their numbers come from the solvers of the next tabs, each accepted here first: the image solver converges to the exact cost from above, and that convergence is its acceptance gate. The forbidden spin-orbit-torque ratio is a real region where the protocol does not exist; case C03 flags it on the row instead of drawing a cost.'}
        </p>
      </Callout>
      <Refs ids={['kwiatkowski2021', 'vlasov2022', 'sunwang2006', 'badarneh2026']} label="Refs" />
    </div>
  );
}

function NumericalPaths({ lang }: { lang: Lang }): React.JSX.Element {
  const es = lang === 'es';
  return (
    <div className="prose method-tab">
      <p>
        {es
          ? 'Más allá del macrospin uniaxial la ecuación de Euler-Lagrange general, que involucra el hessiano de la energía, no se resuelve, y la trayectoria óptima se obtiene minimizando directamente un funcional discretizado. La trayectoria se representa como una poligeodésica de Q + 2 imágenes sobre la esfera unitaria: los dos extremos quedan fijos en los estados inicial y final y las Q imágenes interiores se mueven. Con la regla del punto medio el costo es la suma de los módulos cuadrados del campo en cada intervalo por su duración, y el campo en cada punto medio sale de invertir la ecuación de movimiento en la posición media, normalizada, y en la velocidad media, cuya magnitud es la velocidad angular en diferencias finitas y cuya dirección es la cuerda entre imágenes vecinas, ortogonal al punto medio.'
          : 'Past the uniaxial macrospin the general Euler-Lagrange equation, which involves the Hessian of the energy, is not solvable, and the optimal path is found by direct minimization of a discretized functional. The trajectory is represented as a polygeodesic of Q + 2 images on the unit sphere: the two endpoints are clamped at the initial and final states and the Q interior images move. With the midpoint rule the cost is the sum of the squared field magnitudes on each interval times its duration, and the field at each midpoint comes from inverting the equation of motion at the normalized mean position and at the mean velocity, whose magnitude is the finite-difference angular velocity and whose direction is the chord between neighbouring images, orthogonal to the midpoint.'}{' '}
        <Cite id="badarneh2023" />
      </p>
      <Equation
        tex={String.raw`\Phi[\mathbf s] \approx \sum_{p=0}^{Q}\bigl|\vec B_{p+\frac12}\bigr|^2\,\Delta t,\qquad \vec s_{p+\frac12} = \frac{\vec s_{p+1}+\vec s_p}{|\vec s_{p+1}+\vec s_p|},\qquad \dot{\vec s}_{p+\frac12} = \frac{\delta_p}{\Delta t}\,\frac{\vec s_{p+1}-\vec s_p}{|\vec s_{p+1}-\vec s_p|}`}
        caption={es ? 'El funcional discretizado sobre Q + 2 imágenes; delta_p es el ángulo geodésico entre imágenes vecinas.' : 'The discretized functional over Q + 2 images; delta_p is the geodesic angle between neighbouring images.'}
      />
      <p>
        {es
          ? 'El descenso corre sobre la variedad curva, el producto de esferas unitarias: el gradiente se proyecta sobre el plano tangente de cada imagen, cada paso se retrae a la esfera por normalización y una búsqueda lineal con retroceso fija el tamaño del paso, de modo que no hay tasa de aprendizaje ajustada a mano. La convergencia se juzga por la disminución relativa del costo, que es adimensional; una tolerancia sobre la magnitud del gradiente dependería de las unidades, porque el gradiente lleva costo por radián y el costo cambia órdenes de magnitud con el tiempo de conmutación. Una imagen interior entra en exactamente dos campos de punto medio, así que su gradiente es local y cada iteración cuesta O(Q). El ángulo geodésico se calcula como 2 atan2(|r - l|, |r + l|), exacto en todo ángulo, porque arccos pierde toda precisión cuando dos imágenes casi coinciden, que es lo que ocurre con un sitio estacionado en un polo. El solucionador del motor elige el número de imágenes por resolución y perturba la cadena inicial por defecto: la geodésica de polo a polo está en un plano de simetría donde el gradiente se anula a primer orden, y una corrida que parte exactamente ahí reporta el meridiano como convergido aunque la trayectoria verdadera precese fuera de él y cueste menos.'
          : 'The descent runs on the curved manifold, the product of unit spheres: the gradient is projected onto each image’s tangent plane, each step is retracted to the sphere by normalization and a backtracking line search sets the step, so no learning rate is tuned by hand. Convergence is judged by the relative decrease in cost, which is dimensionless; a tolerance on the gradient magnitude would depend on units, because the gradient carries cost per radian and the cost changes by orders of magnitude with the switching time. An interior image enters exactly two midpoint fields, so its gradient is local and each iteration costs O(Q). The geodesic angle is computed as 2 atan2(|r - l|, |r + l|), exact at every angle, because arccos loses all precision when two images nearly coincide, which is what a site parked at a pole does. The engine’s solver chooses the image count by resolution and perturbs the initial chain by default: the pole-to-pole geodesic lies in a symmetry plane where the gradient vanishes to first order, and a run started exactly there reports the meridian as converged even though the true path precesses away from it and costs less.'}{' '}
        <Cite id="ivanov2021" />
      </p>
      <Equation
        tex={String.raw`\nabla^{\perp}_p\Phi = \nabla_p\Phi - \vec s_p\,(\vec s_p\cdot\nabla_p\Phi),\qquad \delta_p = 2\,\mathrm{atan2}\bigl(|\vec s_{p+1}-\vec s_p|,\;|\vec s_{p+1}+\vec s_p|\bigr)`}
        caption={es ? 'El gradiente proyectado al plano tangente y el ángulo geodésico en su forma numéricamente estable.' : 'The gradient projected onto the tangent plane and the geodesic angle in its numerically stable form.'}
      />
      <p>
        {es
          ? 'Coexisten varias trayectorias óptimas. En el sistema biaxial, para razones de eje duro desde cerca de cuatro, las trayectorias asimétricas pueden ser el óptimo global mientras la simétrica es solo un mínimo local; la referencia encuentra seis con xi = 4, alfa = 0,2 y T = 5,314 tau0. Una sola semilla reporta la cuenca en la que cayó, así que el motor barre varias semillas y conserva la de menor costo, y el caso C04 hace de la semilla la variante para que la familia quede visible en el artefacto en vez de colapsada por la búsqueda. La compuerta de aceptación es el sistema uniaxial: el costo numérico converge al de la forma cerrada desde arriba, con la brecha cayendo al subir el número de imágenes, y solo tras pasarla se usa el solucionador donde no hay forma cerrada. El rung R07 reporta el costo, su razón a la forma cerrada donde existe, si convergió, cuántas imágenes usó y cuánto tardó, en los casos C01, C02, C04, C06, C11 y C19 a C21.'
          : 'Several optimal paths coexist. In the biaxial system, for hard-axis ratios from about four, the asymmetric paths can be the global optimum while the symmetric one is only a local minimum; the reference finds six at xi = 4, alpha = 0.2 and T = 5.314 tau0. A single seed reports whichever basin it fell into, so the engine sweeps several seeds and keeps the cheapest, and case C04 makes the seed the variant so that the family stays visible in the artifact instead of being collapsed by the search. The acceptance gate is the uniaxial system: the numerical cost converges to the closed form’s from above, with the gap falling as the image count rises, and only after passing it is the solver used where no closed form exists. Rung R07 reports the cost, its ratio to the closed form where one exists, whether it converged, how many images it used and how long it took, on cases C01, C02, C04, C06, C11 and C19 to C21.'}
      </p>
      <p>
        {es
          ? 'El eje duro es el único mecanismo de esta literatura que baja el costo por debajo del macrospin libre. Con E = xi K s_x^2 - K s_z^2, eje fácil z y eje duro x, la componente polar del torque interno vale Gamma_theta = Gamma_0 sen(theta) [xi sen(2 phi) - 2 alfa cos(theta) (1 + xi cos^2(phi))] con Gamma_0 = 1 / (2 tau0 (1 + alfa^2)): con xi = 0 se reduce a -Gamma_0 alfa sen(2 theta), negativa en todo el hemisferio norte, y el torque interno no puede ayudar; con xi > 0 hay una región donde apunta en la dirección de conmutación, y la trayectoria óptima sube por la superficie de energía donde el torque asiste y cruza el ecuador en un azimut entre pi/4 y pi/2, nunca por la silla. La teoría de perturbaciones da la reducción a primer orden en la anisotropía dura, Phi_m ≈ Phi_f - 4 K xi / (gamma mu), mientras la barrera sigue siendo K: la escritura y la estabilidad se desacoplan. Medido en este producto sobre 196 puntos, siete razones, cuatro amortiguamientos y siete tiempos, 145 celdas son evidencia y el eje duro paga en 80, todas a tiempos cortos; el mejor punto es 4,32 veces el costo uniaxial con razón 4, alfa = 0,001 y T = 2 tau0, y con alfa = 0,01 el beneficio termina más allá de T = 20 tau0. CrSBr es triaxial y su anisotropía es sintonizable por el sustrato, así que el sustrato es una perilla de diseño sobre xi.'
          : 'The hard axis is the one mechanism in this literature that lowers the cost below the free macrospin. With E = xi K s_x^2 - K s_z^2, easy axis z and hard axis x, the polar component of the internal torque is Gamma_theta = Gamma_0 sin(theta) [xi sin(2 phi) - 2 alpha cos(theta) (1 + xi cos^2(phi))] with Gamma_0 = 1 / (2 tau0 (1 + alpha^2)): at xi = 0 it reduces to -Gamma_0 alpha sin(2 theta), negative over the whole northern hemisphere, and the internal torque cannot assist; at xi > 0 there is a region where it points along the switching direction, and the optimal path climbs the energy surface where the torque assists and crosses the equator at an azimuth between pi/4 and pi/2, never through the saddle. Perturbation theory gives the reduction at first order in the hard-axis anisotropy, Phi_m ≈ Phi_f - 4 K xi / (gamma mu), while the barrier stays K: writability and stability decouple. Measured in this product over 196 points, seven ratios, four dampings and seven times, 145 cells are evidence and the hard axis pays in 80, all at short switching times; the best point is 4.32 times the uniaxial cost at ratio 4, alpha = 0.001 and T = 2 tau0, and at alpha = 0.01 the benefit ends beyond T = 20 tau0. CrSBr is triaxial and its anisotropy is substrate-tunable, so the substrate is a design knob on xi.'}{' '}
        <Cite id="badarneh2023" /> <Cite id="rudenko2023" />
      </p>
      <Equation
        tex={String.raw`\Gamma_\theta = \Gamma_0\,\sin\theta\,\bigl[\xi\sin 2\varphi - 2\alpha\cos\theta\,(1+\xi\cos^2\varphi)\bigr],\qquad T^{*} = \frac{(1+\alpha^2)\,\pi^2}{2(\alpha+\xi)}\,\tau_0`}
        caption={es ? 'El torque interno que un eje duro pone en la dirección de conmutación, y el tiempo de rodilla donde las dos asíntotas del costo se cruzan.' : 'The internal torque a hard axis puts along the switching direction, and the knee time where the two cost asymptotes cross.'}
      />
      <Figure caption={es ? 'Izquierda: la cadena de imágenes con el campo de cada punto medio. Derecha: la superficie biaxial vista desde el eje fácil; la trayectoria óptima cruza el ecuador lejos de las sillas.' : 'Left: the image chain with the field at each midpoint. Right: the biaxial surface seen from the easy axis; the optimal path crosses the equator away from the saddles.'}>
        <NumericalDiagram lang={lang} />
      </Figure>
      <Callout variant="honest" title={es ? 'El control decide qué cuenta' : 'The control decides what counts'}>
        <p>
          {es
            ? 'Con razón de eje duro cero el sistema biaxial es el uniaxial, y el solucionador devuelve la forma cerrada dentro de cerca de uno por ciento en la mayoría de los puntos, pero se desvía hasta 26 por ciento en la esquina de tiempos largos, donde el óptimo se acerca a su piso. Leer una reducción cruda de 1,005 como "el eje duro ayudó" sería leer esa deriva. Cada celda del mapa se divide por su propio control, al mismo amortiguamiento y tiempo, y cuenta como evidencia solo si el control se sostiene al 5 por ciento, la corrida convergió y el óptimo uniaxial no está ya en su piso: 51 de 196 celdas quedan tachadas. El mapa está en unidades reducidas sobre el macrospin sintético de referencia.'
            : 'At zero hard-axis ratio the biaxial system is the uniaxial one, and the solver returns the closed form within about one per cent at most points, but drifts to 26 per cent in the long-time corner, where the optimum approaches its floor. Reading a raw reduction of 1.005 as "the hard axis helped" would be reading that drift. Every cell of the map is divided by its own control, at the same damping and time, and counts as evidence only if the control holds to 5 per cent, the solve converged and the uniaxial optimum is not already at its floor: 51 of 196 cells are crossed out. The map is in reduced units on the synthetic reference macrospin.'}
        </p>
      </Callout>
      <Refs ids={['badarneh2023', 'kwiatkowski2021', 'ivanov2021', 'rudenko2023']} label="Refs" />
    </div>
  );
}

function Realizable({ lang }: { lang: Lang }): React.JSX.Element {
  const es = lang === 'es';
  return (
    <div className="prose method-tab">
      <p>
        {es
          ? 'Los óptimos sin restricción son ondas de Jacobi cuya amplitud y fase varían en la escala de Larmor, y un generador real tiene una amplitud pico y un ancho de banda finitos. La maniobra inversa no puede llevar una restricción, porque en ella el control es una salida y no una variable; para restringirlo hay que optimizarlo directamente. GRAPE parametriza el campo transversal por tramos entre N valores de rebanada y los optimiza bajo una restricción de caja sobre la amplitud, con una penalización opcional sobre la tasa de variación; CRAB lo expande en unos pocos armónicos de la ventana de conmutación, con ambas cuadraturas, porque una base con un solo seno por armónico no puede rotar y quedó en 6,2 veces el óptimo sin mejorar con el ancho de banda. En ambos el truncamiento es la restricción, así que el resultado es realizable por construcción y no por penalización, y ambos integran la misma ecuación de Landau-Lifshitz-Gilbert y reportan el mismo costo que el resto del motor.'
          : 'The unconstrained optima are Jacobi waveforms whose amplitude and phase vary on the Larmor scale, and a real generator has a finite peak amplitude and a finite bandwidth. The inverse move cannot carry a constraint, because in it the control is an output rather than a variable; to constrain it, it has to be optimized directly. GRAPE parameterizes the transverse field piecewise between N slice values and optimizes them under a box constraint on the amplitude, with an optional penalty on the slew rate; CRAB expands it in a few harmonics of the switching window, with both quadratures, because a basis with one sine per harmonic cannot rotate and sat at 6.2 times the optimum without improving with bandwidth. In both the truncation is the constraint, so the result is realizable by construction rather than by penalty, and both integrate the same Landau-Lifshitz-Gilbert equation and report the same cost as the rest of the engine.'}{' '}
        <Cite id="khaneja2005" /> <Cite id="caneva2011" />
      </p>
      <Equation
        tex={String.raw`L = \Phi + \lambda\,\frac{1+s_z(T)}{2},\qquad \lambda \leftarrow 10\lambda \;\text{${es ? 'mientras la infidelidad supere' : 'while the infidelity exceeds'}}\; 10^{-5}`}
        caption={es ? 'El objetivo con la penalización de inversión incompleta y su continuación. Una sola lambda deja el momento a medio camino y compara dos cantidades distintas.' : 'The objective with the incomplete-reversal penalty and its continuation. A single lambda leaves the moment part way and compares two different quantities.'}
      />
      <p>
        {es
          ? 'Un solo problema con lambda fija no responde la pregunta: los dos términos se intercambian, y el punto más barato de L es un pulso que deja el momento a medio camino. Con un armónico se detuvo en una infidelidad de 0,15, es decir s_z(T) = -0,69, y reportó su costo contra un óptimo analítico que invierte exactamente. Por eso los solucionadores corren una continuación de penalización: resuelven hasta converger, miden la infidelidad y, si supera 1e-5, multiplican lambda por diez y reinician desde el punto actual. El umbral de reporte es s_z(T) menor o igual que -0,998; el signo solo no basta, porque un pulso que se detiene en s_z = -0,3 está en la cuenca invertida y no ha conmutado. Un pulso que nunca llega al objetivo se reporta como no invertido, con su infidelidad, y no como un costo barato.'
          : 'A single solve at a fixed lambda does not answer the question: the two terms trade against each other, and the cheapest point of L is a pulse that leaves the moment part way. At one harmonic it stopped at an infidelity of 0.15, that is s_z(T) = -0.69, and reported its cost against an analytic optimum that reverses exactly. The solvers therefore run a penalty continuation: solve to convergence, measure the infidelity and, if it is above 1e-5, multiply lambda by ten and restart from the current point. The reporting threshold is s_z(T) at or below -0.998; the sign alone is not enough, because a pulse that stops at s_z = -0.3 is in the reversed basin and has not switched. A pulse that never reaches the target is reported as not reversed, with its infidelity, and not as a cheap cost.'}
      </p>
      <p>
        {es
          ? 'Ambos controles son lineales en sus parámetros: sobre la malla de integración el campo es b(t_i) = suma_p D_ip theta_p para una matriz de diseño fija, los pesos de interpolación en GRAPE y la base armónica en CRAB. El gradiente respecto de los parámetros es una multiplicación traspuesta del gradiente respecto del campo, y ese gradiente lo entrega el adjunto discreto, el rung R10, en una sola pasada hacia atrás, al costo de una integración extra e independiente del número de parámetros. El optimizador corre contra la integración propia del adjunto, para que objetivo y gradiente sean un par consistente, y el pulso final se reevalúa con el RK4 que conserva la norma: con 2400 pasos los dos integradores difieren en unas 4e-5 en s_z(T), muy dentro del umbral, y el costo reportado no depende del integrador. Esto reemplazó diferencias finitas y un símplex de Nelder-Mead que tardaban de 90 a 230 segundos por corrida y devolvían 2,2 veces el óptimo con dos armónicos subiendo a 14 veces con seis: más armónicos es un conjunto factible estrictamente mayor, así que el costo no puede subir con el ancho de banda, y esa monotonía fue la refutación. La prueba de monotonía existía y pasaba, porque afirmaba una holgura de 0,2 en s_z final; ahora afirma la desigualdad sobre el costo y exige antes una inversión real.'
          : 'Both controls are linear in their parameters: on the integration grid the field is b(t_i) = sum_p D_ip theta_p for a fixed design matrix, the interpolation weights for GRAPE and the harmonic basis for CRAB. The gradient with respect to the parameters is one transposed multiply away from the gradient with respect to the field, and that gradient is what the discrete adjoint, rung R10, returns in a single backward pass, at the cost of one extra integration and independent of the number of parameters. The optimizer runs against the adjoint’s own integration, so the objective and the gradient are a consistent pair, and the final pulse is re-evaluated with the norm-preserving RK4: at 2400 steps the two integrators differ by about 4e-5 in s_z(T), far inside the threshold, and the reported cost does not depend on the integrator. This replaced finite differences and a Nelder-Mead simplex that took 90 to 230 seconds per solve and returned 2.2 times the optimum at two harmonics rising to 14 times at six: more harmonics is a strictly larger feasible set, so the cost cannot rise with bandwidth, and that monotonicity was the falsifier. The monotonicity test existed and passed, because it asserted a slack of 0.2 in the final s_z; it now asserts the inequality on the cost and requires a real reversal first.'}{' '}
        <Cite id="engel2023" />
      </p>
      <Equation
        tex={String.raw`b(t_i) = \sum_p D_{ip}\,\theta_p,\qquad \frac{\partial L}{\partial \theta} = D^{\mathsf T}\,\frac{\partial L}{\partial b}`}
        caption={es ? 'El gradiente exacto a través de una base lineal: una pasada adjunta hacia atrás, cualquiera sea el número de parámetros.' : 'The exact gradient through a linear basis: one backward adjoint pass, whatever the number of parameters.'}
      />
      <p>
        {es
          ? 'Lo que mide hoy, sobre el macrospin de referencia (3 magnetones de Bohr, 0,15 meV, alfa = 0,1) a diez tau0 y contra el óptimo de forma cerrada, medido el 2026-09-17: CRAB da 2,15, 1,39, 1,21, 1,16, 1,13 y 1,14 veces el óptimo con uno, dos, tres, cuatro, seis y ocho armónicos, monótono hasta un piso cerca de 13 por ciento sobre el óptimo, que es el precio genuino de un pulso de banda limitada que debe anularse en ambos extremos de la ventana; cada corrida tarda de 10 a 90 segundos. Bajo un tope de amplitud, GRAPE recupera el óptimo cuando el tope es holgado, 1,003 con 20 campos de anisotropía, paga 1,08 cuando el tope se acerca al pico que el óptimo mismo usa, 0,63 campos, y no puede invertir el momento por debajo de cerca de 0,45 campos por componente; ese umbral es la respuesta honesta a un tope estrecho. Los casos C23 y C24 llevan estas dos curvas como variantes, y el rung R13, el caso C25, co-optimiza campo y corriente con un costo de dos términos ponderado por las constantes de circuito de cada fuente: al barrer el precio relativo de la corriente de 1e-1 a 1e-4, la fracción del costo ponderado que lleva el campo pasa de 0,96 a 0,03, así que el cruce entre un óptimo dominado por el campo y uno dominado por la corriente está dentro de esa ventana. Los coeficientes explícitos del torque de espín-órbita son (xi_F - alfa xi_D) y (xi_D + alfa xi_F) sobre 1 + alfa^2; el primer integrador sustituyó los acoplamientos de Gilbert directamente en la forma explícita, de 2 a 22 por ciento de error con alfa = 0,1, y hoy una prueba lo compara con una solución lineal directa a precisión de máquina.'
          : 'What it measures today, on the reference macrospin (3 Bohr magnetons, 0.15 meV, alpha = 0.1) at ten tau0 and against the closed-form optimum, measured on 2026-09-17: CRAB gives 2.15, 1.39, 1.21, 1.16, 1.13 and 1.14 times the optimum at one, two, three, four, six and eight harmonics, monotone down to a floor about 13 per cent above the optimum, which is the genuine price of a band-limited pulse that must vanish at both ends of the window; each solve takes 10 to 90 seconds. Under an amplitude cap, GRAPE recovers the optimum when the cap is loose, 1.003 at 20 anisotropy fields, pays 1.08 as the cap approaches the peak the optimum itself uses, 0.63 fields, and cannot reverse the moment at all below about 0.45 fields per component; that threshold is the honest answer at a tight cap. Cases C23 and C24 carry these two curves as variants, and rung R13, case C25, co-optimizes field and current with a two-term cost weighted by the circuit constants of each source: sweeping the relative price of current from 1e-1 to 1e-4 moves the share of the weighted cost carried by the field from 0.96 to 0.03, so the crossover between a field-dominated and a current-dominated optimum lies inside that window. The explicit spin-orbit-torque coefficients are (xi_F - alpha xi_D) and (xi_D + alpha xi_F) over 1 + alpha^2; the first integrator substituted the Gilbert couplings directly into the explicit form, 2 to 22 per cent off at alpha = 0.1, and a test now compares it with a direct linear solve to machine precision.'}{' '}
        <Cite id="vlasov2022" />
      </p>
      <Equation
        tex={String.raw`\Phi = \mathcal C_b\!\int_0^T |\vec b|^2\,dt + \mathcal C_j\!\int_0^T |\vec j|^2\,dt,\qquad \dot{\vec s} = -\gamma\,\vec s\times\vec b + \alpha\,\vec s\times\dot{\vec s} + \gamma\xi_{\mathrm F}\,\vec s\times(\vec j\times\vec e_z) + \gamma\xi_{\mathrm D}\,\vec s\times[\vec s\times(\vec j\times\vec e_z)]`}
        caption={es ? 'El costo de dos términos del problema conjunto y la ecuación de movimiento con los torques tipo campo y tipo amortiguamiento.' : 'The two-term cost of the joint problem and the equation of motion with the field-like and damping-like torques.'}
      />
      <Figure caption={es ? 'El precio de la realizabilidad medido por el motor: costo sobre el óptimo frente al número de armónicos (CRAB) y frente al tope de amplitud (GRAPE), con la región sin inversión.' : 'The price of realizability as the engine measures it: cost over the optimum against the harmonic count (CRAB) and against the amplitude cap (GRAPE), with the no-reversal region.'}>
        <RealizabilityDiagram lang={lang} />
      </Figure>
      <Callout variant="honest" title={es ? 'Una replicación que no reproduce' : 'A replication that does not reproduce'}>
        <p>
          {es
            ? 'Los números de esta pestaña están medidos sobre el macrospin sintético de referencia a un amortiguamiento y un tiempo. El protocolo de corriente rotatoria con barrido lineal de frecuencia que la fuente propone como sustituto realizable, el rung R04 en el caso C08, no reproduce sus probabilidades de conmutación: sobre 1.000 copias estocásticas el motor conmuta 0,9 por ciento con 0,17 j0 donde la fuente reporta 0,89, y la curva completa queda desplazada cerca de 1,4 veces en amplitud. Se descartó todo lo alcanzable, el sentido de rotación, la inclinación inicial, las dos convenciones de acoplamiento, la frecuencia máxima y la unidad de tiempo; la brecha está en un detalle que el texto no da o en el motor de un modo que ninguna comprobación toca, y queda registrada como no replicación con los valores publicados fijados junto al comportamiento del motor en sus pruebas.'
            : 'The numbers on this tab are measured on the synthetic reference macrospin at one damping and one time. The rotating-current protocol with a linear frequency sweep that the source proposes as a realizable substitute, rung R04 on case C08, does not reproduce its switching probabilities: over 1,000 stochastic copies the engine switches 0.9 per cent at 0.17 j0 where the source reports 0.89, and the whole curve sits shifted by about 1.4 times in amplitude. Everything within reach was ruled out, the sense of rotation, the starting tilt, the two coupling conventions, the peak frequency and the time unit; the gap is in a detail the text does not give or in the engine in a way no check touches, and it is recorded as a non-replication with the published values pinned beside the engine’s behaviour in its tests.'}
        </p>
      </Callout>
      <Refs ids={['khaneja2005', 'caneva2011', 'engel2023', 'vlasov2022', 'badarneh2023']} label="Refs" />
    </div>
  );
}

function Reliability({ lang }: { lang: Lang }): React.JSX.Element {
  const es = lang === 'es';
  return (
    <div className="prose method-tab">
      <p>
        {es
          ? 'Las trayectorias óptimas se calculan a temperatura cero, y si un pulso conmuta de verdad un bit a temperatura finita es una pregunta estadística aparte. El teorema de fluctuación-disipación fija la intensidad del campo térmico: el mismo amortiguamiento de Gilbert que disipa energía inyecta ruido blanco con covarianza 2 alfa k_B T / (gamma mu) por delta de Kronecker y delta de Dirac en el tiempo. El motor lo integra con un esquema de Heun estocástico que renormaliza cada paso, y la comprobación decisiva es que reproduce la distribución de Boltzmann que debe: cerca de un mínimo uniaxial el ángulo polar cuadrático medio es k_B T / K, y el termostato lo recupera al diez por ciento. Alcanzar el equilibrio toma un tiempo de disipación, tau0 / alfa, así que la etapa de equilibración escala con el amortiguamiento: una etapa fija que basta con alfa = 0,1 es diez veces demasiado corta con 0,01 y produce un conjunto que no puede fallar. El rung R11 reporta la fracción de copias que invirtieron, a un factor de estabilidad K / k_B T que es la variante del caso: 600 copias en C07, 1.000 por celda en la prueba de predicción.'
          : 'The optimal paths are computed at zero temperature, and whether a pulse actually switches a bit at a finite temperature is a separate, statistical question. The fluctuation-dissipation theorem fixes the strength of the thermal field: the same Gilbert damping that dissipates energy injects white noise with covariance 2 alpha k_B T / (gamma mu) times a Kronecker delta and a Dirac delta in time. The engine integrates it with a stochastic Heun scheme that renormalizes every step, and the decisive check is that it reproduces the Boltzmann distribution it must: near a uniaxial minimum the mean square polar angle is k_B T / K, and the thermostat recovers it to ten per cent. Reaching equilibrium takes a dissipation time, tau0 / alpha, so the equilibration stage scales with the damping: a fixed one that suffices at alpha = 0.1 is ten times too short at 0.01 and produces an ensemble that cannot fail. Rung R11 reports the fraction of copies that reversed, at a stability factor K / k_B T that is the case’s variant: 600 copies in C07, 1,000 per cell in the prediction test.'}{' '}
        <Cite id="evans2014" />
      </p>
      <Equation
        tex={String.raw`\bigl\langle b^{\mathrm{th}}_i(t)\,b^{\mathrm{th}}_j(t')\bigr\rangle = \frac{2\alpha\,k_B T}{\gamma\mu}\,\delta_{ij}\,\delta(t-t')`}
        caption={es ? 'El termostato: la misma alfa que disipa fija la intensidad del ruido. Su prueba es la distribución de Boltzmann que recupera.' : 'The thermostat: the same alpha that dissipates fixes the noise strength. Its test is the Boltzmann distribution it recovers.'}
      />
      <p>
        {es
          ? 'El óptimo desnudo es frágil por una razón precisa. Linealizar la ecuación de movimiento alrededor de la trayectoria óptima da una perturbación de dos componentes en el espacio tangente, gobernada por los autovalores del hessiano de la energía desplazados por la componente longitudinal B_r del campo aplicado: w1 = B_r + (K / mu) cos(2 theta) y w2 = B_r + (K / mu) cos^2(theta). Las perturbaciones son elípticas y acotadas cuando w1 w2 > 0 e hiperbólicas y divergentes cuando w1 w2 <= 0. El pulso óptimo es perpendicular por construcción, así que tiene B_r = 0, y con B_r = 0 el tramo pi/4 <= theta <= 3pi/4 de la inversión es hiperbólico: esa hiperbolicidad, y no la barrera, es la causa primaria de que el pulso y el momento pierdan la fase. Una componente longitudinal B_r s0(t) con |B_r| > K / mu elimina el dominio hiperbólico y lleva la tasa de éxito a la unidad; es invisible para la dinámica a primer orden, pero no para el costo, al que agrega la integral de B_r al cuadrado.'
          : 'The bare optimum is fragile for a precise reason. Linearizing the equation of motion about the optimal path gives a two-component perturbation in the tangent space, governed by the eigenvalues of the energy Hessian shifted by the longitudinal component B_r of the applied field: w1 = B_r + (K / mu) cos(2 theta) and w2 = B_r + (K / mu) cos^2(theta). Perturbations are elliptic and bounded when w1 w2 > 0 and hyperbolic and divergent when w1 w2 <= 0. The optimal pulse is perpendicular by construction, so it has B_r = 0, and at B_r = 0 the stretch pi/4 <= theta <= 3pi/4 of the reversal is hyperbolic: that hyperbolicity, not the barrier, is the primary cause of the pulse and the moment losing phase. A longitudinal component B_r s0(t) with |B_r| > K / mu removes the hyperbolic domain and drives the success rate to unity; it is invisible to the leading-order dynamics, but not to the cost, to which it adds the integral of B_r squared.'}{' '}
        <Cite id="badarneh2023thermal" />
      </p>
      <Equation
        tex={String.raw`\frac{1+\alpha^2}{\gamma}\,\dot{\vec\epsilon} = \begin{bmatrix}-\alpha & -1\\ 1 & -\alpha\end{bmatrix}\begin{bmatrix} w_1 & 0\\ 0 & w_2\end{bmatrix}\vec\epsilon,\qquad w_1 = B_r + \frac{K}{\mu}\cos 2\theta,\quad w_2 = B_r + \frac{K}{\mu}\cos^2\theta`}
        caption={es ? 'La dinámica linealizada de una perturbación; hiperbólica donde w1 w2 <= 0, que con B_r = 0 es la mitad de la inversión.' : 'The linearized dynamics of a perturbation; hyperbolic where w1 w2 <= 0, which at B_r = 0 is half the reversal.'}
      />
      <p>
        {es
          ? 'El rung R12 mide lo que ese seguro cuesta, el frente costo-fiabilidad del manuscrito M1 en su versión 4. La fracción hiperbólica cae de un medio con campo cero a cero cuando el campo alcanza un campo de anisotropía, como predice el análisis linealizado. Con factor de estabilidad 20 el pulso desnudo ya invierte todas las copias, así que el campo no compra nada y cuesta mucho: ahí el frente mide un precio y ninguna ganancia. Donde el pulso desnudo es frágil compra mucho: con factor de estabilidad uno sube la tasa de éxito de 0,735 a 0,985, elimina el 94 por ciento de los fallos, y llega a la unidad desde un factor de dos hacia arriba. El precio es analítico y empinado: un campo de anisotropía cuesta 2,5 veces el costo óptimo desnudo, dos cuestan 10,1 veces y dos y medio 15,8 veces. El signo de ese campo sostiene todo el resultado, y estuvo mal: el análisis del motor llamaba estabilizador a un B_r positivo mientras la simulación lo aplicaba al revés, así que sobre CrSBr con factor uno la tasa era 0,780 desnuda, 0,530 con el signo viejo y 0,958 con el corregido. Lo encontró la prueba de predicción, se corrigió en spinoct 0.18.000 y se recalculó cada número de fiabilidad que el producto había publicado; las versiones 1 a 3 de M1 imprimían una caída cerca de un campo de anisotropía y la explicaban como física. No hay caída.'
          : 'Rung R12 measures what that insurance costs, the cost-reliability front of manuscript M1 in its version 4. The hyperbolic fraction falls from one half at zero field to zero once the field reaches one anisotropy field, as the linearized analysis predicts. At a stability factor of 20 the bare pulse already reverses every copy, so the field buys nothing and costs a great deal: there the front measures a price and no gain. Where the bare pulse is fragile it buys a great deal: at a stability factor of one it lifts the success rate from 0.735 to 0.985, removing 94 per cent of the failures, and reaches unity from a factor of two upward. The price is analytic and steep: one anisotropy field costs 2.5 times the bare optimal cost, two cost 10.1 times and two and a half 15.8 times. The sign of that field carries the whole result, and it was wrong: the engine’s analysis called a positive B_r stabilizing while the simulation applied it the other way, so on CrSBr at a stability factor of one the rate was 0.780 bare, 0.530 with the old sign and 0.958 with the corrected one. The prediction test found it, spinoct 0.18.000 corrected it and every reliability number the product had shipped was rebaked; versions 1 to 3 of M1 printed a dip near one anisotropy field and explained it as physics. There is no dip.'}
      </p>
      <p>
        {es
          ? 'El motor ofrecía un sustituto barato del conjunto y lo afirmaba en su propia documentación: la integral de hiperbolicidad a lo largo de la trayectoria, P = integral de max(0, -w1 w2) dt, sale del mismo hessiano que el solucionador ya tiene y debía predecir la tasa de éxito de Monte Carlo sin correr ningún conjunto. Se puso a prueba donde puede fallar: cinco campos longitudinales de 0 a 1 campo de anisotropía contra seis factores de estabilidad de 1 a 20, 1.000 copias por celda, sobre CrSBr a diez tiempos de Larmor, con los conjuntos corriendo por el frente del propio motor para que análisis y simulación no puedan discrepar sobre qué significa B_r. La afirmación se parte en dos y solo una mitad se sostiene: en los extremos del barrido, donde el análisis dice que la inestabilidad desapareció, el conjunto falla menos en las cinco filas que pueden decidir; pero al ordenar el barrido completo la integral no ordena ninguna de las seis filas, porque sube de 4,27 a 8,36 en unidades del piso entre cero y un cuarto de campo mientras los fallos ya cayeron. La fracción hiperbólica sí lo ordena, 0,50, 0,42, 0,33, 0,23 y 0,00, monótona como los fallos, en cada fila que no está empatada en cero. El predictor barato que funciona es cuánto de la trayectoria es inestable, no cuán inestable es.'
          : 'The engine offered a cheap substitute for the ensemble and stated it in its own documentation: the hyperbolicity integral along the path, P = integral of max(0, -w1 w2) dt, comes from the same Hessian the solver already has and was supposed to predict the Monte-Carlo success rate without running an ensemble. It was tested where it can fail: five longitudinal fields from 0 to 1 anisotropy field against six stability factors from 1 to 20, 1,000 copies per cell, on CrSBr at ten Larmor times, with the ensembles run through the engine’s own front so that analysis and simulation cannot disagree about what B_r means. The claim splits in two and only one half holds: at the ends of the sweep, where the analysis says the instability is gone, the ensemble fails less in all five rows that can decide; but ranking the whole sweep, the integral ranks none of the six rows, because it rises from 4.27 to 8.36 in units of the floor between zero and a quarter field while the failures have already fallen. The hyperbolic fraction does rank it, 0.50, 0.42, 0.33, 0.23 and 0.00, monotone like the failures, in every row not tied at zero. The cheap predictor that works is how much of the path is unstable, not how unstable it is.'}
      </p>
      <Equation
        tex={String.raw`P[\vec s] = \int_0^T \max\bigl(0,\,-w_1 w_2\bigr)\,dt,\qquad f_{\mathrm{hyp}} = \frac{1}{T}\int_0^T \mathbf 1\bigl[w_1 w_2 \le 0\bigr]\,dt`}
        caption={es ? 'La integral de penalización y la fracción hiperbólica. Solo la segunda ordena la tasa de fallo medida.' : 'The penalty integral and the hyperbolic fraction. Only the second ranks the measured failure rate.'}
      />
      <Figure caption={es ? 'Izquierda: el tramo hiperbólico del camino desnudo y su desaparición con un campo de anisotropía longitudinal. Derecha: el frente medido con factor de estabilidad uno, y su precio.' : 'Left: the hyperbolic stretch of the bare path and its disappearance under one longitudinal anisotropy field. Right: the measured front at a stability factor of one, and its price.'}>
        <ReliabilityDiagram lang={lang} />
      </Figure>
      <Callout variant="honest" title={es ? 'Temperaturas de un solo sitio' : 'Single-site temperatures'}>
        <p>
          {es
            ? 'Las temperaturas de estas pruebas son sub-kelvin, porque un solo sitio de CrSBr lleva una anisotropía de 1,7 K en unidades de temperatura; la estabilidad de grado dispositivo viene del volumen acoplado por intercambio y no de un sitio. A tiempo reducido fijo, factor de estabilidad fijo y campo en unidades del campo de anisotropía del material, ningún otro parámetro entra en la dinámica reducida, así que los materiales que comparten un amortiguamiento comparten estas columnas exactamente, y una prueba lo sostiene. Las tasas de C07 se muestran con su intervalo binomial sobre 600 copias, y el costo sigue en T^2 s.'
            : 'The temperatures in these tests are sub-kelvin, because one site of CrSBr carries an anisotropy of 1.7 K in temperature units; device-grade stability comes from the exchange-coupled volume and not from one site. At a fixed reduced time, a fixed stability factor and a field in units of the material’s anisotropy field, no other parameter enters the reduced dynamics, so materials that share a damping share these columns exactly, and a test holds it. The C07 rates are shown with their binomial interval over 600 copies, and the cost stays in T^2 s.'}
        </p>
      </Callout>
      <Refs ids={['badarneh2023thermal', 'evans2014', 'kwiatkowski2021']} label="Refs" />
    </div>
  );
}

function BeyondMacrospin({ lang }: { lang: Lang }): React.JSX.Element {
  const es = lang === 'es';
  return (
    <div className="prose method-tab">
      <p>
        {es
          ? 'Los autores del método dicen en letra impresa que la aproximación de macrospin se rompe con el tamaño y que la inversión puede pasar por rotación no uniforme, nucleación y propagación de paredes de dominio u ondas de espín, y que queda por ver en qué condiciones esos mecanismos se vuelven óptimos en energía. La cadena del motor, E = -K suma s_z^2 - J suma s_i . s_j, con intercambio a primeros vecinos y anisotropía uniaxial, es la respuesta a esa pregunta: el solucionador de red libera la trayectoria de cada sitio, Q + 2 rebanadas de tiempo de N vectores unitarios con ambos extremos fijos, y el campo que cada sitio necesita sale de invertir la ecuación de movimiento con el campo interno de la cadena, anisotropía más intercambio de los vecinos. El gradiente se obtiene por coloreo de grafo: una imagen interior entra en dos intervalos en el tiempo y, a través del intercambio, en tres sitios en el espacio, así que las imágenes separadas por dos en el tiempo y tres en el espacio tienen huellas disjuntas, y 2 por 3 clases, por tres componentes, por dos signos, son 36 evaluaciones del costo por gradiente, independientes de Q y de N; sobre un parche cuadrado el coloreo (x + 2y) mod 5, el código perfecto de la retícula, cuesta 60. Coincide con la diferencia central ingenua a una parte en 1e8.'
          : 'The authors of the method state in print that the macrospin approximation breaks down with size and that the reversal may involve nonuniform rotation, nucleation and propagation of domain walls or spin waves, and that it remains to be seen under what conditions those mechanisms become energy-optimal. The engine’s chain, E = -K sum s_z^2 - J sum s_i . s_j, with nearest-neighbour exchange and uniaxial anisotropy, is the answer to that question: the lattice solver frees every site’s trajectory, Q + 2 time slices of N unit vectors with both ends clamped, and the field each site needs comes from inverting the equation of motion with the chain’s internal field, anisotropy plus the neighbours’ exchange. The gradient comes by graph colouring: an interior image enters two intervals in time and, through the exchange, three sites in space, so images two apart in time and three apart in space have disjoint footprints, and 2 by 3 classes, times three components, times two signs, is 36 cost evaluations per gradient, independent of Q and N; on a square patch the colouring (x + 2y) mod 5, the perfect code of the grid, costs 60. It matches the naive central difference to one part in 1e8.'}{' '}
        <Cite id="badarneh2023" />
      </p>
      <Equation
        tex={String.raw`\vec b_i = \frac{\alpha}{\gamma}\,\vec v_i + \frac{1}{\gamma}\,\vec s_i\times\vec v_i - \vec b^{\perp}_{\mathrm{int},i},\qquad \Phi = \sum_q\sum_i |\vec b_i|^2\,\Delta t,\qquad \Phi \le N\,\Phi_{\mathrm{site}}`}
        caption={es ? 'El campo por sitio con el intercambio en el campo interno, el costo de la cadena, y la cota exacta de la rotación uniforme, cuyo campo de intercambio es puramente longitudinal.' : 'The per-site field with the exchange in the internal field, the chain cost, and the exact bound of uniform rotation, whose exchange field is purely longitudinal.'}
      />
      <p>
        {es
          ? 'Un piso riguroso acota la respuesta desde abajo. Al multiplicar escalarmente la ecuación invertida por la velocidad, el campo interno trabaja a la tasa del cambio de energía del sitio, mu b . s_p = dE/dt + mu (alfa / gamma) |s_p|^2; solo la componente del campo a lo largo de la velocidad entra, y en cualquier tramo donde la energía sube la desigualdad de las medias da |b|^2 >= (4 alfa / (gamma mu)) dE/dt. Sumado sobre sitios e integrado sobre la subida, toda inversión cuesta al menos 4 alfa dE_MEP / (gamma mu), con dE_MEP la barrera del camino de mínima energía entre los dos estados, porque todo camino debe subir al menos hasta ahí, y la cota vale a todo tiempo de conmutación. Para un sitio uniaxial dE = K y el piso es exactamente Phi_inf, así que ahí es ajustado. El camino de mínima energía se halla con el método de la cuerda con imagen escaladora sobre el producto de esferas, con un paso escalado por el límite de estabilidad del modo más rígido, 2 + 2 z J / K con z = 2 en una cadena y 4 en un parche: un paso fijo de 0,02 cruzaba ese límite justo sobre J/K = 24 y devolvía barreras sin converger de 1,5 a 43 veces la energía de pared del continuo. Con J/K = 10 la barrera de la cadena satura en 8,867 K, contra la energía de pared de Bloch del continuo 2 raíz(2 J K) = 8,944 K, y el caso C22 mide que el déficit cae como 0,043 sobre el ancho de pared al cuadrado, que es lo que parece un resultado exacto de red convergiendo a un límite continuo cerrado.'
          : 'A rigorous floor bounds the answer from below. Dotting the inverted equation with the velocity, the internal field does work at the rate of the site’s energy change, mu b . s_p = dE/dt + mu (alpha / gamma) |s_p|^2; only the component of the field along the velocity enters, and on any stretch where the energy rises the inequality of the means gives |b|^2 >= (4 alpha / (gamma mu)) dE/dt. Summed over sites and integrated over the rise, every reversal costs at least 4 alpha dE_MEP / (gamma mu), with dE_MEP the barrier of the minimum energy path between the two states, because every path must climb at least that high, and the bound holds at every switching time. For one uniaxial site dE = K and the floor is exactly Phi_inf, so it is tight there. The minimum energy path is found by the climbing-image string method on the product of spheres, with a step scaled by the stability limit of the stiffest mode, 2 + 2 z J / K with z = 2 on a chain and 4 on a patch: a fixed step of 0.02 crossed that limit just above J/K = 24 and returned unconverged barriers 1.5 to 43 times the continuum wall energy. At J/K = 10 the chain barrier saturates at 8.867 K, against the continuum Bloch-wall energy 2 sqrt(2 J K) = 8.944 K, and case C22 measures the deficit falling as 0.043 over the wall width squared, which is what an exact lattice result converging on a closed continuum limit looks like.'}{' '}
        <Cite id="e2007string" /> <Cite id="bessarab2015" />
      </p>
      <Equation
        tex={String.raw`\mu\,\vec b\cdot\dot{\vec s} = \frac{dE}{dt} + \mu\frac{\alpha}{\gamma}|\dot{\vec s}|^2 \;\Rightarrow\; |\vec b|^2 \ge \frac{4\alpha}{\gamma\mu}\frac{dE}{dt} \;\Rightarrow\; \Phi \ge \frac{4\alpha}{\gamma\mu}\,\Delta E_{\mathrm{MEP}}`}
        caption={es ? 'El piso de barrera: riguroso a todo tiempo de conmutación, ajustado para un solo sitio uniaxial, no garantizado ajustado para una pared.' : 'The barrier floor: rigorous at every switching time, tight for a single uniaxial site, not guaranteed tight for a wall.'}
      />
      <p>
        {es
          ? 'El resultado, manuscrito M2 en su versión 2 y caso C19: por sobre una longitud de cruce y a tiempo de conmutación largo, la inversión óptima es una pared de dominio que nuclea en un extremo abierto y barre la cadena, estrictamente más barata que la rotación uniforme. Con J/K = 10, alfa = 0,1 y T = 150 tau0 la razón al óptimo uniforme es 0,864 con N = 12 y 0,899 con N = 16, que baja a 0,838 al refinar a 600 imágenes; el óptimo uniforme deja de ser un mínimo local en N = 16, donde una perturbación de 0,05 rad deriva bajo la cota y lejos de la uniformidad. La trayectoria de N = 16 se verificó de tres maneras independientes antes de creerla: refinamiento de malla, donde un artefacto de discretización se encogería y este ahorro creció; consistencia local, integrando cada intervalo bajo su propio campo con 50 subpasos de RK4, con un error máximo de 4,1e-3, del mismo orden que el del óptimo uniforme sobre la misma malla; y dinámica a lazo abierto, aplicando los campos recuperados a la cadena desde el estado inicial, donde los 16 sitios llegan a s_z = -1,000. Con N = 24 y 32 ninguna semilla halló una trayectoria bajo la cota dentro del presupuesto, y eso se reporta como no hallado, no como uniforme óptimo; el piso deja espacio para ahorros de hasta 73 por ciento ahí, y sobre la malla barrida el ahorro llega a 51 por ciento. En dos dimensiones, casos C20 y C21, el cruce sigue el ancho de pared: la pared angosta de J/K = 2,5, de 1,12 sitios, gana ya en el parche de lado 4, con 0,9412, donde la ancha todavía invierte coherentemente, lo contrario de lo que el caso declaró antes de calcular. Esto reemplaza la comparación de dos modos, que fijaba una pared de velocidad constante de antemano y por eso no podía hallar el cruce.'
          : 'The result, manuscript M2 in its version 2 and case C19: above a crossover length and at long switching time, the optimal reversal is a domain wall that nucleates at an open end and sweeps the chain, strictly cheaper than uniform rotation. At J/K = 10, alpha = 0.1 and T = 150 tau0 the ratio to the uniform optimum is 0.864 at N = 12 and 0.899 at N = 16, falling to 0.838 when refined to 600 images; the uniform optimum stops being a local minimum at N = 16, where a 0.05 rad perturbation drifts below the bound and away from uniformity. The N = 16 trajectory was verified three independent ways before being believed: grid refinement, under which a discretization artifact would shrink and this saving grew; local consistency, integrating each interval under its own field with 50 RK4 substeps, at a maximum error of 4.1e-3, the same order as the uniform optimum’s on the same grid; and open-loop dynamics, applying the recovered fields to the chain from the initial state, where all 16 sites reach s_z = -1.000. At N = 24 and 32 no seed found a trajectory under the bound within the budget, and that is reported as not found, not as uniform being optimal; the floor leaves room for savings of up to 73 per cent there, and over the swept grid the saving reaches 51 per cent. In two dimensions, cases C20 and C21, the crossover tracks the wall width: the narrow wall of J/K = 2.5, 1.12 sites wide, wins already on the patch of side 4, at 0.9412, where the wide one still reverses coherently, the opposite of what the case declared before computing. This supersedes the two-mode comparison, which fixed a constant-speed wall in advance and therefore could not find the crossover.'}
      </p>
      <p>
        {es
          ? 'Dos rungs miran más allá de una sola corrida. R14, el frente de compromisos de dispositivo, evalúa la familia analítica sobre cuatro objetivos a la vez, tiempo de conmutación, costo, campo pico y ancho espectral al 99 por ciento, sobre 24 tiempos logarítmicos de 0,5 a 200 tau0 por material: el costo y el campo pico caen como 1/T, pendientes ajustadas -1,00 y -0,96, pero el ancho de banda no, pendiente -0,32 con gran residuo, y sobre CrSBr hay 11 pares donde el protocolo más lento exige la banda más ancha, el peor 1,54 veces; con el plazo fijo solo un punto de 24 sobrevive. R15, la política amortizada del caso C26, es un perceptrón de dos capas en numpy que mapea el amortiguamiento y el logaritmo del tiempo al logaritmo del parámetro de forma de la solución cerrada: regresar sobre el perfil crudo del pulso falló, porque un ajuste de mínimos cuadrados queda unos por ciento demasiado débil y no invierte, mientras que cualquier valor del parámetro de forma da un pulso óptimo genuino para un tiempo levemente distinto. Sobre combinaciones de parámetros que nunca vio emite pulsos que invierten a un costo dentro de cerca del diez por ciento del óptimo analítico, la compuerta declarada de antemano, y el registro de modelos guarda su punto de control, sus materiales de entrenamiento y los retenidos, con el rango de amortiguamiento de estos excluido porque cuatro de los seis materiales comparten el mismo amortiguamiento asumido.'
          : 'Two rungs look past a single solve. R14, the device trade-off front, evaluates the analytic family on four objectives at once, switching time, cost, peak field and 99 per cent spectral width, over 24 log-spaced times from 0.5 to 200 tau0 per material: the cost and the peak field fall like 1/T, fitted slopes -1.00 and -0.96, but the bandwidth does not, slope -0.32 with a large residual, and on CrSBr there are 11 pairs where the slower protocol demands the wider band, the worst by 1.54 times; with the deadline fixed only one point of 24 survives. R15, the amortized policy of case C26, is a two-layer perceptron in numpy mapping the damping and the log switching time to the log shape parameter of the closed-form solution: regressing onto the raw pulse profile failed, because a least-squares fit is a few per cent too weak and does not reverse, whereas any value of the shape parameter yields a genuine optimal pulse for a slightly different time. On parameter combinations it never saw it emits pulses that reverse at a cost within about ten per cent of the analytic optimum, the pre-declared gate, and the model registry records its checkpoint, its training and held-out materials, with the held-out damping range excluded because four of the six materials share the same assumed damping.'}{' '}
        <Cite id="amortized2025" />
      </p>
      <Equation
        tex={String.raw`\Delta E_{\mathrm{wall}}^{\mathrm{cont}} = 2\sqrt{2JK},\qquad 1-\frac{\Delta E_{\mathrm{lattice}}}{\Delta E^{\mathrm{cont}}_{\mathrm{wall}}} \approx \frac{0.043}{w^2},\quad w^2 = \frac{J}{2K}`}
        caption={es ? 'La energía de pared del continuo y la corrección de discretización medida en el caso C22, de una a doce sitios por ancho de pared.' : 'The continuum wall energy and the discreteness correction measured in case C22, from one to twelve sites per wall width.'}
      />
      <Figure caption={es ? 'Arriba: los dos modos de inversión de una cadena. Abajo: el cruce medido de la cadena libre, con las dos celdas bajo la cota uniforme y la fila del piso de barrera.' : 'Top: the two reversal modes of a chain. Bottom: the measured crossover of the free chain, with the two cells under the uniform bound and the barrier-floor row.'}>
        <LatticeDiagram lang={lang} />
      </Figure>
      <Callout variant="honest" title={es ? 'Acotado, no ubicado' : 'Bracketed, not located'}>
        <p>
          {es
            ? 'La cadena y el parche están en unidades reducidas: se convierten a un material solo a través de un intercambio y una anisotropía medidos juntos, que ninguno de los materiales de este producto tiene. Cada razón es el costo de una trayectoria factible explícita, una cota superior válida aunque el optimizador se haya detenido en su tope de iteraciones; el piso es una cota inferior rigurosa; el óptimo verdadero está entre ambos y nunca se declara ubicado. Los conteos de retención de la pestaña de explotabilidad multiplican la anisotropía de un sitio por el número de sitios, la barrera de una inversión coherente, que es el extremo optimista: un elemento por sobre el tamaño de cruce invierte por una pared cuya barrera satura en la energía de pared.'
            : 'The chain and the patch are in reduced units: they convert to a material only through an exchange and an anisotropy measured together, which none of this product’s materials has. Every ratio is the cost of an explicit feasible trajectory, an upper bound that holds even where the optimizer stopped at its iteration cap; the floor is a rigorous lower bound; the true optimum lies between them and is never stated as located. The retention counts of the exploitability tab multiply a single site’s anisotropy by the number of sites, the barrier of a coherent reversal, which is the optimistic end: an element above the crossover size reverses through a wall whose barrier saturates at the wall energy.'}
        </p>
      </Callout>
      <Refs ids={['badarneh2023', 'kwiatkowski2021', 'e2007string', 'bessarab2015', 'amortized2025']} label="Refs" />
    </div>
  );
}

/* ------------------------------------------------------------------------------------------------ */

export function Methodology(): React.JSX.Element {
  const lang = useShellLang();
  const es = lang === 'es';
  return (
    <article className="prose page-body">
      <div className="page-head">
        <h1>{es ? 'Metodología' : 'Methodology'}</h1>
        <p className="lede">
          {es ? (
            <>
              {'Seis familias de métodos, ordenadas por lo que cada una supone: un problema y sus unidades, las soluciones exactas del macrospin uniaxial y del torque de espín-órbita, las trayectorias numéricas donde no hay forma cerrada, los pulsos realizables bajo un tope de amplitud o de ancho de banda, la fiabilidad a temperatura y lo que cuesta comprarla, y la inversión más allá de un solo momento. Cada pestaña transcribe sus fuentes primarias, escribe las ecuaciones que el motor evalúa y dice qué midió este producto con ellas, incluidos los defectos que encontró. El costo es siempre '}
              <InlineMath tex={String.raw`\Phi = \int_0^T |\vec b|^2\,dt`} />
              {' en tesla al cuadrado por segundo; ninguna cifra de esta página es un julio.'}
            </>
          ) : (
            <>
              {'Six method families, ordered by what each one assumes: a problem and its units, the exact solutions of the uniaxial macrospin and of spin-orbit torque, the numerical paths where no closed form exists, realizable pulses under an amplitude cap or a bandwidth, reliability at temperature and what buying it costs, and reversal beyond a single moment. Each tab transcribes its primary sources, writes the equations the engine evaluates and says what this product measured with them, the defects it found included. The cost is always '}
              <InlineMath tex={String.raw`\Phi = \int_0^T |\vec b|^2\,dt`} />
              {' in tesla squared second; no figure on this page is a joule.'}
            </>
          )}
        </p>
      </div>
      <SubTabs
        ariaLabel={es ? 'familias de métodos' : 'method families'}
        orientation="vertical"
        initial="problem"
        tabs={[
          { id: 'problem', label: es ? 'El problema y sus unidades' : 'The problem and its units', content: <Problem lang={lang} /> },
          { id: 'closed', label: es ? 'Soluciones exactas (R05, R06)' : 'Exact solutions (R05, R06)', content: <ClosedForms lang={lang} /> },
          { id: 'numerical', label: es ? 'Trayectorias numéricas y el eje duro (R07)' : 'Numerical paths and the hard axis (R07)', content: <NumericalPaths lang={lang} /> },
          { id: 'realizable', label: es ? 'Pulsos realizables (R08, R09, R10, R13)' : 'Realizable pulses (R08, R09, R10, R13)', content: <Realizable lang={lang} /> },
          { id: 'reliability', label: es ? 'Fiabilidad a temperatura (R11, R12)' : 'Reliability at temperature (R11, R12)', content: <Reliability lang={lang} /> },
          { id: 'lattice', label: es ? 'Más allá del macrospin (R14, R15, R16)' : 'Beyond the macrospin (R14, R15, R16)', content: <BeyondMacrospin lang={lang} /> },
        ]}
      />
    </article>
  );
}

// The two published replications, C10 and C05, drawn against the numbers their sources print.
//
// A product that only ever agrees with itself is not evidence of anything. These two cases are the
// place where this one is checked against other people's published values, so the comparison belongs
// in the app and not only in the wiki: two charts, ours and theirs on the same axes, and the tables
// the charts are drawn from, including the point that does not reproduce and the one where the source
// contradicts itself.
//
// Interactive (uPlot): hover for values, click a legend entry to solo or hide a series. Sized by a
// ResizeObserver so a hidden tab does not fix the width.

import { useCallback, useEffect, useMemo, useRef } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import type { CaseArtifact, CostRow, MethodBlock } from '../data/contract';
import { decadeRange, logDecadeTicks } from './logTicks';
import { recordPlotAxes } from './axisLabels';

interface Props {
  kickoff: CaseArtifact;
  biaxial: CaseArtifact;
  theme: 'light' | 'dark';
  es: boolean;
}

const HEIGHT = 340;
const OURS = '#3b82f6';
const THEIRS = '#ef4444';
const ALTERNATIVE = '#f59e0b';

function cssVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

const plain = (_u: uPlot, v: number | null) => (v == null ? '-' : String(Number(v.toPrecision(4))));
const block = (row: CostRow, method: string): MethodBlock => row[method] as MethodBlock;
const num = (row: CostRow, method: string, key: string): number | null => {
  const value = block(row, method)?.[key];
  return typeof value === 'number' ? value : null;
};

/** One uPlot chart, rebuilt only when its data, its options or the theme actually change. The data and
 * the options are memoized by the caller: passing fresh ones each render would tear the chart down and
 * rebuild it on every render of the page, which it did in the first version of this component. */
function useChart(
  data: uPlot.AlignedData,
  options: (stroke: string, grid: string, host: HTMLElement) => uPlot.Options,
  theme: 'light' | 'dark',
): React.RefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement>(null);
  const plot = useRef<uPlot | null>(null);
  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    const stroke = cssVar('--color-fg', theme === 'dark' ? '#e8e8e8' : '#1a1a1a');
    const grid = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
    const opts = options(stroke, grid, host);
    opts.width = Math.max(host.clientWidth, 280);
    plot.current?.destroy();
    plot.current = new uPlot(opts, data, host);
    recordPlotAxes(host, opts);
    const observer = new ResizeObserver(() => {
      if (host.clientWidth > 0) plot.current?.setSize({ width: host.clientWidth, height: HEIGHT });
    });
    observer.observe(host);
    return () => {
      observer.disconnect();
      plot.current?.destroy();
      plot.current = null;
    };
  }, [data, options, theme]);
  return ref;
}

export function Replications({ kickoff, biaxial, theme, es }: Props): React.JSX.Element {
  const kickoffRows = [...kickoff.cost_curve].sort((a, b) => a.variant - b.variant);
  const biaxialRows = [...biaxial.cost_curve].sort((a, b) => a.variant - b.variant);

  // C10: the peak amplitude of the optimal pulse at the times the source quotes. Both axes are
  // logarithmic because the quoted points span four picoseconds to two nanoseconds and four tesla to
  // ten millitesla; a linear axis would draw three of the four points on top of each other.
  const kickoffData = useMemo(() => {
    const rows = [...kickoff.cost_curve].sort((a, b) => a.variant - b.variant);
    return [
      rows.map((r) => r.variant),
      rows.map((r) => num(r, 'r05', 'peak_field_t')),
      rows.map((r) => num(r, 'r05', 'published_peak_field_t')),
      rows.map((r) => num(r, 'r05', 'published_alternative_t')),
    ] as unknown as uPlot.AlignedData;
  }, [kickoff]);
  // Whole decades around every plotted value, so the lowest published point (9.6 mT) is inside the
  // frame rather than sitting on it.
  const kickoffRangeX = useMemo(() => decadeRange(kickoffData[0] as number[]), [kickoffData]);
  const kickoffRangeY = useMemo(
    () => decadeRange((kickoffData.slice(1) as (number | null)[][]).flat()),
    [kickoffData],
  );

  const kickoffOptions = useCallback(
    (stroke: string, grid: string, host: HTMLElement): uPlot.Options => ({
      width: 600,
      height: HEIGHT,
      scales: {
        x: { time: false, distr: 3, range: kickoffRangeX },
        y: { distr: 3, range: kickoffRangeY },
      },
      axes: [
        {
          label: es ? 'tiempo de conmutación (ps)' : 'switching time (ps)',
          stroke,
          grid: { stroke: grid },
          ticks: { stroke: grid },
          // Decades labelled, minors left as grid lines, and what was drawn recorded on the host for
          // the gate. The first version labelled every minor and printed "500600708090000".
          values: logDecadeTicks(host, 'x'),
        },
        {
          label: es ? 'campo pico (T)' : 'peak field (T)',
          stroke,
          grid: { stroke: grid },
          ticks: { stroke: grid },
          values: logDecadeTicks(host, 'y'),
        },
      ],
      series: [
        { label: es ? 'tiempo de conmutación (ps)' : 'switching time (ps)', value: plain },
        {
          label: es ? 'este producto' : 'this product',
          stroke: OURS,
          width: 2,
          points: { show: true, size: 8 },
          value: plain,
        },
        {
          label: es ? 'publicado' : 'published',
          stroke: THEIRS,
          width: 0,
          points: { show: true, size: 10 },
          value: plain,
        },
        {
          label: es ? 'publicado (valor alternativo)' : 'published (alternative value)',
          stroke: ALTERNATIVE,
          width: 0,
          points: { show: true, size: 10 },
          value: plain,
        },
      ],
      legend: { show: true },
    }),
    [es, kickoffRangeX, kickoffRangeY],
  );
  const kickoffRef = useChart(kickoffData, kickoffOptions, theme);

  // C05: the published thermal-robustness table, both dampings, ours drawn as lines and theirs as
  // points on the same axis.
  const biaxialData = useMemo(() => {
    const rows = [...biaxial.cost_curve].sort((a, b) => a.variant - b.variant);
    return [
      rows.map((r) => r.variant),
      rows.map((r) => num(r, 'r11', 'success_rate_alpha_0p01')),
      rows.map((r) => num(r, 'r11', 'published_rate_alpha_0p01')),
      rows.map((r) => num(r, 'r11', 'success_rate_alpha_0p1')),
      rows.map((r) => num(r, 'r11', 'published_rate_alpha_0p1')),
    ] as unknown as uPlot.AlignedData;
  }, [biaxial]);

  // The floor follows the data rather than a constant: a fixed 0.9 would clip, without a word, any
  // future cell that came out below it, and a replication chart is the last place to hide a point.
  const biaxialFloor = useMemo(() => {
    const rates = (biaxialData.slice(1) as (number | null)[][])
      .flat()
      .filter((v): v is number => v != null && Number.isFinite(v));
    const lowest = rates.length ? Math.min(...rates) : 0.9;
    return Math.min(0.9, Math.floor(lowest * 100) / 100 - 0.01);
  }, [biaxialData]);

  const biaxialOptions = useCallback(
    (stroke: string, grid: string): uPlot.Options => ({
      width: 600,
      height: HEIGHT,
      scales: { x: { time: false }, y: { range: [biaxialFloor, 1.005] } },
      axes: [
        {
          label: es ? 'barrera / energía térmica  K/kT' : 'barrier over thermal energy  K/kT',
          stroke,
          grid: { stroke: grid },
          ticks: { stroke: grid },
          values: (_u, splits) => splits.map((v) => String(Number(v.toPrecision(3)))),
        },
        {
          label: es ? 'tasa de éxito' : 'success rate',
          stroke,
          grid: { stroke: grid },
          ticks: { stroke: grid },
          values: (_u, splits) => splits.map((v) => String(Number(v.toPrecision(4)))),
        },
      ],
      series: [
        { label: 'K/kT', value: plain },
        {
          label: es ? 'este producto, alfa = 0.01' : 'this product, alpha = 0.01',
          stroke: OURS,
          width: 2,
          points: { show: true, size: 7 },
          value: plain,
        },
        {
          label: es ? 'publicado, alfa = 0.01' : 'published, alpha = 0.01',
          stroke: THEIRS,
          width: 0,
          points: { show: true, size: 10 },
          value: plain,
        },
        {
          label: es ? 'este producto, alfa = 0.1' : 'this product, alpha = 0.1',
          stroke: OURS,
          width: 2,
          dash: [6, 4],
          points: { show: true, size: 7 },
          value: plain,
        },
        {
          label: es ? 'publicado, alfa = 0.1' : 'published, alpha = 0.1',
          stroke: ALTERNATIVE,
          width: 0,
          points: { show: true, size: 10 },
          value: plain,
        },
      ],
      legend: { show: true },
    }),
    [es, biaxialFloor],
  );
  const biaxialRef = useChart(biaxialData, biaxialOptions, theme);

  const quoted = kickoffRows.filter((r) => num(r, 'r05', 'published_peak_field_t') != null);
  const worst = Math.max(...quoted.map((r) => Math.abs((num(r, 'r05', 'ratio_to_published') ?? 1) - 1)));
  const published = biaxialRows.filter((r) => num(r, 'r11', 'published_rate_alpha_0p01') != null);

  return (
    <div className="prose" data-testid="replications">
      <p>
        {es
          ? 'Un producto que solo se pone de acuerdo consigo mismo no es evidencia de nada. Estos dos casos comparan sus resultados con números que publicaron otras personas, en sus propios ajustes, y registran tanto lo que se reproduce como lo que no.'
          : 'A product that only ever agrees with itself is not evidence of anything. These two cases compare its results against numbers other people published, at their own settings, and record both what reproduces and what does not.'}
      </p>

      <h3>{es ? 'C10: los campos pico del artículo de origen' : "C10: the kickoff paper's peak fields"}</h3>
      <div ref={kickoffRef} data-testid="kickoff-chart" style={{ width: '100%' }} />
      <div className="table-wrap">
        <table data-testid="kickoff-table" data-worst-deviation={worst.toFixed(4)}>
          <thead>
            <tr>
              <th>{es ? 'Tiempo' : 'Time'}</th>
              <th>{es ? 'Este producto' : 'This product'}</th>
              <th>{es ? 'Publicado' : 'Published'}</th>
              <th>{es ? 'Razón' : 'Ratio'}</th>
            </tr>
          </thead>
          <tbody>
            {quoted.map((row) => (
              <tr key={row.variant} data-variant={row.variant}>
                <td>{row.variant} ps</td>
                <td>{(num(row, 'r05', 'peak_field_t') ?? 0).toPrecision(4)} T</td>
                <td>
                  {(num(row, 'r05', 'published_peak_field_t') ?? 0).toPrecision(3)} T
                  {num(row, 'r05', 'published_alternative_t') != null
                    ? ` (${es ? 'o' : 'or'} ${num(row, 'r05', 'published_alternative_t')} T)`
                    : ''}
                </td>
                <td>{(num(row, 'r05', 'ratio_to_published') ?? 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted">
        {es
          ? 'Tres de los cuatro puntos citados se reproducen dentro del 3 por ciento. El cuarto necesita un amortiguamiento cercano a 0.001, dentro del rango que el propio artículo declara para esta familia, y se muestra tal cual en lugar de omitirse. En 126 ps la fuente se contradice: dice 0.11 T en una sección y 150 mT en otra, y el caso lleva ambos valores. Las energías no se replican, porque la constante que convierte un costo en T^2 s a los julios que imprime no se puede reconstruir del texto.'
          : 'Three of the four quoted points reproduce within 3 per cent. The fourth needs a damping near 0.001, inside the range the paper itself states for this family, and it is shown as it is rather than dropped. At 126 ps the source contradicts itself, saying 0.11 T in one section and 150 mT in another, and the case carries both. The energies are not replicated, because the constant that turns a cost in T^2 s into the joules it prints cannot be reconstructed from the text.'}
      </p>

      <h3>{es ? 'C05: la tabla térmica del artículo biaxial' : "C05: the biaxial paper's thermal table"}</h3>
      <div ref={biaxialRef} data-testid="biaxial-chart" style={{ width: '100%' }} />
      <div className="table-wrap">
        <table data-testid="biaxial-table">
          <thead>
            <tr>
              <th>K/kT</th>
              <th>{es ? 'Aquí, alfa = 0.01' : 'Here, alpha = 0.01'}</th>
              <th>{es ? 'Publicado' : 'Published'}</th>
              <th>{es ? 'Aquí, alfa = 0.1' : 'Here, alpha = 0.1'}</th>
              <th>{es ? 'Publicado' : 'Published'}</th>
            </tr>
          </thead>
          <tbody>
            {published.map((row) => (
              <tr key={row.variant} data-variant={row.variant}>
                <td>{row.variant}</td>
                <td>{((num(row, 'r11', 'success_rate_alpha_0p01') ?? 0) * 100).toFixed(1)}</td>
                <td>{((num(row, 'r11', 'published_rate_alpha_0p01') ?? 0) * 100).toFixed(1)}</td>
                <td>{((num(row, 'r11', 'success_rate_alpha_0p1') ?? 0) * 100).toFixed(1)}</td>
                <td>{((num(row, 'r11', 'published_rate_alpha_0p1') ?? 0) * 100).toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted">
        {es
          ? 'Las ocho celdas publicadas se reproducen dentro del intervalo de Monte Carlo de 1000 copias. A amortiguamiento 0.01 este caso devolvía primero 100 por ciento en todas las celdas, lo que parecía una no replicación del trabajo ajeno; la causa era propia, una equilibración diez veces demasiado corta, porque alcanzar una distribución de Boltzmann toma un tiempo de disipación, tau0 sobre el amortiguamiento. Cada celda registra ahora la dispersión de la que parte.'
          : 'All eight published cells reproduce within the Monte-Carlo interval of 1,000 copies. At a damping of 0.01 this case first returned 100 per cent in every cell, which read like a non-replication of someone else’s work; the cause was ours, an equilibration ten times too short, because reaching a Boltzmann distribution takes a dissipation time, tau0 over the damping. Every cell now records the spread it starts from.'}
      </p>
    </div>
  );
}

// Benchmark: the honest comparison, optimal against conventional, from the committed artifacts only.
// Five tabs (ADR-0017, ADR-0071 section 5): the reduction per case with an interactive chart, the complete
// method matrix, every method against the closed-form oracle, the release evidence bound by hash, and what
// the number is and is not. Nothing here is typed in: every cell is read from benchmark.json or a case
// artifact, and e2e/benchmark.mjs holds the tables to the artifact.

import { useEffect, useMemo, useState } from 'react';
import { useShellLang, Tabs, Callout } from '@fasl-work/caos-app-shell';
import type { ArtifactIndex, Benchmark as BenchmarkArtifact, CaseArtifact } from '../data/contract';
import { loadBenchmark, loadCase, loadIndex } from '../data/load';
import { DataText, tr } from '../content/dataText';
import { ReductionChart } from '../viz/ReductionChart';
import { isNegativeControl } from '../data/negativeControl';
import { useTheme } from '../theme';

interface MethodSummary {
  method: string;
  cases: number;
  produced: number;
  cells: number;
  notApplicable: number;
  worstRatio: number | null;
  bestCost: number | null;
}

/** One row per rung across every case that declares it, from the benchmark artifact. */
function summarizeMethods(benchmark: BenchmarkArtifact): MethodSummary[] {
  const byMethod = new Map<string, MethodSummary>();
  for (const c of benchmark.cases) {
    for (const m of c.methods) {
      const row = byMethod.get(m.method) ?? { method: m.method, cases: 0, produced: 0, cells: 0, notApplicable: 0, worstRatio: null, bestCost: null };
      row.cases += 1;
      row.produced += m.produced;
      row.cells += m.cells;
      row.notApplicable += m.not_applicable;
      if (m.worst_ratio_to_oracle !== null && (row.worstRatio === null || m.worst_ratio_to_oracle > row.worstRatio)) row.worstRatio = m.worst_ratio_to_oracle;
      if (m.best_cost !== null && (row.bestCost === null || m.best_cost < row.bestCost)) row.bestCost = m.best_cost;
      byMethod.set(m.method, row);
    }
  }
  return [...byMethod.values()].sort((a, b) => a.method.localeCompare(b.method));
}

export function Benchmark(): React.JSX.Element {
  const lang = useShellLang();
  const es = lang === 'es';
  const { theme } = useTheme();
  const [index, setIndex] = useState<ArtifactIndex | null>(null);
  const [artifacts, setArtifacts] = useState<CaseArtifact[]>([]);
  const [benchmark, setBenchmark] = useState<BenchmarkArtifact | null>(null);

  useEffect(() => {
    loadIndex().then(async (ix) => {
      setIndex(ix);
      setArtifacts(await Promise.all(ix.cases.map((c) => loadCase(c.slug))));
    });
    loadBenchmark().then(setBenchmark);
  }, []);

  const methods = useMemo(() => (benchmark ? summarizeMethods(benchmark) : []), [benchmark]);

  if (!index || !benchmark || artifacts.length === 0) return <p style={{ padding: 24 }}>{es ? 'Cargando...' : 'Loading...'}</p>;

  // The negative control (an antiferromagnet under the ferromagnetic model) is listed in the table with its
  // warning, but it is neither counted in the summary nor plotted: its factor is not a result about a material.
  const fieldCases = artifacts.filter((a) => a.observable.is_field_cost && !isNegativeControl(a));
  const nonFieldCost = artifacts
    .filter((a) => !a.observable.is_field_cost)
    .sort((a, b) => a.case.code.localeCompare(b.case.code, 'en', { numeric: true }));
  const switched = fieldCases.filter((a) => a.static_baseline.static_switched);
  const factors = switched.map((a) => a.static_baseline.reduction_factor ?? 0).filter((f) => f > 0);
  // toFixed(0) printed the smallest factor, 3.35, as "3x"; three significant digits keep it readable.
  const fmtFactor = (f: number) => Number(f.toPrecision(3)).toString();
  const minFactor = factors.length ? Math.min(...factors) : null;
  const maxFactor = factors.length ? Math.max(...factors) : null;

  const reduction = (
    <div className="prose">
      <p>
        {es
          ? 'El pulso óptimo frente al campo estático convencional, para el mismo tiempo de conmutación y el mismo material, con el mismo motor y la misma función de costo. Es la única comparación estrictamente justa: la línea base es 1,2 veces el campo de conmutación de Stoner-Wohlfarth sostenido durante toda la ventana e integrado con la misma ecuación de movimiento, el protocolo que un dispositivo usaría si nadie hubiera hecho control óptimo. Cada punto es un caso leído de su artefacto; pase el cursor para leer el factor de reducción.'
          : 'The optimal pulse against the conventional static field, for the same switching time and material, with the same engine and the same cost functional. It is the only strictly fair comparison: the baseline is 1.2 times the Stoner-Wohlfarth switching field held for the whole window and integrated with the same equation of motion, the protocol a device would use if nobody had done any optimal control. Every point is a case read from its artifact; hover to read the reduction factor.'}
      </p>
      <p className="muted" data-testid="reduction-summary">
        {switched.length} {es ? 'de' : 'of'} {fieldCases.length} {es ? 'casos con costo de campo invierten bajo el campo estático' : 'field-cost cases reverse under the static field'}
        {minFactor !== null && maxFactor !== null ? ` · ${es ? 'factores de reducción de' : 'reduction factors from'} ${fmtFactor(minFactor)}x ${es ? 'a' : 'to'} ${fmtFactor(maxFactor)}x` : ''}
      </p>
      <div className="bench-chart-box">
        <ReductionChart artifacts={artifacts} theme={theme} es={es} />
      </div>
      <div className="table-wrap">
        <table data-testid="reduction-table">
          <thead>
            <tr>
              <th>{es ? 'Caso' : 'Case'}</th>
              <th>{es ? 'Sistema' : 'System'}</th>
              <th>{es ? 'Costo óptimo' : 'Optimal cost'}</th>
              <th>{es ? 'Costo estático' : 'Static cost'}</th>
              <th>{es ? 'Factor de reducción' : 'Reduction factor'}</th>
            </tr>
          </thead>
          <tbody>
            {artifacts.map((a) => {
              const sb = a.static_baseline;
              const fieldCost = a.observable.is_field_cost;
              const negative = isNegativeControl(a);
              return (
                <tr key={a.case.slug} data-case={a.case.slug} data-negative-control={negative ? 'true' : undefined}>
                  <td>
                    <code>{a.case.code}</code> <DataText text={a.case.title} />
                    {negative && (
                      <span className="negative-control-tag" role="note" data-testid="reduction-negative-control">
                        {es
                          ? ' · control negativo: el modelo de macrospin no se aplica a un antiferromagneto; estos números no son una predicción'
                          : ' · negative control: the macrospin model does not apply to an antiferromagnet; these numbers are not a prediction'}
                      </span>
                    )}
                  </td>
                  <td>{tr(a.material.name, es)}</td>
                  <td>{fieldCost ? sb.optimal_cost.toExponential(2) : tr(a.observable.label, es)}</td>
                  {/* A case that reports no field cost (C10 reports a peak field, C05 and C07 a success rate)
                      has no field cost to set against the static protocol's: its static cost and factor are
                      not shown. C10 used to read 9370x here, outside the range quoted above the chart. */}
                  <td>{!fieldCost ? '-' : sb.static_switched ? sb.static_cost.toExponential(2) : es ? 'sin inversión' : 'no reversal'}</td>
                  {/* Only a static field that reversed the moment is a baseline to be reduced against. */}
                  <td data-testid="reduction-factor" data-case={a.case.slug}>
                    {fieldCost && sb.static_switched && sb.reduction_factor ? `${Number(sb.reduction_factor.toPrecision(3))}x${negative ? '*' : ''}` : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const matrix = (
    <div className="prose">
      <p>
        {es
          ? 'Cada método que un caso declara corre sobre cada variante, o dice por qué no puede. Una celda que falta es un fallo de la versión, no un promedio más corto: la etapa de validación cuenta las celdas producidas más las no aplicables contra las declaradas y rechaza una matriz incompleta. La razón frente al oráculo es el costo numérico dividido por la solución analítica: uno cuando coinciden.'
          : 'Every method a case declares runs over every variant, or says why it cannot. A missing cell fails the release rather than shortening an average: the validate stage counts the cells produced plus the not-applicable ones against the declared ones and refuses an incomplete matrix. The ratio to the oracle is the numerical cost over the closed form: one when they agree.'}
      </p>
      <p className="muted" data-testid="benchmark-summary">
        {es ? 'Motor' : 'Engine'} {benchmark.engine.name} {benchmark.engine.version} &middot; {benchmark.cases.length} {es ? 'casos' : 'cases'} &middot;{' '}
        {benchmark.complete ? (es ? 'matriz completa' : 'matrix complete') : es ? 'matriz INCOMPLETA' : 'matrix INCOMPLETE'}
      </p>
      <div className="table-wrap">
        <table data-testid="method-matrix">
          <thead>
            <tr>
              <th>{es ? 'Caso' : 'Case'}</th>
              <th>{es ? 'Método' : 'Method'}</th>
              <th>{es ? 'Celdas' : 'Cells'}</th>
              <th>{es ? 'Mejor costo' : 'Best cost'}</th>
              <th>{es ? 'Peor razón al oráculo' : 'Worst ratio to oracle'}</th>
              <th>{es ? 'Nota' : 'Note'}</th>
            </tr>
          </thead>
          <tbody>
            {benchmark.cases.flatMap((c) =>
              c.methods.map((m) => (
                <tr key={`${c.case}-${m.method}`} data-case={c.case} data-method={m.method}>
                  <td>
                    <code>{c.case}</code>
                  </td>
                  <td>
                    <code>{m.method}</code>
                  </td>
                  <td>
                    {m.produced}/{m.cells}
                    {m.not_applicable > 0 && ` (${m.not_applicable} n/a)`}
                  </td>
                  <td>{m.best_cost === null ? '-' : m.best_cost.toExponential(2)}</td>
                  <td>{m.worst_ratio_to_oracle === null ? '-' : m.worst_ratio_to_oracle.toFixed(3)}</td>
                  <td className="muted">{m.notes ? <DataText text={m.notes} /> : '-'}</td>
                </tr>
              )),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const oracle = (
    <div className="prose">
      <p>
        {es
          ? 'La misma matriz, leída por método. Donde existe una forma cerrada, la solución uniaxial exacta o la de espín-órbita, cada método numérico se compara con ella en cada celda, y la peor razón sobre todos los casos que lo declaran es la medida de cuánto se puede confiar en él lejos de la forma cerrada: un solucionador que la reproduce a una parte en mil sobre el sistema uniaxial se usa después sobre el eje duro y la red, donde no hay nada con qué compararlo. Una razón mayor que uno en un método con restricción no es un error sino el precio de la restricción; una razón bajo uno en un método sin restricción sería un defecto del oráculo, y no aparece.'
          : 'The same matrix, read by method. Where a closed form exists, the exact uniaxial solution or the spin-orbit-torque one, every numerical method is compared with it on every cell, and the worst ratio over all the cases that declare it is the measure of how far it can be trusted away from the closed form: a solver that reproduces it to one part in a thousand on the uniaxial system is then used on the hard axis and the lattice, where there is nothing to compare it with. A ratio above one on a constrained method is not an error but the price of the constraint; a ratio below one on an unconstrained method would be a defect of the oracle, and none appears.'}
      </p>
      <div className="table-wrap">
        <table data-testid="oracle-table">
          <thead>
            <tr>
              <th>{es ? 'Método' : 'Method'}</th>
              <th>{es ? 'Casos' : 'Cases'}</th>
              <th>{es ? 'Celdas producidas' : 'Cells produced'}</th>
              <th>{es ? 'No aplicables' : 'Not applicable'}</th>
              <th>{es ? 'Mejor costo' : 'Best cost'}</th>
              <th>{es ? 'Peor razón al oráculo' : 'Worst ratio to oracle'}</th>
            </tr>
          </thead>
          <tbody>
            {methods.map((m) => (
              <tr key={m.method} data-method={m.method}>
                <td>
                  <code>{m.method}</code>
                </td>
                <td>{m.cases}</td>
                <td>
                  {m.produced}/{m.cells}
                </td>
                <td>{m.notApplicable}</td>
                <td>{m.bestCost === null ? '-' : m.bestCost.toExponential(2)}</td>
                <td>{m.worstRatio === null ? (es ? 'sin oráculo' : 'no oracle') : m.worstRatio.toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted">
        {es
          ? 'Un método sin oráculo es uno cuyo caso no tiene forma cerrada: el eje duro, la red, la política aprendida evaluada contra su propio óptimo. Sus números se sostienen en las comprobaciones de Implementación, no en esta columna.'
          : 'A method with no oracle is one whose case has no closed form: the hard axis, the lattice, the learned policy evaluated against its own optimum. Their numbers rest on the checks of Implementation, not on this column.'}
      </p>
    </div>
  );

  const evidence = (
    <div className="prose">
      <p>
        {es
          ? 'Cada artefacto está ligado por hash a un manifiesto que registra el caso y su contrato, el motor y su versión, la semilla, la partición, los métodos y cada fila de resultado, el tamaño en bytes y el sha256, el veredicto de carril medido, la completitud y las marcas del Contrato 1 de los parámetros que usó. La etapa de validación recalcula el hash desde el artefacto en disco y rechaza una versión cuyo artefacto no coincide con su manifiesto; una prueba demuestra que la comprobación falla sobre una copia alterada.'
          : 'Every artifact is bound by hash to a manifest recording the case and its contract, the engine and its version, the seed, the split, the methods and every result row, the byte size and the sha256, the measured lane verdict, the completeness and the Contract 1 flags of the parameters it used. The validate stage recomputes the hash from the artifact on disk and refuses a release whose artifact does not match its manifest; a test proves the check fails on a mutated copy.'}
      </p>
      <div className="table-wrap">
        <table data-testid="release-evidence">
          <thead>
            <tr>
              <th>{es ? 'Caso' : 'Case'}</th>
              <th>{es ? 'Carril' : 'Lane'}</th>
              <th>{es ? 'Completitud' : 'Completeness'}</th>
              <th>sha256</th>
            </tr>
          </thead>
          <tbody>
            {benchmark.manifests.map((m) => (
              <tr key={m.case} data-manifest={m.case}>
                <td>
                  <code>{m.code}</code> <code>{m.case}</code>
                </td>
                <td>{tr(m.lane, es)}</td>
                <td>
                  {m.completeness.produced + m.completeness.not_applicable}/{m.completeness.expected}
                  {m.completeness.missing > 0 && ` (${m.completeness.missing} ${es ? 'faltan' : 'missing'})`}
                </td>
                <td>
                  <code>{m.sha256.slice(0, 12)}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const honesty = (
    <div className="prose">
      <p>
        {es
          ? 'Un factor de reducción es una razón entre dos integrales de la misma clase, calculadas por el mismo motor sobre el mismo material. Lo que no es, en cuatro puntos, cada uno con su razón.'
          : 'A reduction factor is a ratio between two integrals of the same kind, computed by the same engine on the same material. What it is not, in four points, each with its reason.'}
      </p>
      <Callout variant="honest" title={es ? 'Qué es y qué no es este número' : 'What this number is and is not'}>
        <ul>
          <li>
            {es
              ? 'El costo es una integral en T^2 s, no una energía. Convertirlo en julios requiere una constante de circuito explícita en julios por tesla cuadrado segundo, que codifica la geometría del inductor, la resistencia y el acoplamiento al volumen magnético; el motor se niega a convertir sin ella.'
              : 'The cost is an integral in T^2 s, not an energy. Converting to joules requires an explicit circuit constant in joules per tesla squared second, which encodes the inductor geometry, the resistance and the coupling to the magnetic volume; the engine refuses to convert without one.'}
          </li>
          <li>
            {es
              ? 'El factor de reducción se cita frente a la línea base más fuerte disponible, nunca la más débil. Aquí la línea base es el campo estático a 1,2 veces el campo de conmutación; los protocolos de Sun-Wang, precesional y de microondas existen en el motor y no cambiarían el orden de magnitud.'
              : 'The reduction factor is quoted against the strongest baseline available, never the weakest. Here the baseline is the static field at 1.2 times the switching field; the Sun-Wang, precessional and microwave protocols exist in the engine and would not change the order of magnitude.'}
          </li>
          <li>
            {es
              ? 'Los números de dispositivos (STT, SOT, DRAM) son energías de celda, dominadas por el transistor de acceso y la interconexión; no son integrales de costo de conmutación, y comparar los dos es comparar dos objetos distintos.'
              : 'Device numbers (STT, SOT, DRAM) are cell energies, dominated by the access transistor and the interconnect; they are not switching-cost integrals, and comparing the two is comparing two different objects.'}
          </li>
          <li>
            {es
              ? 'El caso FePS3 es un control negativo: el material es un antiferromagneto, los números se calculan con el modelo de macrospin ferromagnético y muestran lo que devuelve la maquinaria cuando sus supuestos fallan, no cómo conmuta el material.'
              : 'The FePS3 case is a negative control: the material is an antiferromagnet, the numbers are computed with the ferromagnetic macrospin model and show what the machinery returns when its assumptions fail, not how the material switches.'}
          </li>
        </ul>
      </Callout>
      {/* Read from the artifacts: this paragraph said "two cases" (C03, C07) while six declare an
          observable that is not a field cost. */}
      <p data-testid="non-field-cost-cases">
        {es
          ? `${nonFieldCost.length} casos no reportan un costo de campo y no aparecen en la curva ni tienen factor de reducción; cada uno declara su observable: `
          : `${nonFieldCost.length} cases report no field cost, so they are neither on the curve nor given a reduction factor; each declares its observable: `}
        {nonFieldCost.map((a, i) => (
          <span key={a.case.slug}>
            {i > 0 ? '; ' : ''}
            <code>{a.case.code}</code> {tr(a.observable.label, es)}
          </span>
        ))}
        {es
          ? '. Una compuerta del navegador falla la construcción si alguno se muestra alguna vez en T^2 s.'
          : '. A browser gate fails the build if any of them is ever shown in T^2 s.'}
      </p>
    </div>
  );

  return (
    <article className="prose page-body">
      <div className="page-head">
        <h1>{es ? 'Comparativa' : 'Benchmark'}</h1>
        <p className="lede">
          {es
            ? 'Todo número de esta página se lee de un artefacto guardado en el repositorio, ligado por hash a su manifiesto: el costo del pulso óptimo frente al campo estático en cada caso, la matriz completa de métodos por variante, cada método contra el oráculo de forma cerrada donde existe, y la evidencia de la versión. Nada está escrito a mano y una compuerta del navegador sostiene cada tabla contra el artefacto.'
            : 'Every number on this page is read from an artifact committed to the repository and bound by hash to its manifest: the cost of the optimal pulse against the static field on every case, the complete method-by-variant matrix, every method against the closed-form oracle where one exists, and the release evidence. Nothing is typed in, and a browser gate holds every table to the artifact.'}
        </p>
      </div>
      <Tabs
        ariaLabel={es ? 'secciones de la comparativa' : 'benchmark sections'}
        initial="reduction"
        tabs={[
          { id: 'reduction', label: es ? 'Óptimo frente a estático' : 'Optimal against static', content: reduction },
          { id: 'matrix', label: es ? 'Matriz de métodos' : 'The method matrix', content: matrix },
          { id: 'oracle', label: es ? 'Contra el oráculo' : 'Against the oracle', content: oracle },
          { id: 'evidence', label: es ? 'Evidencia de la versión' : 'Release evidence', content: evidence },
          { id: 'honesty', label: es ? 'Qué es este número' : 'What this number is', content: honesty },
        ]}
      />
    </article>
  );
}

// Benchmark: the honest comparison, optimal vs conventional, with the reduction factors and the
// stated caveats about what the numbers are and are not.

import { useEffect, useState } from 'react';
import { useShellLang } from '@fasl-work/caos-app-shell';
import type { ArtifactIndex, Benchmark as BenchmarkArtifact, CaseArtifact } from '../data/contract';
import { loadBenchmark, loadCase, loadIndex } from '../data/load';

export function Benchmark(): React.JSX.Element {
  const lang = useShellLang();
  const es = lang === 'es';
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

  if (!index || !benchmark) return <p style={{ padding: 24 }}>{es ? 'Cargando...' : 'Loading...'}</p>;

  return (
    <article className="prose">
      <h1>{es ? 'Comparativa' : 'Benchmark'}</h1>
      <p>
        {es
          ? 'El pulso optimo frente al campo estatico convencional, para el mismo tiempo de conmutacion y el mismo material, con el mismo motor y la misma funcion de costo. Es la unica comparacion estrictamente justa.'
          : 'The optimal pulse against the conventional static field, for the same switching time and material, with the same engine and the same cost functional. It is the only strictly fair comparison.'}
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{es ? 'Caso' : 'Case'}</th>
              <th>{es ? 'Sistema' : 'System'}</th>
              <th>{es ? 'Costo optimo' : 'Optimal cost'}</th>
              <th>{es ? 'Costo estatico' : 'Static cost'}</th>
              <th>{es ? 'Factor de reduccion' : 'Reduction factor'}</th>
            </tr>
          </thead>
          <tbody>
            {artifacts.map((a) => {
              const sb = a.static_baseline;
              return (
                <tr key={a.case.slug}>
                  <td>
                    <code>{a.case.code}</code> <span lang="en">{a.case.title}</span>
                  </td>
                  <td>{a.material.name}</td>
                  <td>{sb.optimal_cost.toExponential(2)}</td>
                  <td>{sb.static_switched ? sb.static_cost.toExponential(2) : 'no switch'}</td>
                  <td>{sb.reduction_factor ? `${sb.reduction_factor.toFixed(0)}x` : '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <h2>{es ? 'Matriz de metodos' : 'The method matrix'}</h2>
      <p>
        {es
          ? 'Cada metodo que un caso declara corre sobre cada variante, o dice por que no puede. Una celda que falta es un fallo del release, no un promedio mas corto. La razon frente al oraculo es el costo numerico dividido por la solucion analitica: uno cuando coincide.'
          : 'Every method a case declares runs over every variant, or says why it cannot. A missing cell fails the release rather than shortening an average. The ratio to the oracle is the numerical cost over the closed form: one when they agree.'}
      </p>
      <p className="muted" data-testid="benchmark-summary">
        {es ? 'Motor' : 'Engine'} {benchmark.engine.name} {benchmark.engine.version} &middot;{' '}
        {benchmark.cases.length} {es ? 'casos' : 'cases'} &middot;{' '}
        {benchmark.complete
          ? es
            ? 'matriz completa'
            : 'matrix complete'
          : es
            ? 'matriz INCOMPLETA'
            : 'matrix INCOMPLETE'}
      </p>
      <div className="table-wrap">
        <table data-testid="method-matrix">
          <thead>
            <tr>
              <th>{es ? 'Caso' : 'Case'}</th>
              <th>{es ? 'Metodo' : 'Method'}</th>
              <th>{es ? 'Celdas' : 'Cells'}</th>
              <th>{es ? 'Mejor costo' : 'Best cost'}</th>
              <th>{es ? 'Peor razon al oraculo' : 'Worst ratio to oracle'}</th>
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
                  <td className="muted" lang="en">{m.notes || '-'}</td>
                </tr>
              )),
            )}
          </tbody>
        </table>
      </div>

      <h2>{es ? 'Evidencia del release' : 'Release evidence'}</h2>
      <p>
        {es
          ? 'Cada artefacto esta ligado por hash a un manifiesto que registra el motor, la semilla, los metodos, el veredicto de carril medido y la completitud. La etapa de validacion rechaza un release cuyo artefacto no coincide con su manifiesto.'
          : 'Every artifact is bound by hash to a manifest recording the engine, the seed, the methods, the measured lane verdict and the completeness. The validate stage refuses a release whose artifact does not match its manifest.'}
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
                <td>
                  <code>{m.lane}</code>
                </td>
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

      <div className="callout">
        <h3>{es ? 'Que es y que no es este numero' : 'What this number is and is not'}</h3>
        <ul>
          <li>
            {es
              ? 'El costo es una integral en T^2 s, no una energia. Convertirlo en julios requiere un modelo de circuito explicito.'
              : 'The cost is an integral in T^2 s, not an energy. Converting to joules requires an explicit circuit model.'}
          </li>
          <li>
            {es
              ? 'El factor de reduccion se cita frente a la mejor linea base disponible, nunca la peor.'
              : 'The reduction factor is quoted against the strongest baseline available, never the weakest.'}
          </li>
          <li>
            {es
              ? 'Los numeros de dispositivos (STT, SOT, DRAM) son energias de celda, no integrales de costo de conmutacion; son objetos distintos.'
              : 'Device numbers (STT, SOT, DRAM) are cell energies, not switching-cost integrals; they are different objects.'}
          </li>
          <li>
            {es
              ? 'El caso FePS3 es un control negativo: los numeros se calculan pero no representan el modo de conmutacion antiferromagnetico real.'
              : 'The FePS3 case is a negative control: the numbers are computed but do not represent the true antiferromagnetic switching mode.'}
          </li>
        </ul>
      </div>
    </article>
  );
}

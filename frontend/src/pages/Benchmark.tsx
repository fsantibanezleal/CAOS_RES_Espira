// Benchmark: the honest comparison, optimal vs conventional, with the reduction factors and the
// stated caveats about what the numbers are and are not.

import { useEffect, useState } from 'react';
import { useShellLang } from '@fasl-work/caos-app-shell';
import type { ArtifactIndex, CaseArtifact } from '../data/contract';
import { loadCase, loadIndex } from '../data/load';

export function Benchmark(): React.JSX.Element {
  const lang = useShellLang();
  const es = lang === 'es';
  const [index, setIndex] = useState<ArtifactIndex | null>(null);
  const [artifacts, setArtifacts] = useState<CaseArtifact[]>([]);

  useEffect(() => {
    loadIndex().then(async (ix) => {
      setIndex(ix);
      setArtifacts(await Promise.all(ix.cases.map((c) => loadCase(c.slug))));
    });
  }, []);

  if (!index) return <p style={{ padding: 24 }}>{es ? 'Cargando...' : 'Loading...'}</p>;

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
              <th>{es ? 'Material' : 'Material'}</th>
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

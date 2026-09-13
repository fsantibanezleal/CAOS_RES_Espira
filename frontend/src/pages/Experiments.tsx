// Experiments: cross-case evidence, the cost curves of every material on one axis.

import { useEffect, useState } from 'react';
import { useShellLang } from '@fasl-work/caos-app-shell';
import type { ArtifactIndex, CaseArtifact } from '../data/contract';
import { loadCase, loadIndex } from '../data/load';

export function Experiments(): React.JSX.Element {
  const lang = useShellLang();
  const es = lang === 'es';
  const [index, setIndex] = useState<ArtifactIndex | null>(null);
  const [artifacts, setArtifacts] = useState<CaseArtifact[]>([]);

  useEffect(() => {
    loadIndex().then(async (ix) => {
      setIndex(ix);
      const loaded = await Promise.all(ix.cases.map((c) => loadCase(c.slug)));
      setArtifacts(loaded);
    });
  }, []);

  if (!index) return <p style={{ padding: 24 }}>{es ? 'Cargando...' : 'Loading...'}</p>;

  return (
    <article className="prose">
      <h1>{es ? 'Experimentos' : 'Experiments'}</h1>
      <p>
        {es
          ? 'Evidencia cruzada entre casos. Para cada material, el costo optimo a un tiempo de conmutacion de referencia, su razon frente al piso universal y frente al costo de macrospin libre, y el momento de amortiguamiento que fija el piso.'
          : 'Cross-case evidence. For each material, the optimal cost at a reference switching time, its ratio to the universal floor and to the free-macrospin cost, and the damping that sets the floor.'}
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{es ? 'Material' : 'Material'}</th>
              <th>{es ? 'Familia' : 'Family'}</th>
              <th>alpha</th>
              <th>Phi / Phi_free</th>
              <th>Phi / Phi_floor</th>
              <th>{es ? 'Eje duro' : 'Hard axis'}</th>
            </tr>
          </thead>
          <tbody>
            {artifacts.map((a) => {
              const mid = a.cost_curve[Math.floor(a.cost_curve.length / 2)];
              return (
                <tr key={a.case.slug}>
                  <td>{a.material.name}</td>
                  <td>{a.material.family}</td>
                  <td>{a.material.damping}</td>
                  <td>{mid.cost_over_free.toFixed(3)}</td>
                  <td>{mid.cost_over_floor?.toFixed(2)}</td>
                  <td>{a.biaxial_reduction ? a.biaxial_reduction.biaxial_over_free.toFixed(3) : '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="muted">
        {es
          ? 'Phi / Phi_free por debajo de uno significa que el material ayuda a la reversion; solo posible con eje duro. Phi / Phi_floor cae hacia uno al aumentar el tiempo de conmutacion.'
          : 'Phi / Phi_free below one means the material helps the reversal; only possible with a hard axis. Phi / Phi_floor falls toward one as the switching time grows.'}
      </p>
    </article>
  );
}

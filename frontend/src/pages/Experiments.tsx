// Experiments: cross-case evidence plus the novel-agenda results (the reliability front R12 and the
// beyond-macrospin lattice study, Gap 1). All read from committed artifacts.

import { useEffect, useState } from 'react';
import { useShellLang, Tabs, Cite } from '@fasl-work/caos-app-shell';
import type { ArtifactIndex, CaseArtifact, NovelResults } from '../data/contract';
import { loadCase, loadIndex, loadNovel } from '../data/load';

function MaterialTable({ artifacts, es }: { artifacts: CaseArtifact[]; es: boolean }) {
  return (
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
  );
}

function Reliability({ novel, es }: { novel: NovelResults; es: boolean }) {
  const rf = novel.reliability_front;
  return (
    <div className="prose">
      <p>
        {es
          ? 'Frente costo-fiabilidad del campo longitudinal (R12). Un campo paralelo al momento es invisible para la dinamica del pulso optimo pero elimina la inestabilidad hiperbolica que las fluctuaciones termicas excitan, elevando la tasa de exito, a un costo que crece con el cuadrado del campo. Resultado nuevo: el costo de esa fiabilidad, que el articulo fuente no reporta.'
          : 'The longitudinal-field cost-reliability front (R12). A field parallel to the moment is invisible to the optimal pulse dynamics but removes the hyperbolic instability that thermal fluctuations excite, raising the success rate, at a cost that grows with the square of the field. Novel result: the cost of that reliability, which the source paper does not report.'}{' '}
        <Cite id="badarneh2023" />
      </p>
      <p className="muted">
        {es ? 'Material' : 'Material'}: {rf.material}, {es ? 'factor de estabilidad termica' : 'thermal stability factor'} = {rf.thermal_stability_factor}
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>B_r / (K/mu)</th>
              <th>{es ? 'Fraccion hiperbolica' : 'Hyperbolic fraction'}</th>
              <th>{es ? 'Tasa de exito' : 'Success rate'}</th>
              <th>{es ? 'Costo anadido' : 'Added cost'} (T^2 s)</th>
            </tr>
          </thead>
          <tbody>
            {rf.points.map((p) => (
              <tr key={p.br_over_anisotropy}>
                <td>{p.br_over_anisotropy.toFixed(1)}</td>
                <td>{p.hyperbolic_fraction.toFixed(2)}</td>
                <td>
                  {p.success_rate.toFixed(3)} +/- {p.confidence95.toFixed(3)}
                </td>
                <td>{p.added_cost.toExponential(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted">{novel.notes.reliability}</p>
    </div>
  );
}

function Lattice({ novel, es }: { novel: NovelResults; es: boolean }) {
  const lc = novel.lattice_crossover;
  return (
    <div className="prose">
      <p>
        {es
          ? 'Mas alla del macrospin (Gap 1), el problema que los autores del metodo declaran como trabajo futuro. Para una cadena de espines con intercambio, el costo de conmutacion de una rotacion uniforme frente a un barrido de pared de dominio.'
          : 'Beyond the macrospin (Gap 1), the problem the method authors state as future work. For a spin chain with exchange, the switching cost of a uniform rotation versus a domain-wall sweep.'}{' '}
        <Cite id="badarneh2023" />
      </p>
      <p className="muted">
        {es ? 'Material' : 'Material'}: {lc.material}, J/K = {lc.exchange_over_anisotropy}
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>N {es ? 'sitios' : 'sites'}</th>
              <th>{es ? 'Costo uniforme' : 'Uniform cost'}</th>
              <th>{es ? 'Costo pared' : 'Wall cost'}</th>
              <th>{es ? 'Razon pared/uniforme' : 'Ratio wall/uniform'}</th>
              <th>{es ? 'Mas barato' : 'Cheaper'}</th>
            </tr>
          </thead>
          <tbody>
            {lc.rows.map((r) => (
              <tr key={r.n_sites}>
                <td>{r.n_sites}</td>
                <td>{r.uniform_cost.toExponential(2)}</td>
                <td>{r.domain_wall_cost.toExponential(2)}</td>
                <td>{r.ratio.toFixed(1)}</td>
                <td>{r.cheaper_mode}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted">{novel.notes.lattice}</p>
    </div>
  );
}

export function Experiments(): React.JSX.Element {
  const lang = useShellLang();
  const es = lang === 'es';
  const [artifacts, setArtifacts] = useState<CaseArtifact[]>([]);
  const [novel, setNovel] = useState<NovelResults | null>(null);

  useEffect(() => {
    loadIndex().then(async (ix: ArtifactIndex) => {
      setArtifacts(await Promise.all(ix.cases.map((c) => loadCase(c.slug))));
    });
    loadNovel().then(setNovel);
  }, []);

  if (!artifacts.length || !novel) return <p style={{ padding: 24 }}>{es ? 'Cargando...' : 'Loading...'}</p>;

  return (
    <article className="prose">
      <h1>{es ? 'Experimentos' : 'Experiments'}</h1>
      <Tabs
        ariaLabel="experiments"
        tabs={[
          {
            id: 'materials',
            label: es ? 'Materiales' : 'Materials',
            content: (
              <div className="prose">
                <p>
                  {es
                    ? 'Evidencia cruzada entre materiales: el costo optimo relativo al piso universal y al costo de macrospin libre. Phi/Phi_free por debajo de uno solo es posible con eje duro.'
                    : 'Cross-material evidence: the optimal cost relative to the universal floor and to the free-macrospin cost. Phi/Phi_free below one is only possible with a hard axis.'}
                </p>
                <MaterialTable artifacts={artifacts} es={es} />
              </div>
            ),
          },
          {
            id: 'reliability',
            label: es ? 'Fiabilidad (R12)' : 'Reliability (R12)',
            content: <Reliability novel={novel} es={es} />,
          },
          {
            id: 'lattice',
            label: es ? 'Mas alla del macrospin' : 'Beyond the macrospin',
            content: <Lattice novel={novel} es={es} />,
          },
        ]}
      />
    </article>
  );
}

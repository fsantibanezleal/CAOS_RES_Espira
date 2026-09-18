// Experiments: cross-case evidence plus the novel-agenda results (the reliability front R12, the free
// chain optimal control crossover and the earlier two-mode lattice comparison, Gap 1). All read from
// committed artifacts.

import { useEffect, useMemo, useState } from 'react';
import { useShellLang, Tabs, Cite } from '@fasl-work/caos-app-shell';
import type { ArtifactIndex, CaseArtifact, LatticeOCPArtifact, NovelResults } from '../data/contract';
import { loadCase, loadIndex, loadLatticeOCP, loadNovel } from '../data/load';
import { useTheme } from '../theme';
import { CrossoverChart } from '../viz/CrossoverChart';
import { ChainMap } from '../viz/ChainMap';
import { CoverageMatrix } from '../viz/CoverageMatrix';

function Chips<T extends number>({
  label,
  values,
  active,
  onPick,
  format,
}: {
  label: string;
  values: T[];
  active: T;
  onPick: (v: T) => void;
  format: (v: T) => string;
}) {
  return (
    <div className="wb-variants" role="group" aria-label={label}>
      <span className="wb-variants-label">{label}</span>
      {values.map((v) => (
        <button
          key={v}
          type="button"
          className={`chip${v === active ? ' active' : ''}`}
          aria-pressed={v === active}
          onClick={() => onPick(v)}
        >
          {format(v)}
        </button>
      ))}
    </div>
  );
}

const START_NAMES: Record<string, { en: string; es: string }> = {
  uniform: { en: 'uniform rotation', es: 'rotacion uniforme' },
  wall: { en: 'tanh wall', es: 'pared tanh' },
  mep: { en: 'minimum energy path', es: 'camino de minima energia' },
};

function FreeChain({ data, es }: { data: LatticeOCPArtifact; es: boolean }) {
  const { theme } = useTheme();
  const alphas = useMemo(() => [...new Set(data.cases.map((c) => c.alpha))].sort((a, b) => b - a), [data]);
  const [alpha, setAlpha] = useState(alphas[0]);
  const scoped = useMemo(() => data.cases.filter((c) => c.alpha === alpha), [data, alpha]);
  const times = useMemo(() => [...new Set(scoped.map((c) => c.switching_tau0))].sort((a, b) => a - b), [scoped]);
  const sizes = useMemo(() => [...new Set(scoped.map((c) => c.n_sites))].sort((a, b) => a - b), [scoped]);
  const [time, setTime] = useState(times[times.length - 1]);
  const [size, setSize] = useState(16);
  const t = times.includes(time) ? time : times[times.length - 1];
  const n = sizes.includes(size) ? size : sizes[Math.floor(sizes.length / 2)];
  const item = scoped.find((c) => c.switching_tau0 === t && c.n_sites === n) ?? scoped[0];
  const exchange = data.cases[0]?.exchange_over_k;
  const startName = (s: string) => (START_NAMES[s] ? START_NAMES[s][es ? 'es' : 'en'] : s);

  return (
    <div className="prose">
      <p>
        {es
          ? 'La trayectoria de control optimo libre de una cadena de espines: el costo de conmutacion se minimiza sobre la trayectoria de cada sitio, sin suponer un modo. Resultado nuevo: sobre una longitud de cruce y a tiempos de conmutacion largos, la inversion optima es una pared de dominio, estrictamente mas barata que la rotacion uniforme. Esto reemplaza la conclusion de la comparacion de dos modos.'
          : "The free optimal control path of a spin chain: the switching cost is minimized over every site's trajectory, with no assumed mode. Novel result: above a crossover length and at long switching time, the optimal reversal is a domain wall, strictly cheaper than uniform rotation. This supersedes the conclusion of the two-mode comparison."}{' '}
        <Cite id="badarneh2023" /> <Cite id="kwiatkowski2021" />
      </p>
      <p>
        {es
          ? 'Cada razon es el costo de una trayectoria factible explicita dividido por el costo uniforme en la misma malla, por lo que es una cota superior del optimo verdadero. El piso es 4 alpha dE / (gamma mu), con dE la barrera del camino de minima energia: una cota inferior rigurosa a todo tiempo de conmutacion.'
          : 'Each ratio is the cost of an explicit feasible trajectory over the uniform cost on the same grid, so it is an upper bound on the true optimum. The floor is 4 alpha dE / (gamma mu), with dE the minimum energy path barrier: a rigorous lower bound at every switching time.'}{' '}
        <Cite id="e2007string" /> <Cite id="bessarab2015" />
      </p>
      <Chips label={es ? 'Amortiguamiento' : 'Damping'} values={alphas} active={alpha} onPick={setAlpha} format={(v) => `alpha = ${v}`} />
      <Chips label={es ? 'Tiempo' : 'Time'} values={times} active={t} onPick={setTime} format={(v) => `T = ${v} tau0`} />
      <Chips label={es ? 'Sitios' : 'Sites'} values={sizes} active={n} onPick={setSize} format={(v) => `N = ${v}`} />
      <div className="wb-variant-readout" data-testid="chain-readout" data-key={item.key}>
        <dl className="readout-grid">
          <div>
            <dt>{es ? 'Costo / uniforme' : 'Cost / uniform'}</dt>
            <dd>{item.best_ratio.toFixed(4)}</dd>
          </div>
          <div>
            <dt>{es ? 'Ahorro minimo' : 'Saving (at least)'}</dt>
            <dd>{(100 * Math.max(0, item.saving)).toFixed(1)} %</dd>
          </div>
          <div>
            <dt>{es ? 'Piso MEP / uniforme' : 'MEP floor / uniform'}</dt>
            <dd>{item.floor_ratio.toFixed(4)}</dd>
          </div>
          <div>
            <dt>{es ? 'Barrera / (N K)' : 'Barrier / (N K)'}</dt>
            <dd>{item.barrier_over_nk.toFixed(4)}</dd>
          </div>
          <div>
            <dt>{es ? 'Mejor inicio' : 'Best start'}</dt>
            <dd>{startName(item.best_start)}</dd>
          </div>
          <div>
            <dt>{es ? 'No uniformidad (rad)' : 'Nonuniformity (rad)'}</dt>
            <dd>{item.best_nonuniformity.toFixed(3)}</dd>
          </div>
          <div>
            <dt>{es ? 'Imagenes en el tiempo' : 'Time images'}</dt>
            <dd>{item.n_images}</dd>
          </div>
        </dl>
      </div>
      <h3>{es ? 'Cruce: costo contra longitud' : 'Crossover: cost against length'}</h3>
      <p className="muted">
        {es ? 'Cadena con J/K' : 'Chain with J/K'} = {exchange}, alpha = {alpha}.{' '}
        {es ? 'Bajo la linea uniforme, la pared gana.' : 'Below the uniform line, the wall wins.'}
      </p>
      <CrossoverChart cases={scoped} selectedT={t} theme={theme} es={es} />
      <h3>{es ? 'La inversion, sitio por sitio' : 'The reversal, site by site'}</h3>
      <p className="muted">
        {es
          ? 'Una rotacion uniforme es un bloque de filas iguales; una pared de dominio es un frente diagonal que entra por un extremo.'
          : 'A uniform rotation is a block of identical rows; a domain wall is a diagonal front entering at one end.'}
      </p>
      <ChainMap item={item} theme={theme} es={es} />
      <h3>{es ? 'Todos los casos' : 'All cases'}</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>alpha</th>
              <th>T / tau0</th>
              <th>N</th>
              <th>{es ? 'Costo / uniforme' : 'Cost / uniform'}</th>
              <th>{es ? 'Piso' : 'Floor'}</th>
              <th>{es ? 'Uniforme + ruido' : 'Uniform + noise'}</th>
              <th>{es ? 'Pared' : 'Wall'}</th>
              <th>MEP</th>
            </tr>
          </thead>
          <tbody>
            {data.cases.map((c) => (
              <tr key={c.key} className={c.key === item.key ? 'active' : undefined}>
                <td>{c.alpha}</td>
                <td>{c.switching_tau0}</td>
                <td>{c.n_sites}</td>
                <td>{c.best_ratio.toFixed(4)}</td>
                <td>{c.floor_ratio.toFixed(3)}</td>
                <td>{c.starts.uniform.ratio.toFixed(4)}</td>
                <td>{c.starts.wall.ratio.toFixed(4)}</td>
                <td>{c.starts.mep.ratio.toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted">{data.description}</p>
    </div>
  );
}

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
                <td>
                  {a.material.damping}{' '}
                  {a.material.provenance.damping?.provenance === 'assumed' && (
                    <span className="prov-badge prov-assumed">{es ? 'supuesto' : 'assumed'}</span>
                  )}
                </td>
                <td>{mid.cost_over_free?.toFixed(3) ?? '-'}</td>
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
          ? 'Frente costo-fiabilidad del campo longitudinal (R12). Un campo paralelo al momento es invisible para la dinamica del pulso optimo pero elimina la inestabilidad hiperbolica que las fluctuaciones termicas excitan, a un costo que crece con el cuadrado del campo: 2,5 veces el costo optimo sin campo a un campo de anisotropia. A este factor de estabilidad (20) el pulso sin campo ya invierte todas las copias, asi que el campo no compra fiabilidad aqui; donde si la compra es bajo un factor de estabilidad de unos diez, lo que mide el caso C07. Resultado nuevo: el costo de esa fiabilidad, que el articulo fuente no reporta.'
          : 'The longitudinal-field cost-reliability front (R12). A field parallel to the moment is invisible to the optimal pulse dynamics but removes the hyperbolic instability that thermal fluctuations excite, at a cost that grows with the square of the field: 2.5 times the bare optimal cost at one anisotropy field. At this stability factor (20) the bare pulse already reverses every copy, so the field buys no reliability here; where it does is below a stability factor of about ten, which case C07 measures. Novel result: the cost of that reliability, which the source paper does not report.'}{' '}
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
          ? 'Mas alla del macrospin (Gap 1), el problema que los autores del metodo declaran como trabajo futuro. Para una cadena de espines con intercambio, el costo de conmutacion de una rotacion uniforme frente a un barrido de pared de dominio a velocidad constante. Reemplazado: esta comparacion fija solo dos modos; la busqueda libre (pestana anterior) encuentra paredes optimas mas baratas que la rotacion uniforme a tiempos largos.'
          : 'Beyond the macrospin (Gap 1), the problem the method authors state as future work. For a spin chain with exchange, the switching cost of a uniform rotation versus a constant-speed domain-wall sweep. Superseded: this comparison fixes two modes; the free search (previous tab) finds optimal walls cheaper than uniform rotation at long switching times.'}{' '}
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
  const [index, setIndex] = useState<ArtifactIndex | null>(null);
  const [artifacts, setArtifacts] = useState<CaseArtifact[]>([]);
  const [novel, setNovel] = useState<NovelResults | null>(null);
  const [chain, setChain] = useState<LatticeOCPArtifact | null>(null);

  useEffect(() => {
    loadIndex().then(async (ix: ArtifactIndex) => {
      setIndex(ix);
      setArtifacts(await Promise.all(ix.cases.map((c) => loadCase(c.slug))));
    });
    loadNovel().then(setNovel);
    loadLatticeOCP().then(setChain);
  }, []);

  if (!artifacts.length || !novel || !chain || !index) return <p style={{ padding: 24 }}>{es ? 'Cargando...' : 'Loading...'}</p>;

  return (
    <article className="prose">
      <h1>{es ? 'Experimentos' : 'Experiments'}</h1>
      <Tabs
        ariaLabel="experiments"
        tabs={[
          {
            id: 'coverage',
            label: es ? 'Cobertura' : 'Coverage',
            content: <CoverageMatrix index={index} es={es} />,
          },
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
            id: 'free-chain',
            label: es ? 'Control optimo de cadena libre' : 'Free chain optimal control',
            content: <FreeChain data={chain} es={es} />,
          },
          {
            id: 'lattice',
            label: es ? 'Comparacion de dos modos' : 'Two-mode comparison',
            content: <Lattice novel={novel} es={es} />,
          },
        ]}
      />
    </article>
  );
}

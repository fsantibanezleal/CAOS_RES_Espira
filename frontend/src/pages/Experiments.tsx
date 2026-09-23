// Experiments: cross-case evidence plus the novel-agenda results (the reliability front R12, the free
// chain optimal control crossover, its two-dimensional patch extension, cases C20 and C21, and the
// earlier two-mode lattice comparison, Gap 1). All read from committed artifacts.

import { useEffect, useMemo, useState } from 'react';
import { useShellLang, Tabs, SubTabs, Cite, Refs } from '@fasl-work/caos-app-shell';
import type {
  ArtifactIndex,
  DescriptorArtifact,
  CaseArtifact,
  LatticeOCPArtifact,
  NovelResults,
  HardAxisMapArtifact,
  ParetoArtifact,
  PenaltyTestArtifact,
  PatchOCPArtifact,
} from '../data/contract';
import {
  loadCase,
  loadDescriptors,
  loadHardAxisMap,
  loadIndex,
  loadLatticeOCP,
  loadNovel,
  loadPareto,
  loadPenaltyTest,
  loadPatchOCP,
} from '../data/load';
import { useTheme } from '../theme';
import { Replications } from '../viz/Replications';
import { withUnit } from '../data/units';
import { translateAxisLabel } from '../content/registry-es';
import { CrossoverChart } from '../viz/CrossoverChart';
import { ChainMap } from '../viz/ChainMap';
import { PatchChart } from '../viz/PatchChart';
import { ParetoChart } from '../viz/ParetoChart';
import { HardAxisMap } from '../viz/HardAxisMap';
import { PenaltyChart } from '../viz/PenaltyChart';
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
      <p className="muted" lang="en">{data.description}</p>
    </div>
  );
}

/** Plain and locale-free, with a unit-aware short form for the wide dynamic ranges here. */
function shortNumber(value: number | null | undefined, digits = 3): string {
  if (value == null || !Number.isFinite(value)) return '-';
  const absolute = Math.abs(value);
  if (absolute !== 0 && (absolute < 0.01 || absolute >= 10000)) return value.toExponential(2);
  return String(Number(value.toPrecision(digits)));
}

function Exploitability({ data, es }: { data: DescriptorArtifact; es: boolean }) {
  const times = data.reference_times_tau0;
  const [time, setTime] = useState(times[1] ?? times[0]);
  const activeTime = times.includes(time) ? time : times[0];
  const retentions = data.retention_factors;
  const [retention, setRetention] = useState(retentions[0]);
  const activeRetention = retentions.includes(retention) ? retention : retentions[0];

  const rows = useMemo(
    () =>
      data.materials
        .map((m) => ({
          material: m,
          at: m.reference_times.find((r) => r.switching_time_tau0 === activeTime) ?? m.reference_times[0],
          sites:
            m.retention.find((r) => r.stability_factor === activeRetention)?.sites_needed_coherent ?? null,
        }))
        .sort((a, b) => a.at.cost - b.at.cost),
    [data, activeTime, activeRetention],
  );
  const warm = data.materials.filter((m) => m.above_room_temperature);
  const cheapest = rows[0];
  const gentlest = [...rows].sort((a, b) => (a.at.peak_field_t ?? Infinity) - (b.at.peak_field_t ?? Infinity))[0];
  // The other end of the same trade: the material that retains with the fewest sites is the one that
  // demands the largest field, because both follow the anisotropy.
  const fewestSites = [...rows].sort((a, b) => (a.sites ?? Infinity) - (b.sites ?? Infinity))[0];

  return (
    <div className="prose">
      <p>
        {es
          ? 'El banco de trabajo responde un caso a la vez. Un disenador que elige entre estos materiales pregunta otra cosa: con lo que esta medido de cada uno, cual se puede conmutar barato, de forma fiable y con un generador que exista. Esta tabla reduce cada material de la base a esos numeros, todos derivados de sus parametros del Contrato 1 y de los resultados del propio producto.'
          : 'The workbench answers one case at a time. A designer choosing between these materials asks something else: given what is actually measured about each, which can be switched cheaply, reliably, and with a generator that exists. This table reduces every material in the database to those numbers, all derived from its Contract 1 parameters and the product’s own results.'}
      </p>
      <p data-testid="exploitability-verdict">
        {es
          ? `Medido a T = ${activeTime} tau0: el costo mas bajo y el campo pico mas bajo son ambos de ${cheapest.material.name} (${shortNumber(cheapest.at.cost)} T^2 s, ${shortNumber(gentlest.at.peak_field_t)} T), y eso mismo le cuesta ${Math.round(cheapest.sites ?? 0).toLocaleString('en-US')} sitios para retener a K/kT = ${activeRetention}. En el otro extremo, ${fewestSites.material.name} retiene con ${Math.round(fewestSites.sites ?? 0).toLocaleString('en-US')} sitios y exige ${shortNumber(fewestSites.at.peak_field_t)} T. La anisotropia fija los dos: la que abarata el pulso es la que obliga a un elemento mas grande. De los ${data.materials.length} materiales, ${warm.length} ordena por encima de temperatura ambiente (${warm.map((m) => m.name).join(', ') || 'ninguno'}).`
          : `Measured at T = ${activeTime} tau0: the lowest cost and the lowest peak field are both ${cheapest.material.name} (${shortNumber(cheapest.at.cost)} T^2 s, ${shortNumber(gentlest.at.peak_field_t)} T), and that same softness costs it ${Math.round(cheapest.sites ?? 0).toLocaleString('en-US')} sites to retain at K/kT = ${activeRetention}. At the other end, ${fewestSites.material.name} retains with ${Math.round(fewestSites.sites ?? 0).toLocaleString('en-US')} sites and demands ${shortNumber(fewestSites.at.peak_field_t)} T. One anisotropy sets both: what makes the pulse cheap is what forces a larger element. Of the ${data.materials.length} materials, ${warm.length} orders above room temperature (${warm.map((m) => m.name).join(', ') || 'none'}).`}
      </p>
      <p className="muted" data-testid="exploitability-caveat">
        {es
          ? 'Los sitios que se listan suponen una inversion coherente, asi que la barrera es el numero de sitios por la anisotropia de un sitio. Los resultados de control optimo libre de este mismo producto (C19 a C22) miden la salida mas barata: sobre un tamano de cruce la inversion nuclea una pared de dominio cuya barrera se satura en la energia de pared en vez de crecer con el volumen. Estos numeros son el extremo optimista.'
          : data.retention_note}
      </p>
      <p className="muted" data-testid="exploitability-reliability-note">
        {es
          ? 'La fiabilidad se mide por material pero solo depende del amortiguamiento: a tiempo de conmutacion reducido fijo, factor de estabilidad fijo y campo en unidades del campo de anisotropia del propio material, ningun otro parametro entra en la dinamica reducida. Los materiales que comparten alpha comparten esas dos columnas exactamente, lo que comprueba la reduccion en vez de ser una coincidencia. La medicion es a K/kT = 3, donde el pulso desnudo si pierde copias.'
          : data.reliability_note}
      </p>
      <Chips
        label={es ? 'Tiempo de conmutacion' : 'Switching time'}
        values={times}
        active={activeTime}
        onPick={setTime}
        format={(v) => `T = ${v} tau0`}
      />
      <Chips
        label={es ? 'Retencion' : 'Retention'}
        values={retentions}
        active={activeRetention}
        onPick={setRetention}
        format={(v) => `K/kT = ${v}`}
      />
      <div className="table-wrap">
        <table data-testid="exploitability-table">
          <thead>
            <tr>
              <th>{es ? 'Material' : 'Material'}</th>
              <th>tau0 (ps)</th>
              <th>{es ? 'Costo' : 'Cost'} (T^2 s)</th>
              <th>{es ? 'Costo / piso' : 'Cost / floor'}</th>
              <th>{es ? 'Campo pico' : 'Peak field'} (T)</th>
              <th>{es ? 'Ancho de banda' : 'Bandwidth'} (Hz)</th>
              <th>{es ? 'Sitios para retener' : 'Sites to retain'}</th>
              <th>{es ? 'Fiabilidad, desnuda / con campo' : 'Reliability, bare / with field'}</th>
              <th>T_C (K)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ material, at, sites }) => (
              <tr key={material.material} data-material={material.material}>
                <td>
                  {material.name}{' '}
                  {material.provenance.damping === 'assumed' && (
                    <span className="prov-badge prov-assumed">{es ? 'alpha supuesto' : 'assumed alpha'}</span>
                  )}
                </td>
                <td>{shortNumber(material.tau0_s * 1e12)}</td>
                <td>{shortNumber(at.cost)}</td>
                <td>{shortNumber(at.cost_over_floor)}</td>
                <td>{shortNumber(at.peak_field_t)}</td>
                <td>{shortNumber(at.bandwidth_hz)}</td>
                <td>{sites == null ? '-' : Math.round(sites).toLocaleString('en-US')}</td>
                <td>
                  {material.reliability.bare_success.toFixed(3)} / {material.reliability.stabilised_success.toFixed(3)}{' '}
                  <span className="muted">
                    ({es ? 'cuesta' : 'costs'} {shortNumber(material.reliability.added_cost_over_optimal, 3)}x)
                  </span>
                </td>
                <td>
                  {material.curie_kelvin}
                  {material.above_room_temperature && (
                    <span className="prov-badge prov-measured">{es ? 'sobre ambiente' : 'above room'}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted" lang="en">{data.description}</p>
    </div>
  );
}

function PenaltyTest({ data, es }: { data: PenaltyTestArtifact; es: boolean }) {
  const { theme } = useTheme();
  const { verdict } = data;
  const holds = verdict.rows_agreeing === verdict.testable_rows && verdict.testable_rows > 0;
  const worst = [...data.per_stability].sort((a, b) => a.gap - b.gap)[0];

  return (
    <div className="prose">
      <p>
        {es
          ? 'El motor ofrece una penalizacion determinista de inestabilidad: la integral de hiperbolicidad a lo largo del camino, que sale del mismo Hessiano que ya usa el solver y no necesita ningun ensemble. La afirmacion, escrita por el propio motor, es que predice la tasa de exito Monte-Carlo sin correr el ensemble. Nada en el producto la habia puesto a prueba.'
          : "The engine offers a deterministic instability penalty: the hyperbolicity integral along the path, which comes from the same Hessian the solver already has and needs no ensemble. The claim, written by the engine itself, is that it predicts the Monte-Carlo success rate without running the ensemble. Nothing in the product had tested it."}{' '}
        <Cite id="badarneh2023" />
      </p>
      <p data-testid="penalty-verdict">
        {es
          ? `Medido sobre ${data.cells.length} celdas (${data.copies} copias cada una): en ${verdict.testable_rows} de las ${verdict.rows} filas los dos extremos del barrido se separan mas que sus intervalos, asi que la fila puede decidir, y la prediccion acierta en ${verdict.rows_agreeing} de ellas. ${holds ? 'Donde el analisis dice que la inestabilidad desaparecio, el ensemble falla menos.' : 'La penalizacion NO predice el ensemble.'}`
          : `Measured over ${data.cells.length} cells (${data.copies} copies each): in ${verdict.testable_rows} of the ${verdict.rows} rows the two ends of the sweep separate by more than their intervals, so the row can decide, and the prediction holds in ${verdict.rows_agreeing} of them. ${holds ? 'Where the analysis says the instability is gone, the ensemble fails less.' : 'The penalty does NOT predict the ensemble.'}`}
      </p>
      <p data-testid="penalty-ranking">
        {es
          ? `En la forma fuerte, ordenar el barrido entero, la afirmacion se parte en dos. La tasa de fallo cae monotonamente con el campo en ${verdict.rows_failing_monotonically} de ${verdict.rows} filas, pero la INTEGRAL de hiperbolicidad no la ordena en ninguna (${verdict.rows_ranked_by_penalty} de ${verdict.rows}): crece hasta un cuarto de campo de anisotropia, donde el fallo medido ya bajo. La FRACCION hiperbolica del camino si la ordena donde no hay empates (${verdict.rows_ranked_by_fraction} de ${verdict.rows}; las demas filas tienen varias celdas con cero fallos). El predictor barato que sirve es cuanto del camino es inestable, no cuanto lo es.`
          : `In the strong form, ranking the whole sweep, the claim splits in two. The failure rate falls monotonically with the field in ${verdict.rows_failing_monotonically} of ${verdict.rows} rows, but the hyperbolicity INTEGRAL ranks none of them (${verdict.rows_ranked_by_penalty} of ${verdict.rows}): it rises to a peak at a quarter of an anisotropy field, where the measured failure rate has already fallen. The hyperbolic FRACTION of the path does rank it wherever ties do not prevent it (${verdict.rows_ranked_by_fraction} of ${verdict.rows}; the other rows have several cells at zero failures). The cheap predictor that works is how much of the path is unstable, not how unstable it is.`}
      </p>
      <p className="muted">
        {es
          ? 'Esta prueba encontro un error de signo en el motor: hasta spinoct 0.18.000 el campo longitudinal estabilizador se aplicaba con el signo opuesto al que usa el analisis del mismo modulo, asi que la hiperbolicidad calculada decia que el camino era estable mientras el ensemble empeoraba. Los numeros de arriba son los del motor corregido.'
          : 'This test found a sign error in the engine: until spinoct 0.18.000 the stabilizing longitudinal field was applied with the opposite sign to the one its own analysis uses, so the computed hyperbolicity reported a stable path while the ensemble got worse. The numbers above are from the corrected engine.'}
      </p>
      <div className="wb-variant-readout" data-testid="penalty-readout" data-holds={String(holds)}>
        <dl className="readout-grid">
          <div>
            <dt>{es ? 'Filas que deciden' : 'Rows that can decide'}</dt>
            <dd>
              {verdict.testable_rows} / {verdict.rows}
            </dd>
          </div>
          <div>
            <dt>{es ? 'Filas donde acierta' : 'Rows where it holds'}</dt>
            <dd>{verdict.rows_agreeing}</dd>
          </div>
          <div>
            <dt>{es ? 'Material' : 'Material'}</dt>
            <dd>{data.material}</dd>
          </div>
          <div>
            <dt>{es ? 'Copias por celda' : 'Copies per cell'}</dt>
            <dd>{data.copies}</dd>
          </div>
          <div>
            <dt>{es ? 'Peor fila (brecha)' : 'Weakest row (gap)'}</dt>
            <dd>
              K/kT = {worst.stability_factor}, {worst.gap >= 0 ? '+' : ''}
              {worst.gap.toFixed(3)}
            </dd>
          </div>
          <div>
            <dt>T / tau0</dt>
            <dd>{data.switching_time_tau0}</dd>
          </div>
        </dl>
      </div>
      <h3>{es ? 'Fallos medidos contra el campo' : 'Measured failures against the field'}</h3>
      <p className="muted">
        {es
          ? 'La penalizacion (linea discontinua, escalada a su maximo) cae a cero cuando el campo longitudinal alcanza el campo de anisotropia. Si la afirmacion vale, las tasas de fallo medidas caen con ella.'
          : 'The penalty (dashed, scaled to its maximum) falls to zero once the longitudinal field reaches the anisotropy field. If the claim holds, the measured failure rates fall with it.'}
      </p>
      <PenaltyChart data={data} theme={theme} es={es} />
      <h3>{es ? 'Fila por fila' : 'Row by row'}</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>K/kT</th>
              <th>{es ? 'Fallo sin campo' : 'Failure, no field'}</th>
              <th>{es ? 'Fallo con campo' : 'Failure, full field'}</th>
              <th>{es ? 'Brecha' : 'Gap'}</th>
              <th>{es ? 'Correlacion de rangos' : 'Rank correlation'}</th>
              <th>{es ? 'Decide' : 'Decides'}</th>
            </tr>
          </thead>
          <tbody>
            {data.per_stability.map((row) => (
              <tr key={row.stability_factor}>
                <td>{row.stability_factor}</td>
                <td>{row.failure_at_zero_field.toFixed(3)}</td>
                <td>{row.failure_at_full_field.toFixed(3)}</td>
                <td>
                  {row.gap >= 0 ? '+' : ''}
                  {row.gap.toFixed(3)}
                </td>
                <td>{row.spearman_penalty_failure.toFixed(2)}</td>
                <td>{row.separated ? (es ? 'si' : 'yes') : 'no'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted" lang="en">{data.description}</p>
    </div>
  );
}

function HardAxis({ data, es }: { data: HardAxisMapArtifact; es: boolean }) {
  const { theme } = useTheme();
  const dampings = data.axes.damping;
  const [damping, setDamping] = useState(dampings[1] ?? dampings[0]);
  const active = dampings.includes(damping) ? damping : dampings[0];
  const scoped = useMemo(() => data.points.filter((p) => p.damping === active), [data, active]);
  const helpedHere = scoped.filter((p) => p.helped);
  const longest = Math.max(...helpedHere.map((p) => p.switching_tau0), 0);
  const { summary } = data;

  return (
    <div className="prose">
      <p>
        {es
          ? 'Un eje duro es el unico mecanismo de esta literatura que puede batir el costo del macrospin libre: el torque interno hace parte del trabajo. El caso C04 lo mide a lo largo de una linea y encuentra que el beneficio no es monotono. Aqui esta la region completa: razon de eje duro contra tiempo de conmutacion, a cuatro amortiguamientos.'
          : 'A hard axis is the one mechanism in this literature that can beat the free-macrospin cost: the internal torque does part of the work. Case C04 measures it along one line and finds the benefit is not monotone. Here is the whole region: hard-axis ratio against switching time, at four dampings.'}{' '}
        <Cite id="badarneh2023" />
      </p>
      <p data-testid="hard-axis-verdict">
        {es
          ? `Medido: el eje duro paga en ${summary.helped} de las ${summary.reliable} celdas fiables, y todas estan a tiempos de conmutacion cortos. A este amortiguamiento el beneficio llega hasta T = ${longest} tau0 y desaparece despues: a tiempos largos la barrera del propio eje duro cuesta mas de lo que ahorra. El mejor punto de todo el mapa es ${summary.best.reduction_vs_control.toFixed(2)} veces a razon ${summary.best.ratio}, alpha ${summary.best.damping} y T = ${summary.best.switching_tau0} tau0.`
          : `Measured: the hard axis pays in ${summary.helped} of the ${summary.reliable} reliable cells, and all of them sit at short switching times. At this damping the benefit reaches T = ${longest} tau0 and is gone beyond it: at long times the hard axis's own barrier costs more than it saves. The best point of the whole map is ${summary.best.reduction_vs_control.toFixed(2)} times, at ratio ${summary.best.ratio}, alpha ${summary.best.damping} and T = ${summary.best.switching_tau0} tau0.`}
      </p>
      <p className="muted">
        {es
          ? `Cada celda se divide por su control: el mismo metodo numerico resolviendo el sistema uniaxial cuya forma cerrada ya se conoce. Donde el control se aparta mas de ${(100 * summary.control_tolerance).toFixed(0)} por ciento o el solver no converge, la celda se dibuja tachada y no cuenta: ${summary.points - summary.reliable} de ${summary.points} (${summary.unconverged} sin converger, ${summary.at_floor} ya en el piso de tiempo infinito, control peor ${(100 * summary.worst_control).toFixed(0)} por ciento).`
          : `Each cell is divided by its control: the same numerical method solving the uniaxial system whose closed form is already known. Where the control drifts by more than ${(100 * summary.control_tolerance).toFixed(0)} per cent, or the solve does not converge, the cell is drawn crossed out and does not count: ${summary.points - summary.reliable} of ${summary.points} (${summary.unconverged} unconverged, ${summary.at_floor} already at the infinite-time floor, worst control ${(100 * summary.worst_control).toFixed(0)} per cent).`}
      </p>
      <Chips
        label={es ? 'Amortiguamiento' : 'Damping'}
        values={dampings}
        active={active}
        onPick={setDamping}
        format={(v) => `alpha = ${v}`}
      />
      <HardAxisMap data={data} damping={active} theme={theme} es={es} />
      <p className="muted" lang="en">{data.description}</p>
    </div>
  );
}

function Tradeoffs({ data, es }: { data: ParetoArtifact; es: boolean }) {
  const { theme } = useTheme();
  const slugs = useMemo(() => data.materials.map((m) => m.material), [data]);
  const [slug, setSlug] = useState(slugs[0]);
  const item = data.materials.find((m) => m.material === slug) ?? data.materials[0];
  const inversions = item.bandwidth_inversions;
  const points = [...item.points].sort((a, b) => a.switching_time_tau0 - b.switching_time_tau0);
  const exponent = (key: 'cost' | 'peak_field_t' | 'bandwidth_hz') => item.exponents[key];
  const plain = (v: number) => (Math.abs(v) >= 1000 || (v !== 0 && Math.abs(v) < 0.01) ? v.toExponential(2) : String(Number(v.toPrecision(4))));

  return (
    <div className="prose">
      <p>
        {es
          ? 'Cada caso del banco de trabajo informa un escalar: un costo a un tiempo de conmutacion. Un dispositivo no elige un solo objetivo: tiene que entregar un campo pico desde un generador real, sobre un ancho de banda real, dentro de un presupuesto de tiempo. Aqui la familia optima analitica se evalua en los cuatro objetivos a la vez y se marca que puntos estan dominados.'
          : "Every workbench case reports one scalar: a cost at a switching time. A device does not get to pick one objective: it has to supply a peak field from a real generator, over a real bandwidth, within a time budget. Here the analytic optimal family is evaluated on all four objectives at once, and each point is marked dominated or not."}{' '}
        <Cite id="kwiatkowski2021" />
      </p>
      <p data-testid="pareto-verdict">
        {es
          ? `Medido: el costo y el campo pico caen monotonamente con el presupuesto de tiempo, pero el ancho de banda no. En ${item.name} hay ${inversions.count} pares donde el protocolo MAS LENTO exige una banda mas ancha; el peor va de T = ${inversions.worst?.faster_tau0} a T = ${inversions.worst?.slower_tau0} tau0 y ensancha la banda ${inversions.worst?.ratio.toFixed(2)} veces, asi que "mas lento es mas facil de generar" es falso en ancho de banda.`
          : `Measured: the cost and the peak field fall monotonically with the time budget, but the bandwidth does not. On ${item.name} there are ${inversions.count} pairs where the SLOWER protocol demands a wider band; the worst runs from T = ${inversions.worst?.faster_tau0} to T = ${inversions.worst?.slower_tau0} tau0 and widens the band by ${inversions.worst?.ratio.toFixed(2)} times, so "slower is easier to generate" is false in bandwidth.`}
      </p>
      <p className="muted">
        {es
          ? `Contar el tiempo de conmutacion como un objetivo mas vacia la pregunta: cada protocolo del barrido tiene un tiempo distinto, asi que ninguno puede ser al menos tan bueno en todo y el frente es todo el barrido (${item.front_size} de ${item.points.length}) por construccion. Con el plazo ya fijado, mirando solo lo que el hardware debe entregar, quedan ${item.supply_front_size} de ${item.points.length}.`
          : `Counting the switching time as one more objective empties the question: every protocol in the sweep has a different time, so none can be at least as good everywhere and the front is the whole sweep (${item.front_size} of ${item.points.length}) by construction. With the deadline already fixed, and only what the hardware must supply in view, ${item.supply_front_size} of ${item.points.length} remain.`}
      </p>
      <Chips
        label={es ? 'Material' : 'Material'}
        values={slugs.map((_, i) => i)}
        active={slugs.indexOf(item.material)}
        onPick={(i) => setSlug(slugs[i])}
        format={(i) => data.materials[i].name}
      />
      <div className="wb-variant-readout" data-testid="pareto-readout" data-key={item.material}>
        <dl className="readout-grid">
          <div>
            <dt>{es ? 'Costo contra T' : 'Cost against T'}</dt>
            <dd>
              T^{exponent('cost').slope.toFixed(2)}
            </dd>
          </div>
          <div>
            <dt>{es ? 'Campo pico contra T' : 'Peak field against T'}</dt>
            <dd>
              T^{exponent('peak_field_t').slope.toFixed(2)}
            </dd>
          </div>
          <div>
            <dt>{es ? 'Ancho de banda contra T' : 'Bandwidth against T'}</dt>
            <dd>
              T^{exponent('bandwidth_hz').slope.toFixed(2)}{' '}
              <span className="prov-badge prov-assumed">
                {es ? 'no es ley de potencia' : 'not a power law'}
              </span>
            </dd>
          </div>
          <div>
            <dt>{es ? 'Amortiguamiento' : 'Damping'}</dt>
            <dd>
              {item.damping}{' '}
              {item.damping_provenance === 'assumed' && (
                <span className="prov-badge prov-assumed">{es ? 'supuesto' : 'assumed'}</span>
              )}
            </dd>
          </div>
          <div>
            <dt>{es ? 'Inversiones de ancho de banda' : 'Bandwidth inversions'}</dt>
            <dd>{inversions.count}</dd>
          </div>
          <div>
            <dt>tau0</dt>
            <dd>{(item.tau0_s * 1e12).toFixed(3)} ps</dd>
          </div>
        </dl>
      </div>
      <h3>{es ? 'Lo que cuesta acortar el tiempo' : 'What shortening the time costs'}</h3>
      <p className="muted">
        {es
          ? 'Cada objetivo dividido por su valor en T = 200 tau0, en ejes logaritmicos. El costo y el campo pico caen como 1/T; el ancho de banda no sigue una ley de potencia y cae mucho mas despacio, asi que a tiempos largos es el ancho de banda el que limita, no el costo.'
          : 'Each objective divided by its own value at T = 200 tau0, on log axes. The cost and the peak field fall like 1/T; the bandwidth does not follow a power law and falls far more slowly, so at long switching times it is the bandwidth that binds, not the cost.'}
      </p>
      <ParetoChart item={item} theme={theme} es={es} />
      <h3>{es ? 'Los cuatro objetivos' : 'The four objectives'}</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>T / tau0</th>
              <th>{es ? 'Costo' : 'Cost'} (T^2 s)</th>
              <th>{es ? 'Campo pico' : 'Peak field'} (T)</th>
              <th>{es ? 'Ancho de banda' : 'Bandwidth'} (Hz)</th>
              <th>{es ? 'Dominado sin plazo' : 'Dominated without the deadline'}</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.switching_time_tau0}>
                <td>{p.switching_time_tau0}</td>
                <td>{plain(p.cost)}</td>
                <td>{plain(p.peak_field_t)}</td>
                <td>{plain(p.bandwidth_hz)}</td>
                <td>{p.dominated_without_time ? (es ? 'si' : 'yes') : 'no'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted" lang="en">{data.description}</p>
    </div>
  );
}

/** The smallest patch side at which the cheapest trajectory found beats uniform rotation, per regime. */
function crossoverSide(data: PatchOCPArtifact, jk: number): number | null {
  const beaten = data.cases.filter((c) => c.exchange_over_k === jk && c.best_ratio < 1).map((c) => c.width);
  return beaten.length ? Math.min(...beaten) : null;
}

const COLUMN_LABEL = { en: 'column of sites (x)', es: 'columna de sitios (x)', noun: { en: 'column', es: 'columna' } };

function Patch({ data, es }: { data: PatchOCPArtifact; es: boolean }) {
  const { theme } = useTheme();
  const regimes = useMemo(() => [...new Set(data.cases.map((c) => c.exchange_over_k))].sort((a, b) => b - a), [data]);
  const [jk, setJK] = useState(regimes[0]);
  const scoped = useMemo(() => data.cases.filter((c) => c.exchange_over_k === jk), [data, jk]);
  const widths = useMemo(() => scoped.map((c) => c.width).sort((a, b) => a - b), [scoped]);
  const [side, setSide] = useState(8);
  const w = widths.includes(side) ? side : widths[0];
  const item = scoped.find((c) => c.width === w) ?? scoped[0];
  const map = useMemo(
    () => ({ n_sites: item.width, sz_map: { times_over_t: item.sz_map.times_over_t, sz: item.sz_map.sz_by_column } }),
    [item],
  );
  const startName = (s: string) => (START_NAMES[s] ? START_NAMES[s][es ? 'es' : 'en'] : s);
  const first = data.cases[0];
  // A path that did not converge gives no bound, so its floor and barrier are withheld, and said so.
  const unconverged = es ? 'sin converger' : 'path not converged';
  // Regime, then side: the artifact's own order is the order the solves finished in.
  const ordered = useMemo(
    () => [...data.cases].sort((a, b) => b.exchange_over_k - a.exchange_over_k || a.width - b.width),
    [data],
  );
  const crossings = regimes.map((r) => ({
    jk: r,
    side: crossoverSide(data, r),
    wall: data.cases.find((c) => c.exchange_over_k === r)?.wall_width_sites ?? 0,
  }));

  return (
    <div className="prose">
      <p>
        {es
          ? 'La misma pregunta que la cadena libre, en un parche cuadrado de W x W espines con intercambio a primeros vecinos: el costo de conmutacion se minimiza sobre la trayectoria de cada sitio desde tres inicios (rotacion uniforme perturbada, una pared tanh recta y el camino de minima energia) y se conserva el mas barato. Dos regimenes de anisotropia al mismo amortiguamiento y tiempo de conmutacion: J/K = 10 (el valor del mapa de la cadena) y J/K = 2.5, con una pared de la mitad de ancho.'
          : "The free chain's question on a square W x W patch of spins with nearest-neighbour exchange: the switching cost is minimized over every site's trajectory from three starts (a perturbed uniform rotation, a straight tanh wall and the minimum energy path) and the cheapest is kept. Two anisotropy regimes at the same damping and switching time: J/K = 10 (the chain map's value) and J/K = 2.5, with a wall half as wide."}{' '}
        <Cite id="e2007string" /> <Cite id="bessarab2015" />
      </p>
      <p data-testid="patch-crossing">
        {crossings.map((c, i) => (
          <span key={c.jk}>
            {i > 0 ? ' ' : ''}
            {es ? 'Con' : 'At'} J/K = {c.jk} ({es ? 'pared de' : 'a wall'} {c.wall.toFixed(2)} {es ? 'sitios' : 'sites wide'}),{' '}
            {c.side == null
              ? es
                ? 'ningun parche medido encuentra una inversion mas barata que la uniforme.'
                : 'no measured patch finds a reversal cheaper than uniform rotation.'
              : es
                ? `una inversion no uniforme es mas barata desde W = ${c.side}.`
                : `a non-uniform reversal is cheaper from W = ${c.side}.`}
          </span>
        ))}{' '}
        {es
          ? 'Una anisotropia mas fuerte, con su pared mas estrecha, adelanta el cruce a parches mas pequenos.'
          : 'A stronger anisotropy, with its narrower wall, moves the crossover to smaller patches.'}
      </p>
      <p className="muted">
        {es
          ? 'Cada razon es el costo de una trayectoria factible explicita sobre el costo uniforme en la misma malla, una cota superior del optimo verdadero; el piso 4 alpha dE / (gamma mu) es una cota inferior rigurosa. A tiempo de conmutacion fijo la cota superior no siempre decrece con el tamano: en los parches mayores las busquedas se detienen en su tope de iteraciones, asi que ese aumento es un limite de la busqueda, no de la fisica, y el optimo verdadero solo queda acotado entre ambas.'
          : 'Each ratio is the cost of an explicit feasible trajectory over the uniform cost on the same grid, an upper bound on the true optimum; the floor 4 alpha dE / (gamma mu) is a rigorous lower bound. At fixed switching time the upper bound does not always fall with size: on the largest patches the searches stop at their iteration cap, so that rise is a limit of the search, not of the physics, and the true optimum is only bracketed between the two.'}
      </p>
      <Chips label={es ? 'Regimen' : 'Regime'} values={regimes} active={jk} onPick={setJK} format={(v) => `J/K = ${v}`} />
      <Chips label={es ? 'Lado' : 'Side'} values={widths} active={w} onPick={setSide} format={(v) => `W = ${v}`} />
      <div className="wb-variant-readout" data-testid="patch-readout" data-key={item.key}>
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
            <dd data-testid="patch-floor">{item.floor_ratio == null ? unconverged : item.floor_ratio.toFixed(4)}</dd>
          </div>
          <div>
            <dt>{es ? 'Barrera / (N K)' : 'Barrier / (N K)'}</dt>
            <dd>{item.barrier_over_nk == null ? unconverged : item.barrier_over_nk.toFixed(4)}</dd>
          </div>
          <div>
            <dt>{es ? 'Lado / ancho de pared' : 'Side / wall width'}</dt>
            <dd>{(item.width / item.wall_width_sites).toFixed(1)}</dd>
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
            <dt>{es ? 'Sitios' : 'Sites'}</dt>
            <dd>{item.n_sites}</dd>
          </div>
        </dl>
      </div>
      <h3>{es ? 'Cruce: costo contra lado' : 'Crossover: cost against side'}</h3>
      <p className="muted">
        alpha = {first.alpha}, T = {first.switching_tau0} tau0.{' '}
        {es ? 'Bajo la linea uniforme, la inversion no uniforme gana.' : 'Below the uniform line, the non-uniform reversal wins.'}
      </p>
      <PatchChart cases={data.cases} selectedJK={jk} theme={theme} es={es} />
      <h3>{es ? 'La inversion, columna por columna' : 'The reversal, column by column'}</h3>
      <p className="muted">
        {es
          ? 's_z promediado a lo largo de y, una columna por x. Una rotacion uniforme es un bloque de filas iguales; un frente que cruza el parche es una diagonal.'
          : 's_z averaged along y, one column per x. A uniform rotation is a block of identical rows; a front crossing the patch is a diagonal.'}
      </p>
      <ChainMap item={map} theme={theme} es={es} axisLabel={COLUMN_LABEL} testId="patch-map" />
      <h3>{es ? 'Todos los casos' : 'All cases'}</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>J/K</th>
              <th>W</th>
              <th>{es ? 'W / pared' : 'W / wall'}</th>
              <th>{es ? 'Costo / uniforme' : 'Cost / uniform'}</th>
              <th>{es ? 'Piso' : 'Floor'}</th>
              <th>{es ? 'Uniforme + ruido' : 'Uniform + noise'}</th>
              <th>{es ? 'Pared' : 'Wall'}</th>
              <th>MEP</th>
            </tr>
          </thead>
          <tbody>
            {ordered.map((c) => (
              <tr key={c.key} className={c.key === item.key ? 'active' : undefined}>
                <td>{c.exchange_over_k}</td>
                <td>{c.width}</td>
                <td>{(c.width / c.wall_width_sites).toFixed(1)}</td>
                <td>{c.best_ratio.toFixed(4)}</td>
                <td>{c.floor_ratio == null ? (es ? 'sin converger' : 'not converged') : c.floor_ratio.toFixed(3)}</td>
                <td>{c.starts.uniform.ratio.toFixed(4)}</td>
                <td>{c.starts.wall.ratio.toFixed(4)}</td>
                <td>{c.starts.mep.ratio.toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted" lang="en">{data.description}</p>
    </div>
  );
}

/** A ratio, or a dash when the case does not have one. One spelling for "missing" across the table: an
 * earlier version printed a dash in one column and nothing at all in the next. */
function ratio(value: number | null | undefined, digits: number): string {
  return value == null || !Number.isFinite(value) ? '-' : value.toFixed(digits);
}

/**
 * The cost of each case against its two references, one row per case.
 *
 * Every row names its case and the point on the case's own axis where the ratios are read, because the
 * cases do not share an axis: the middle of one case's sweep is a switching time, of another a hard-axis
 * ratio, of another a harmonic count. The first version labelled rows by material only, so the synthetic
 * macrospin appeared six times and CrSBr four with different numbers and nothing to tell them apart, and
 * the columns read as comparable when they were taken at different kinds of point. Cases that do not
 * report a field cost (a current, a success rate) have no ratio to show and are listed below the table
 * instead of filling it with dashes.
 */
function MaterialTable({ artifacts, es }: { artifacts: CaseArtifact[]; es: boolean }) {
  const costed = artifacts.filter((a) => a.observable.is_field_cost);
  const other = artifacts.filter((a) => !a.observable.is_field_cost);
  return (
    <>
      <div className="table-wrap">
        <table data-testid="material-table">
          <thead>
            <tr>
              <th>{es ? 'Caso' : 'Case'}</th>
              <th>{es ? 'Material' : 'Material'}</th>
              <th>alpha</th>
              <th>{es ? 'Leido en' : 'Read at'}</th>
              <th>Phi / Phi_free</th>
              <th>Phi / Phi_floor</th>
              <th>{es ? 'Eje duro' : 'Hard axis'}</th>
            </tr>
          </thead>
          <tbody>
            {costed.map((a) => {
              const index = Math.floor(a.cost_curve.length / 2);
              const mid = a.cost_curve[index];
              return (
                <tr key={a.case.slug} data-case={a.case.slug}>
                  <td>
                    <strong>{a.case.code}</strong> <span lang="en">{a.case.title}</span>
                  </td>
                  <td>{a.material.name}</td>
                  <td>
                    {a.material.damping}{' '}
                    {a.material.provenance.damping?.provenance === 'assumed' && (
                      <span className="prov-badge prov-assumed">{es ? 'supuesto' : 'assumed'}</span>
                    )}
                  </td>
                  <td data-testid="read-at">
                    {translateAxisLabel(a.axis.label, es)} = {withUnit(a.axis.values[index], a.axis.unit)}
                  </td>
                  <td>{ratio(mid.cost_over_free, 3)}</td>
                  <td>{ratio(mid.cost_over_floor, 2)}</td>
                  <td>{ratio(a.biaxial_reduction?.biaxial_over_free, 3)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {other.length > 0 && (
        <p className="muted" data-testid="material-table-excluded">
          {es
            ? `No aparecen ${other.length} casos que no reportan un costo de campo, asi que no tienen razon contra el piso: `
            : `Not listed: ${other.length} cases that do not report a field cost, and so have no ratio to the floor: `}
          {other.map((a, i) => (
            <span key={a.case.slug}>
              {i > 0 && ', '}
              {a.case.code} (<span lang="en">{a.observable.label}</span>)
            </span>
          ))}
          .
        </p>
      )}
    </>
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
      <p className="muted" lang="en">{novel.notes.reliability}</p>
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
      <p className="muted" lang="en">{novel.notes.lattice}</p>
    </div>
  );
}

function ReplicationsPanel({ artifacts, es }: { artifacts: CaseArtifact[]; es: boolean }): React.JSX.Element | null {
  const { theme } = useTheme();
  const kickoff = artifacts.find((a) => a.case.slug === 'kickoff-replication');
  const biaxial = artifacts.find((a) => a.case.slug === 'prb107-biaxial-figures');
  if (!kickoff || !biaxial) {
    // A tab that renders nothing reads as a broken page. Name what is missing instead: this happens
    // when a bake has not yet produced one of the two replication cases.
    const missing = [
      kickoff ? null : 'kickoff-replication',
      biaxial ? null : 'prb107-biaxial-figures',
    ].filter(Boolean);
    return (
      <p className="muted" data-testid="replications-missing">
        {es ? 'Falta el artefacto de ' : 'Missing the artifact for '}
        {missing.join(', ')}
        {es ? '. Esta pestana necesita ambos casos horneados.' : '. This tab needs both cases baked.'}
      </p>
    );
  }
  return <Replications kickoff={kickoff} biaxial={biaxial} theme={theme} es={es} />;
}

/** The Experiments views, grouped by the question a reader arrives with (ADR-0071 section 5). Every
 * view belongs to exactly one group; a test holds that, so a view added later cannot fall out of the
 * page. Group names are kept disjoint from view names so neither can be mistaken for the other. */
export const EXPERIMENT_GROUPS: { id: string; en: string; es: string; views: string[] }[] = [
  { id: 'scope', en: 'Scope and evidence', es: 'Alcance y evidencia', views: ['coverage', 'replications'] },
  {
    id: 'materials',
    en: 'Choosing a material',
    es: 'Elegir un material',
    views: ['materials', 'exploitability', 'hard-axis', 'tradeoffs'],
  },
  { id: 'beyond', en: 'Beyond one spin', es: 'Mas alla de un espin', views: ['free-chain', 'patch', 'lattice'] },
  { id: 'reliability', en: 'Thermal reliability', es: 'Fiabilidad termica', views: ['reliability', 'penalty'] },
];

export function Experiments(): React.JSX.Element {
  const lang = useShellLang();
  const es = lang === 'es';
  const [index, setIndex] = useState<ArtifactIndex | null>(null);
  const [artifacts, setArtifacts] = useState<CaseArtifact[]>([]);
  const [novel, setNovel] = useState<NovelResults | null>(null);
  const [chain, setChain] = useState<LatticeOCPArtifact | null>(null);
  const [patch, setPatch] = useState<PatchOCPArtifact | null>(null);
  const [pareto, setPareto] = useState<ParetoArtifact | null>(null);
  const [hardAxis, setHardAxis] = useState<HardAxisMapArtifact | null>(null);
  const [penalty, setPenalty] = useState<PenaltyTestArtifact | null>(null);
  const [descriptors, setDescriptors] = useState<DescriptorArtifact | null>(null);

  useEffect(() => {
    loadIndex().then(async (ix: ArtifactIndex) => {
      setIndex(ix);
      setArtifacts(await Promise.all(ix.cases.map((c) => loadCase(c.slug))));
    });
    loadNovel().then(setNovel);
    loadLatticeOCP().then(setChain);
    loadPatchOCP().then(setPatch);
    loadPareto().then(setPareto);
    loadHardAxisMap().then(setHardAxis);
    loadPenaltyTest().then(setPenalty);
    loadDescriptors().then(setDescriptors);
  }, []);

  if (!artifacts.length || !novel || !chain || !patch || !pareto || !hardAxis || !penalty || !descriptors || !index) return <p style={{ padding: 24 }}>{es ? 'Cargando...' : 'Loading...'}</p>;

  // Eleven views, one question each. Shown flat they were eleven sibling tabs in one scrolling strip,
  // which ADR-0071 section 5 calls a list rather than an information architecture: past about six
  // peers the reader has to read every label to find one view, and on a normal screen the strip had
  // already scrolled the first tabs out of sight, cutting the leftmost visible one mid-word. They are
  // grouped by the question a reader arrives with, and a group shows only its own views.
  const views: Record<string, { id: string; label: string; content: React.ReactNode }> = Object.fromEntries(
    [
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
                ? 'Evidencia cruzada entre materiales: el costo optimo relativo al piso universal y al costo de macrospin libre. Phi/Phi_free por debajo de uno solo es posible con eje duro. Los materiales leidos a un mismo tiempo en unidades de tau0 comparten las dos razones cuando comparten el amortiguamiento, porque el momento y la anisotropia se cancelan en ambas: por eso todos los que tienen el amortiguamiento supuesto de 0.01 dan lo mismo, y Cr2Ge2Te6, a 0.0007, es el que se aparta.'
                : 'Cross-material evidence: the optimal cost relative to the universal floor and to the free-macrospin cost. Phi/Phi_free below one is only possible with a hard axis. Materials read at the same switching time in units of tau0 share both ratios whenever they share a damping, because the moment and the anisotropy cancel out of both: that is why every material at the assumed damping of 0.01 reads the same, and why Cr2Ge2Te6, at 0.0007, is the one that differs.'}
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
        id: 'patch',
        label: es ? 'Parche bidimensional' : 'Two-dimensional patch',
        content: <Patch data={patch} es={es} />,
      },
      {
        id: 'exploitability',
        label: es ? 'Explotabilidad por material' : 'Exploitability by material',
        content: <Exploitability data={descriptors} es={es} />,
      },
      {
        id: 'penalty',
        label: es ? 'Penalizacion contra ensemble' : 'Penalty against ensemble',
        content: <PenaltyTest data={penalty} es={es} />,
      },
      {
        id: 'hard-axis',
        label: es ? 'Donde paga el eje duro' : 'Where the hard axis pays',
        content: <HardAxis data={hardAxis} es={es} />,
      },
      {
        id: 'tradeoffs',
        label: es ? 'Compromisos de dispositivo (R14)' : 'Device trade-offs (R14)',
        content: <Tradeoffs data={pareto} es={es} />,
      },
      {
        id: 'replications',
        label: es ? 'Replicaciones publicadas' : 'Published replications',
        content: <ReplicationsPanel artifacts={artifacts} es={es} />,
      },
      {
        id: 'lattice',
        label: es ? 'Comparacion de dos modos' : 'Two-mode comparison',
        content: <Lattice novel={novel} es={es} />,
      },
    ].map((view) => [view.id, view]),
  );

  return (
    <article className="prose">
      <h1>{es ? 'Experimentos' : 'Experiments'}</h1>
      <Tabs
        ariaLabel={es ? 'grupos de experimentos' : 'experiment groups'}
        tabs={EXPERIMENT_GROUPS.map((group) => ({
          id: group.id,
          label: es ? group.es : group.en,
          content: (
            <SubTabs
              ariaLabel={es ? group.es : group.en}
              tabs={group.views.map((id) => views[id])}
            />
          ),
        }))}
      />
      <Refs ids={['kwiatkowski2021', 'badarneh2023', 'bessarab2015', 'e2007string']} label="Refs" />
    </article>
  );
}

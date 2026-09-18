// The App: a real workbench (ADR-0016 / ADR-0071). The shell CaseSelector picks the material; a
// switching-time variant bar picks the regime; SubTabs give Trajectory / Cost / Pulse / Context. Every
// panel reacts to both selectors, and the instrument fills the surface. No recompute: it reads the
// committed artifact.

import { useEffect, useMemo, useState } from 'react';
import { useShellLang, CaseSelector, SubTabs, type CaseDef } from '@fasl-work/caos-app-shell';
import type { ArtifactIndex, Benchmark, CaseArtifact, CostRow } from '../data/contract';
import { loadBenchmark, loadCase, loadIndex } from '../data/load';
import { CostChart } from '../viz/CostChart';
import { PulseChart } from '../viz/PulseChart';
import { SphereTrajectory } from '../viz/SphereTrajectory';
import { ParameterPanel } from '../viz/ParameterPanel';
import { sotOptimalProtocol } from '../engine/sotAnalytic';
import { useTheme } from '../theme';

const T = {
  en: {
    variant: 'Switching time',
    trajectory: 'Trajectory',
    cost: 'Cost curve',
    pulse: 'Pulse',
    context: 'Context',
    killCriterion: 'Kill criterion',
    design: 'Design',
    methods: 'Methods',
    groundTruth: 'Ground truth',
    split: 'Split',
    code: 'Case code',
    evidence: 'Release evidence',
    lane: 'Lane',
    completeness: 'Cells produced',
    sources: 'Sources',
    reason: 'Why this case',
    expectation: 'Expected behaviour',
    easyAxis: 'Easy axis',
    floor: 'Universal floor',
    reduction: 'Static-field reduction',
    biaxial: 'Biaxial hard-axis result',
    overFree: 'biaxial / free-macrospin',
    reductionVsUni: 'reduction vs uniaxial',
    converged: 'converged',
    atThisVariant: 'At this switching time',
    optCost: 'Optimal cost',
    peakField: 'Peak field',
    meanField: 'Mean field',
    overFloor: 'cost / floor',
    loading: 'Loading baked artifact...',
    noSwitch: 'no reversal',
    observed: 'Measured here',
    notAFieldCost: 'This case does not report a field cost',
    fieldReference: 'Field cost of the same reversal (scale only)',
    liveTitle: 'Recomputed in your browser',
    liveAgreement: 'agreement with the baked artifact',
    liveNote:
      'This case is in the live lane: the closed form runs on the client and is checked against the committed artifact.',
    drawnPath: 'About the drawn path',
    negativeTitle: 'Negative control',
    negativeBody:
      'The macrospin model assumes a single ferromagnetic moment. This material is an antiferromagnet, so these numbers show what the machinery returns when its own assumptions fail. They are not predictions of how it switches.',
  },
  es: {
    variant: 'Tiempo de conmutacion',
    trajectory: 'Trayectoria',
    cost: 'Curva de costo',
    pulse: 'Pulso',
    context: 'Contexto',
    killCriterion: 'Criterio de refutacion',
    design: 'Diseno',
    methods: 'Metodos',
    groundTruth: 'Verdad de referencia',
    split: 'Particion',
    code: 'Codigo del caso',
    evidence: 'Evidencia del release',
    lane: 'Carril',
    completeness: 'Celdas producidas',
    sources: 'Fuentes',
    reason: 'Por que este caso',
    expectation: 'Comportamiento esperado',
    easyAxis: 'Eje facil',
    floor: 'Piso universal',
    reduction: 'Reduccion frente al campo estatico',
    biaxial: 'Resultado biaxial de eje duro',
    overFree: 'biaxial / macrospin libre',
    reductionVsUni: 'reduccion vs uniaxial',
    converged: 'convergido',
    atThisVariant: 'A este tiempo de conmutacion',
    optCost: 'Costo optimo',
    peakField: 'Campo pico',
    meanField: 'Campo medio',
    overFloor: 'costo / piso',
    loading: 'Cargando artefacto...',
    noSwitch: 'sin inversion',
    observed: 'Medido aqui',
    notAFieldCost: 'Este caso no reporta un costo de campo',
    fieldReference: 'Costo de campo de la misma reversion (solo escala)',
    liveTitle: 'Recalculado en tu navegador',
    liveAgreement: 'acuerdo con el artefacto precomputado',
    liveNote:
      'Este caso corre en el carril vivo: la forma cerrada se evalua en el cliente y se compara con el artefacto comprometido.',
    drawnPath: 'Sobre la trayectoria dibujada',
    negativeTitle: 'Control negativo',
    negativeBody:
      'El modelo de macrospin supone un unico momento ferromagnetico. Este material es un antiferromagneto, por lo que estos numeros muestran lo que entrega la maquinaria cuando sus propios supuestos fallan. No son predicciones de como conmuta.',
  },
};

function sci(x: number, d = 2): string {
  return x.toExponential(d);
}

/** A readable value for a quantity that may be a cost of 1e-11 or a success rate of 0.932. */
function quantity(x: number): string {
  return Math.abs(x) >= 0.01 && Math.abs(x) < 1000 ? Number(x.toPrecision(3)).toString() : sci(x);
}


/** What the browser itself computed for a live-lane case, and how far it is from the baked value.
 *
 * The lane gate decides live against precompute by measurement. A verdict of "live" that nothing could
 * actually evaluate on the client would be a label, so the one case that passes the gate is recomputed
 * here from its own inputs and the agreement is shown. A disagreement is a defect in one of the two
 * implementations, and the browser gate fails the build on it.
 */
function liveRecompute(
  artifact: CaseArtifact,
  row: CostRow,
): { value: number; baked: number; relativeError: number } | null {
  const inputs = artifact.live_inputs;
  if (!inputs || inputs.method !== 'R06') return null;
  const baked = row[artifact.observable.key];
  if (typeof baked !== 'number' || !Number.isFinite(baked)) return null;
  const result = sotOptimalProtocol({
    alpha: inputs.alpha,
    gamma: inputs.gamma,
    anisotropyJ: inputs.anisotropy_j,
    mu: inputs.mu,
    xi: inputs.xi,
    beta: inputs.beta,
    switchingTime: row.switching_time_s,
  });
  const value = result.meanCurrentReduced;
  return { value, baked, relativeError: Math.abs(value - baked) / Math.abs(baked) };
}


export function Workbench(): React.JSX.Element {
  const lang = useShellLang();
  const t = T[lang];
  const { theme } = useTheme();
  const [index, setIndex] = useState<ArtifactIndex | null>(null);
  const [slug, setSlug] = useState('');
  const [artifact, setArtifact] = useState<CaseArtifact | null>(null);
  const [variant, setVariant] = useState(0);
  const [benchmark, setBenchmark] = useState<Benchmark | null>(null);

  useEffect(() => {
    loadBenchmark().then(setBenchmark);
    loadIndex().then((ix) => {
      setIndex(ix);
      setSlug(ix.cases[0].slug);
    });
  }, []);

  useEffect(() => {
    if (slug)
      loadCase(slug).then((a) => {
        setArtifact(a);
        setVariant(Math.floor(a.axis.values.length / 2));
      });
  }, [slug]);

  const cases: CaseDef[] = useMemo(() => {
    if (!index) return [];
    return index.cases.map((c) => ({
      id: c.slug,
      name: c.material_name,
      category: c.category,
      // Every case, the negative control included, runs on published parameters.
      kind: 'real',
      anchor: c.includes_biaxial ? 'biaxial hard-axis case' : undefined,
    }));
  }, [index]);

  if (!index || !artifact) return <p style={{ padding: 24 }}>{t.loading}</p>;

  const m = artifact.material;
  const sb = artifact.static_baseline;
  const bx = artifact.biaxial_reduction;
  const pulse = artifact.pulses[variant] ?? artifact.reference_pulse;
  const evidence = benchmark?.manifests.find((entry) => entry.case === artifact.case.slug) ?? null;
  const costRow = artifact.cost_curve[variant] ?? artifact.cost_curve[0];
  const observable = artifact.observable;
  const observed = observable.is_field_cost
    ? (costRow.cost ?? null)
    : ((costRow[observable.key] as number | null | undefined) ?? null);
  const live = liveRecompute(artifact, costRow);

  return (
    <div className="wb">
      <div className="wb-top">
        <CaseSelector cases={cases} selectedId={slug} onSelect={setSlug} lang={lang} />
        <div className="wb-variants" role="tablist" aria-label={artifact.axis.label}>
          <span className="wb-variants-label">{artifact.axis.label}</span>
          {artifact.axis.values.map((tt, i) => (
            <button
              key={tt}
              role="tab"
              aria-selected={variant === i}
              className={variant === i ? 'chip active' : 'chip'}
              onClick={() => setVariant(i)}
            >
              {tt} {artifact.axis.unit}
            </button>
          ))}
        </div>
      </div>

      <div className="wb-stage">
        <div className="wb-main">
          <SubTabs
            ariaLabel="workbench views"
            initial="trajectory"
            tabs={[
              {
                id: 'trajectory',
                label: t.trajectory,
                content: (
                  <div className="wb-instrument">
                    <div className="wb-instrument-stack">
                      <SphereTrajectory pulse={pulse} theme={theme} />
                      {artifact.pulse_note && (
                        <p className="wb-pulse-note" data-testid="pulse-note">
                          <strong>{t.drawnPath}.</strong> {artifact.pulse_note}
                        </p>
                      )}
                    </div>
                  </div>
                ),
              },
              {
                id: 'cost',
                label: t.cost,
                content: (
                  <div className="wb-instrument">
                    <CostChart
                      rows={artifact.cost_curve}
                      axis={artifact.axis}
                      observable={observable}
                      methods={artifact.case.methods}
                      theme={theme}
                    />
                  </div>
                ),
              },
              {
                id: 'pulse',
                label: t.pulse,
                content: (
                  <div className="wb-instrument">
                    <div className="wb-instrument-stack">
                      {/* The chart sizes itself from this box, which holds only the chart: sizing from
                          the stack, which also holds the note, drew the legend over the note. */}
                      <div className="wb-chart-box">
                        <PulseChart pulse={pulse} theme={theme} />
                      </div>
                      {artifact.pulse_note && (
                        <p className="wb-pulse-note">
                          <strong>{t.drawnPath}.</strong> {artifact.pulse_note}
                        </p>
                      )}
                    </div>
                  </div>
                ),
              },
              {
                id: 'context',
                label: t.context,
                content: (
                  <div className="wb-ctx-panel">
                    <div className="wb-ctx-grid">
                      <div>
                        <h4>{t.reason}</h4>
                        <p>{artifact.case.reason}</p>
                        <h4>{t.expectation}</h4>
                        <p>{artifact.case.expectation}</p>
                        <h4>{t.killCriterion}</h4>
                        <p>{artifact.case.kill_criterion}</p>
                        <h4>{m.name}</h4>
                        <p>{m.notes}</p>
                      </div>
                      <div>
                        <h4>{t.design}</h4>
                        <dl className="wb-ctx-facts">
                          <div>
                            <dt>{t.methods}</dt>
                            <dd>{artifact.case.methods.join(', ')}</dd>
                          </div>
                          <div>
                            <dt>{t.groundTruth}</dt>
                            <dd>{artifact.case.ground_truth}</dd>
                          </div>
                          <div>
                            <dt>{t.split}</dt>
                            <dd>{artifact.case.split}</dd>
                          </div>
                          <div>
                            <dt>{t.code}</dt>
                            <dd>{artifact.case.code}</dd>
                          </div>
                        </dl>
                        {evidence && (
                          <>
                            <h4>{t.evidence}</h4>
                            <dl className="wb-ctx-facts" data-testid="case-evidence">
                              <div>
                                <dt>{t.lane}</dt>
                                <dd>{evidence.lane}</dd>
                              </div>
                              <div>
                                <dt>{t.completeness}</dt>
                                <dd>
                                  {evidence.completeness.produced + evidence.completeness.not_applicable}/
                                  {evidence.completeness.expected}
                                </dd>
                              </div>
                              <div>
                                <dt>sha256</dt>
                                <dd>
                                  <code>{evidence.sha256.slice(0, 12)}</code>
                                </dd>
                              </div>
                            </dl>
                          </>
                        )}
                        {artifact.case.sources.length > 0 && (
                          <>
                            <h4>{t.sources}</h4>
                            <ul className="wb-ctx-sources">
                              {artifact.case.sources.map((doi) => (
                                <li key={doi}>
                                  <a href={`https://doi.org/${doi}`} target="_blank" rel="noreferrer">
                                    {doi}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ),
              },
            ]}
          />
        </div>

        <aside className="wb-readout">
          <h3>{m.name}</h3>
          {artifact.case.category === 'negative-control' && (
            <div className="negative-control" role="note" data-testid="negative-control">
              <strong>{t.negativeTitle}.</strong> {t.negativeBody}
            </div>
          )}
          <div className="wb-variant-readout">
            <strong>{artifact.axis.label}</strong> ({artifact.axis.values[variant]} {artifact.axis.unit})
            <dl>
              <dt>{observable.is_field_cost ? t.optCost : observable.label}</dt>
              <dd data-testid="observable-value">
                {observed === null ? (
                  <span className="prov-badge prov-assumed" data-testid="no-switch">
                    {t.noSwitch}
                  </span>
                ) : (
                  `${quantity(observed)} ${observable.unit}`
                )}
              </dd>
              {observable.is_field_cost ? (
                <>
                  <dt>{t.overFloor}</dt>
                  <dd>{costRow.cost_over_floor?.toFixed(2) ?? '-'}</dd>
                  <dt>{t.meanField}</dt>
                  <dd>{((costRow.mean_amplitude ?? 0) * 1e3).toFixed(2)} mT</dd>
                </>
              ) : (
                costRow.field_cost_reference !== undefined && (
                  <>
                    <dt>{t.fieldReference}</dt>
                    <dd>{`${sci(costRow.field_cost_reference)} T^2 s`}</dd>
                  </>
                )
              )}
            </dl>
            {!observable.is_field_cost && (
              <p className="wb-observable-note" data-testid="observable-note">
                <strong>{t.notAFieldCost}.</strong> {observable.note}
              </p>
            )}
          </div>
          {live && (
            <div className="wb-live" data-testid="live-recompute">
              <h4>{t.liveTitle}</h4>
              <dl>
                <dt>{observable.label}</dt>
                <dd data-testid="live-value">
                  {quantity(live.value)} {observable.unit}
                </dd>
                <dt>{t.liveAgreement}</dt>
                <dd data-testid="live-agreement">{live.relativeError.toExponential(1)}</dd>
              </dl>
              <p>{t.liveNote}</p>
            </div>
          )}
          <ParameterPanel material={m} lang={lang} />
          <dl>
            <dt>{t.easyAxis}</dt>
            <dd>{m.easy_axis}</dd>
            {/* The floor and the static-field reduction describe a single-moment reversal; a case that
                is not one (a chain barrier) carries neither, and shows neither. */}
            {costRow.cost_floor !== undefined && (
              <>
                <dt>{t.floor}</dt>
                <dd>{sci(costRow.cost_floor)} T^2 s</dd>
                <dt>{t.reduction}</dt>
                <dd>{sb.reduction_factor ? `${sb.reduction_factor.toFixed(0)}x` : 'n/a'}</dd>
              </>
            )}
          </dl>
          {bx && (
            <div className="wb-biaxial">
              <h4>{t.biaxial}</h4>
              <dl>
                <dt>{t.overFree}</dt>
                <dd>{bx.biaxial_over_free.toFixed(3)}</dd>
                <dt>{t.reductionVsUni}</dt>
                <dd>{bx.reduction_vs_uniaxial?.toFixed(3)}</dd>
                <dt>{t.converged}</dt>
                <dd>{bx.converged ? 'yes' : 'no (cap)'}</dd>
              </dl>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

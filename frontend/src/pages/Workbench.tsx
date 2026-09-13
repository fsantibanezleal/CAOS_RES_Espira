// The App: a real workbench. A material/case selector drives every panel. The instrument (the sphere
// trajectory, the cost curve, the pulse) fills the surface; the readouts report real baked numbers.

import { useEffect, useState } from 'react';
import { useShellLang } from '@fasl-work/caos-app-shell';
import type { ArtifactIndex, CaseArtifact } from '../data/contract';
import { loadCase, loadIndex } from '../data/load';
import { CostChart } from '../viz/CostChart';
import { PulseChart } from '../viz/PulseChart';
import { SphereTrajectory } from '../viz/SphereTrajectory';
import { useTheme } from '../theme';

const T = {
  en: {
    material: 'Material / case',
    view: 'View',
    trajectory: 'Trajectory',
    cost: 'Cost curve',
    pulse: 'Pulse',
    context: 'Context',
    reason: 'Why this case',
    expectation: 'Expected behaviour',
    props: 'Parameters',
    easyAxis: 'Easy axis',
    damping: 'Gilbert damping',
    curie: 'Ordering temperature',
    moment: 'Moment',
    anis: 'Anisotropy K',
    hard: 'Hard-axis ratio',
    floor: 'Universal floor',
    reduction: 'Static-field reduction factor',
    biaxial: 'Biaxial hard-axis result',
    biaxialText:
      'The numerical optimal control path on the biaxial system, which has no closed form. A value below one relative to the free-macrospin cost means the material internal torque pays for part of the reversal.',
    overFree: 'biaxial cost / free-macrospin cost',
    reductionVsUni: 'reduction vs uniaxial',
    converged: 'converged',
    loading: 'Loading baked artifact...',
  },
  es: {
    material: 'Material / caso',
    view: 'Vista',
    trajectory: 'Trayectoria',
    cost: 'Curva de costo',
    pulse: 'Pulso',
    context: 'Contexto',
    reason: 'Por que este caso',
    expectation: 'Comportamiento esperado',
    props: 'Parametros',
    easyAxis: 'Eje facil',
    damping: 'Amortiguamiento de Gilbert',
    curie: 'Temperatura de orden',
    moment: 'Momento',
    anis: 'Anisotropia K',
    hard: 'Razon de eje duro',
    floor: 'Piso universal',
    reduction: 'Factor de reduccion frente al campo estatico',
    biaxial: 'Resultado biaxial de eje duro',
    biaxialText:
      'La trayectoria optima numerica en el sistema biaxial, que no tiene forma cerrada. Un valor por debajo de uno frente al costo de macrospin libre significa que el torque interno del material paga parte de la reversion.',
    overFree: 'costo biaxial / costo macrospin libre',
    reductionVsUni: 'reduccion frente a uniaxial',
    converged: 'convergido',
    loading: 'Cargando artefacto...',
  },
};

function sci(x: number, digits = 2): string {
  return x.toExponential(digits);
}

export function Workbench(): React.JSX.Element {
  const lang = useShellLang();
  const t = T[lang];
  const { theme } = useTheme();
  const [index, setIndex] = useState<ArtifactIndex | null>(null);
  const [slug, setSlug] = useState<string>('');
  const [artifact, setArtifact] = useState<CaseArtifact | null>(null);
  const [view, setView] = useState<'trajectory' | 'cost' | 'pulse'>('trajectory');

  useEffect(() => {
    loadIndex().then((ix) => {
      setIndex(ix);
      setSlug(ix.cases[0].slug);
    });
  }, []);

  useEffect(() => {
    if (slug) loadCase(slug).then(setArtifact);
  }, [slug]);

  if (!index || !artifact) return <p style={{ padding: 24 }}>{t.loading}</p>;

  const m = artifact.material;
  const sb = artifact.static_baseline;
  const bx = artifact.biaxial_reduction;

  return (
    <div className="wb">
      <div className="wb-controls">
        <label className="wb-field">
          <span>{t.material}</span>
          <select value={slug} onChange={(e) => setSlug(e.target.value)}>
            {Object.entries(index.categories).map(([cat, slugs]) => (
              <optgroup key={cat} label={cat}>
                {slugs.map((s) => {
                  const entry = index.cases.find((c) => c.slug === s)!;
                  return (
                    <option key={s} value={s}>
                      {entry.title}
                    </option>
                  );
                })}
              </optgroup>
            ))}
          </select>
        </label>
        <div className="wb-viewtabs" role="tablist" aria-label={t.view}>
          {(['trajectory', 'cost', 'pulse'] as const).map((v) => (
            <button
              key={v}
              role="tab"
              aria-selected={view === v}
              className={view === v ? 'active' : ''}
              onClick={() => setView(v)}
            >
              {t[v]}
            </button>
          ))}
        </div>
      </div>

      <div className="wb-stage">
        <div className="wb-instrument">
          {view === 'trajectory' && (
            <SphereTrajectory pulse={artifact.reference_pulse} theme={theme} />
          )}
          {view === 'cost' && <CostChart rows={artifact.cost_curve} theme={theme} />}
          {view === 'pulse' && <PulseChart pulse={artifact.reference_pulse} theme={theme} />}
        </div>

        <aside className="wb-readout">
          <h3>{m.name}</h3>
          <dl>
            <dt>{t.easyAxis}</dt>
            <dd>{m.easy_axis}</dd>
            <dt>{t.moment}</dt>
            <dd>{m.moment_bohr} muB</dd>
            <dt>{t.anis}</dt>
            <dd>{m.anisotropy_mev} meV</dd>
            <dt>{t.hard}</dt>
            <dd>{m.hard_axis_ratio}</dd>
            <dt>{t.damping}</dt>
            <dd>
              {m.damping} ({m.damping_low}-{m.damping_high})
            </dd>
            <dt>{t.curie}</dt>
            <dd>{m.curie_kelvin} K</dd>
            <dt>{t.floor}</dt>
            <dd>{sci(artifact.cost_curve[0].cost_floor)} T^2 s</dd>
            <dt>{t.reduction}</dt>
            <dd>{sb.reduction_factor ? `${sb.reduction_factor.toFixed(0)}x` : 'n/a'}</dd>
          </dl>

          {bx && (
            <div className="wb-biaxial">
              <h4>{t.biaxial}</h4>
              <p className="muted">{t.biaxialText}</p>
              <dl>
                <dt>{t.overFree}</dt>
                <dd>{bx.biaxial_over_free.toFixed(3)}</dd>
                <dt>{t.reductionVsUni}</dt>
                <dd>{bx.reduction_vs_uniaxial?.toFixed(3)}</dd>
                <dt>{t.converged}</dt>
                <dd>{bx.converged ? 'yes' : 'no (iteration cap)'}</dd>
              </dl>
            </div>
          )}
        </aside>
      </div>

      <section className="wb-context">
        <div>
          <h4>{t.reason}</h4>
          <p>{artifact.case.reason}</p>
        </div>
        <div>
          <h4>{t.expectation}</h4>
          <p>{artifact.case.expectation}</p>
        </div>
        <div>
          <h4>{t.context}</h4>
          <p>{m.notes}</p>
        </div>
      </section>
    </div>
  );
}

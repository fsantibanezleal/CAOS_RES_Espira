// The material parameters with their Contract 1 provenance: every value shows whether it is measured,
// computed, derived or assumed, links its sources, and exposes the published input and the conversion.
// Assumed values are the ones a reader must not quote as measurements; they are marked and counted.

import { useState } from 'react';
import type { MaterialInfo, ParameterProvenance } from '../data/contract';
import { tr } from '../content/dataText';

type Lang = 'en' | 'es';

const LABELS: Record<Lang, Record<string, string>> = {
  en: {
    title: 'Parameters and provenance',
    moment: 'Moment',
    anisotropy: 'Anisotropy K',
    hard_axis_ratio: 'Hard-axis ratio',
    damping: 'Gilbert damping',
    ordering_temperature: 'Ordering temperature',
    measured: 'measured',
    computed: 'computed',
    derived: 'derived',
    assumed: 'assumed',
    assumedCount: 'assumed values',
    input: 'Published as',
    method: 'Method',
    none: 'no source value',
  },
  es: {
    title: 'Parámetros y procedencia',
    moment: 'Momento',
    anisotropy: 'Anisotropía K',
    hard_axis_ratio: 'Razón de eje duro',
    damping: 'Amortiguamiento de Gilbert',
    ordering_temperature: 'Temperatura de orden',
    measured: 'medido',
    computed: 'calculado',
    derived: 'derivado',
    assumed: 'supuesto',
    assumedCount: 'valores supuestos',
    input: 'Publicado como',
    method: 'Método',
    none: 'sin valor de fuente',
  },
};

const ORDER = ['moment', 'anisotropy', 'hard_axis_ratio', 'damping', 'ordering_temperature'] as const;

function formatValue(name: string, m: MaterialInfo, lang: Lang): string {
  switch (name) {
    case 'moment':
      return `${m.moment_bohr.toPrecision(3)} muB`;
    case 'anisotropy':
      return `${m.anisotropy_mev.toPrecision(3)} meV`;
    case 'hard_axis_ratio':
      return `${m.hard_axis_ratio}`;
    case 'damping':
      return `${m.damping} (${m.damping_low} ${lang === 'es' ? 'a' : 'to'} ${m.damping_high})`;
    case 'ordering_temperature':
      return `${m.curie_kelvin} K`;
    default:
      return '';
  }
}

function Row({ name, m, p, lang }: { name: string; m: MaterialInfo; p: ParameterProvenance; lang: Lang }) {
  const [open, setOpen] = useState(false);
  const L = LABELS[lang];
  return (
    <li className="param-row" data-parameter={name} data-provenance={p.provenance}>
      <button type="button" className="param-head" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="param-name">{L[name]}</span>
        <span className="param-value">{formatValue(name, m, lang)}</span>
        <span className={`prov-badge prov-${p.provenance}`}>{L[p.provenance]}</span>
      </button>
      {open && (
        <div className="param-detail">
          <p>
            <strong>{L.input}:</strong> {p.input.value} {tr(p.input.unit, lang === 'es')} ({tr(p.input.basis, lang === 'es')})
          </p>
          {p.method && (
            <p>
              <strong>{L.method}:</strong> {tr(p.method, lang === 'es')}
            </p>
          )}
          {p.note && <p>{tr(p.note, lang === 'es')}</p>}
          <p className="param-sources">
            {p.sources.length
              ? p.sources.map((doi) => (
                  <a key={doi} href={`https://doi.org/${doi}`} target="_blank" rel="noreferrer">
                    {doi}
                  </a>
                ))
              : L.none}
          </p>
        </div>
      )}
    </li>
  );
}

export function ParameterPanel({ material, lang }: { material: MaterialInfo; lang: Lang }): React.JSX.Element {
  const L = LABELS[lang];
  const assumed = ORDER.filter((name) => material.provenance[name]?.provenance === 'assumed').length;
  return (
    <section className="param-panel" data-testid="parameter-panel" data-assumed={assumed}>
      <h4>
        {L.title}{' '}
        <span className="param-assumed-count">
          {assumed} {L.assumedCount}
        </span>
      </h4>
      <ul>
        {ORDER.map((name) => (
          <Row key={name} name={name} m={material} p={material.provenance[name]} lang={lang} />
        ))}
      </ul>
    </section>
  );
}

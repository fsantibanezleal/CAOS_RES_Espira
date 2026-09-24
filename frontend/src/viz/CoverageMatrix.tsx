// The coverage matrix: every declared case with its status, so a planned or blocked case cannot hide
// behind the baked ones. Read from the committed index, which the bake writes from the registry.

import type { ArtifactIndex, RegistryRow } from '../data/contract';
import { translateAxisLabel, translateCategory } from '../content/registry-es';
import { DataText, tr } from '../content/dataText';

const STATUS_LABEL: Record<string, { en: string; es: string }> = {
  baked: { en: 'baked', es: 'calculado' },
  planned: { en: 'planned', es: 'planificado' },
  blocked: { en: 'blocked', es: 'bloqueado' },
};

export function CoverageMatrix({ index, es }: { index: ArtifactIndex; es: boolean }): React.JSX.Element {
  const byCategory = new Map<string, RegistryRow[]>();
  for (const row of index.registry) {
    byCategory.set(row.category, [...(byCategory.get(row.category) ?? []), row]);
  }
  const { baked = 0, planned = 0, blocked = 0 } = index.coverage ?? {};
  return (
    <div className="prose" data-testid="coverage-matrix" data-declared={index.registry.length}>
      <p>
        {es
          ? 'La matriz de cobertura completa del plan validado: cada caso declarado con su estado. Un caso planificado o bloqueado aparece aquí con la misma visibilidad que uno calculado, de modo que lo que falta no se esconde detrás de lo que existe.'
          : 'The full coverage matrix of the validated plan: every declared case with its status. A planned or blocked case appears here as visibly as a baked one, so what is missing does not hide behind what exists.'}
      </p>
      <p className="muted" data-testid="coverage-counts">
        {baked} {es ? 'calculados' : 'baked'} &middot; {planned} {es ? 'planificados' : 'planned'} &middot;{' '}
        {blocked} {es ? 'bloqueados' : 'blocked'}
      </p>
      {[...byCategory.entries()].map(([category, rows]) => (
        <section key={category}>
          <h3>{translateCategory(category, es)}</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{es ? 'Caso' : 'Case'}</th>
                  <th>{es ? 'Estado' : 'Status'}</th>
                  <th>{es ? 'Variantes' : 'Variants'}</th>
                  <th>{es ? 'Métodos' : 'Methods'}</th>
                  <th>{es ? 'Verdad de referencia' : 'Ground truth'}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.slug} data-case={row.slug} data-status={row.status}>
                    <td>
                      <code>{row.code}</code> <DataText text={row.title} />
                      {row.blocked_reason && <DataText as="div" className="muted" text={row.blocked_reason} />}
                    </td>
                    <td>
                      <span className={`prov-badge status-${row.status}`}>
                        {STATUS_LABEL[row.status]?.[es ? 'es' : 'en'] ?? row.status}
                      </span>
                    </td>
                    <td>
                      {row.variants} x {translateAxisLabel(row.axis, es).toLowerCase()}
                    </td>
                    <td>{row.methods.join(', ')}</td>
                    <td>{tr(row.ground_truth, es)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}

// The live lane's parity panel: the browser's own implementation of the closed form, evaluated here
// against values the offline lane committed (SciPy for the elliptic integral, spinoct for the protocol).
//
// The workbench already shows the agreement at the case's working point. This panel widens that to the
// grid the fixture pins, including the modulus range where an arithmetic-geometric mean that stops one
// step early first goes wrong, so "the web computes the same thing" is a measurement rather than a claim.

import { useMemo } from 'react';
import type { LiveParityFixture } from '../data/contract';
import { completeK, sotOptimalProtocol } from '../engine/sotAnalytic';

interface Props {
  fixture: LiveParityFixture;
  es: boolean;
}

/** Relative difference, with an absolute fallback so a committed zero cannot divide. */
function deviation(browser: number, committed: number): number {
  const scale = Math.abs(committed);
  return scale > 0 ? Math.abs(browser - committed) / scale : Math.abs(browser - committed);
}

interface Row {
  label: string;
  browser: number;
  committed: number;
  deviation: number;
}

export function LiveParity({ fixture, es }: Props): React.JSX.Element {
  const { elliptic, protocol, worstElliptic, worstProtocol } = useMemo(() => {
    const elliptic: Row[] = fixture.elliptic_k.map((row) => {
      const browser = completeK(row.m);
      return { label: `K(m = ${row.m})`, browser, committed: row.k, deviation: deviation(browser, row.k) };
    });
    const { alpha, gamma, anisotropy_j, mu, xi, beta } = fixture.inputs;
    const protocol: Row[] = fixture.protocol.flatMap((row) => {
      const result = sotOptimalProtocol({
        alpha,
        gamma,
        anisotropyJ: anisotropy_j,
        mu,
        xi,
        beta,
        switchingTime: row.switching_time_s,
      });
      const pairs: [string, number, number][] = [
        [es ? 'corriente media' : 'mean current', result.meanCurrentReduced, row.mean_current_reduced],
        [es ? 'costo de conmutación rápida' : 'fast-switching cost', result.costFastReduced, row.cost_fast_reduced],
        [es ? 'tiempo característico' : 'characteristic time', result.characteristicTimeS, row.characteristic_time_s],
      ];
      return pairs.map(([what, browser, committed]) => ({
        label: `${what}, T = ${row.switching_time_tau0} tau0`,
        browser,
        committed,
        deviation: deviation(browser, committed),
      }));
    });
    const worst = (rows: Row[]) => rows.reduce((a, r) => Math.max(a, r.deviation), 0);
    return { elliptic, protocol, worstElliptic: worst(elliptic), worstProtocol: worst(protocol) };
  }, [fixture, es]);

  const groups: { key: 'elliptic_k' | 'protocol'; title: string; rows: Row[]; worst: number }[] = [
    {
      key: 'elliptic_k',
      title: es ? 'Integral elíptica completa K(m), contra SciPy' : 'Complete elliptic integral K(m), against SciPy',
      rows: elliptic,
      worst: worstElliptic,
    },
    {
      key: 'protocol',
      title: es ? 'El protocolo cerrado, contra spinoct' : 'The closed-form protocol, against spinoct',
      rows: protocol,
      worst: worstProtocol,
    },
  ];

  return (
    <div data-testid="live-parity" data-worst-elliptic={worstElliptic} data-worst-protocol={worstProtocol}>
      {groups.map((group) => {
        const tolerance = fixture.tolerances[group.key];
        const within = group.worst <= tolerance;
        return (
          <div key={group.key} className="parity-group">
            <h3>{group.title}</h3>
            <p className="muted">
              {es ? 'Peor desviación relativa' : 'Worst relative deviation'}:{' '}
              <strong data-testid={`parity-worst-${group.key}`}>{group.worst.toExponential(2)}</strong>{' '}
              {es ? 'contra una tolerancia de' : 'against a tolerance of'} {tolerance.toExponential(0)}.{' '}
              <span className={within ? 'prov-badge prov-measured' : 'prov-badge prov-assumed'}>
                {within ? (es ? 'dentro' : 'within') : es ? 'fuera' : 'outside'}
              </span>
            </p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{es ? 'Cantidad' : 'Quantity'}</th>
                    <th>{es ? 'Navegador' : 'Browser'}</th>
                    <th>{es ? 'Artefacto' : 'Committed'}</th>
                    <th>{es ? 'Desviación' : 'Deviation'}</th>
                  </tr>
                </thead>
                <tbody>
                  {group.rows.map((row) => (
                    <tr key={row.label}>
                      <td>{row.label}</td>
                      <td>{row.browser.toPrecision(10)}</td>
                      <td>{row.committed.toPrecision(10)}</td>
                      <td>{row.deviation === 0 ? '0' : row.deviation.toExponential(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

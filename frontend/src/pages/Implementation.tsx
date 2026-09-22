// Implementation: how the product is built, the engine, the pipeline, the honesty of the lanes.

import { useEffect, useState } from 'react';
import { useShellLang, Cite, Refs } from '@fasl-work/caos-app-shell';
import type { ExternalCrosscheck, LiveParityFixture } from '../data/contract';
import { loadExternalCrosscheck, loadLiveParity } from '../data/load';
import { LiveParity } from '../viz/LiveParity';

export function Implementation(): React.JSX.Element {
  const lang = useShellLang();
  const es = lang === 'es';
  const [parity, setParity] = useState<LiveParityFixture | null>(null);
  const [crosscheck, setCrosscheck] = useState<ExternalCrosscheck | null>(null);
  useEffect(() => {
    loadLiveParity().then(setParity).catch(() => setParity(null));
    loadExternalCrosscheck().then(setCrosscheck).catch(() => setCrosscheck(null));
  }, []);
  return (
    <article className="prose">
      <h1>{es ? 'Implementacion' : 'Implementation'}</h1>
      <h2>{es ? 'El motor' : 'The engine'}</h2>
      <p>
        {es
          ? 'El calculo lo realiza spinoct, un paquete de Python de codigo abierto (MIT) que resuelve el control optimo sobre la dinamica de Landau-Lifshitz-Gilbert. Es un repositorio y un paquete separado, no codigo enterrado en este producto, porque el solucionador es agnostico del dominio: funciona sobre cualquier hamiltoniano de espin. Se verifico que ningun paquete en PyPI resolvia este problema.'
          : 'The computation is done by spinoct, an open-source (MIT) Python package that solves optimal control over Landau-Lifshitz-Gilbert dynamics. It is a separate repository and package, not code buried in this product, because the solver is domain-agnostic: it works on any spin Hamiltonian. No package on PyPI was found that solves this problem.'}
      </p>
      <ul>
        <li>{es ? 'Trayectorias de control optimo analiticas (uniaxial y SOT), formas cerradas exactas.' : 'Analytic optimal control paths (uniaxial and SOT), exact closed forms.'} <Cite id="kwiatkowski2021" /> <Cite id="vlasov2022" /></li>
        <li>{es ? 'Trayectoria numerica basada en imagenes para el caso biaxial, validada contra la forma cerrada.' : 'Numerical image-based optimal control path for the biaxial case, validated against the closed form.'} <Cite id="badarneh2023" /></li>
        <li>{es ? 'Protocolos convencionales (campo estatico, Sun-Wang, precesional) como lineas base.' : 'Conventional protocols (static field, Sun-Wang, precessional) as baselines.'} <Cite id="sunwang2006" /></li>
        <li>{es ? 'Solucionadores con restriccion (GRAPE, CRAB) para el precio de la realizabilidad.' : 'Constrained solvers (GRAPE, CRAB) for the price of realizability.'}</li>
      </ul>
      <h2>{es ? 'Los datos' : 'The data'}</h2>
      <p>
        {es
          ? 'No hay conjunto de datos experimental publico de conmutacion por pulsos. Los datos reales son los parametros del hamiltoniano de espin de la familia van der Waals, curados en una base con un DOI, un metodo, una incertidumbre y una convencion de signo por fila, y canonizados a una forma interna. Donde una fuente discrepa de otra, se registran ambas.'
          : 'There is no public experimental dataset of shaped-pulse switching. The real data is the set of spin-Hamiltonian parameters of the van der Waals family, curated into a database with a DOI, a method, an uncertainty, and a sign convention per row, canonicalized to one internal form. Where sources disagree, both are recorded.'}{' '}
        <Cite id="scheie2022" /> <Cite id="ruiz2024" /> <Cite id="huang2017" />
      </p>
      <h2>{es ? 'Las lineas de ejecucion' : 'The lanes'}</h2>
      <p>
        {es
          ? 'La verdad canonica se hornea sin conexion con spinoct y se compromete como artefactos JSON con suma de verificacion. Esta pagina web reproduce esos artefactos, salvo un caso: el gate de carril mide tiempo de ejecucion y tamano, y el oraculo de torque de espin-orbita (C03) pasa, asi que el navegador evalua su forma cerrada y muestra el acuerdo con el artefacto. El motor de atomistica pesado (VAMPIRE) se llama como proceso separado para verificacion, nunca enlazado, manteniendo spinoct bajo licencia MIT.'
          : 'The canonical truth is baked offline with spinoct and committed as checksummed JSON artifacts. This web page replays those artifacts, with one exception: the lane gate measures runtime and artifact size, and the spin-orbit-torque oracle (C03) passes it, so the browser evaluates that closed form itself and shows the agreement with the committed artifact. The heavy atomistic engine (VAMPIRE) is called as a separate process for verification, never linked, keeping spinoct MIT-licensed.'}{' '}
        <Cite id="evans2014" />
      </p>
      <h2>{es ? 'Paridad del carril en vivo' : 'Live-lane parity'}</h2>
      <p>
        {es
          ? 'El carril en vivo tiene dos implementaciones de la misma forma cerrada: la del motor, en Python, y la del navegador, en TypeScript, escrita por separado para que el acuerdo sea una comprobacion y no una copia. El banco de trabajo muestra ese acuerdo en el punto de operacion del caso; aqui el navegador recalcula toda la rejilla que el horneado comprometio, incluida la integral eliptica cerca de su singularidad, y se muestra la peor desviacion relativa.'
          : "The live lane carries two implementations of the same closed form: the engine's, in Python, and the browser's, in TypeScript, written separately so that agreement is a check rather than a copy. The workbench shows that agreement at the case's working point; here the browser recomputes the whole grid the bake committed, the elliptic integral near its singularity included, and the worst relative deviation is shown."}{' '}
        <Cite id="vlasov2022" />
      </p>
      {parity ? (
        <LiveParity fixture={parity} es={es} />
      ) : (
        <p className="muted">{es ? 'Cargando la paridad...' : 'Loading the parity fixture...'}</p>
      )}
      <h2>{es ? 'Comprobacion externa' : 'External cross-check'}</h2>
      <p>
        {es
          ? 'El piso bajo cada costo que publica este producto es una barrera de energia calculada por el metodo de cuerda del propio motor. Si ese metodo estuviera mal, todos los pisos estarian mal a la vez y ninguna prueba interna lo notaria. Spirit es un marco de dinamica de espines atomistica escrito por otras personas, y su banda elastica geodesica es otro metodo para el mismo objeto: se le da el mismo hamiltoniano y el mismo camino inicial, y se compara la barrera. Spirit no es una dependencia de este producto y CI nunca lo instala.'
          : "The floor under every cost this product publishes is an energy barrier computed by the engine's own string method. If that method were wrong, every floor would be wrong together and no internal test would notice. Spirit is an atomistic spin-dynamics framework written by other people, and its geodesic nudged elastic band is a different method for the same object: it is given the same Hamiltonian and the same initial path, and the barriers are compared. Spirit is not a dependency of this product, and CI never installs it."}{' '}
        <Cite id="bessarab2015" />
      </p>
      {crosscheck ? (
        <div data-testid="external-crosscheck" data-agrees={String(crosscheck.agrees)}>
          <p className="muted">
            {es ? 'Peor diferencia relativa' : 'Worst relative deviation'}:{' '}
            <strong data-testid="crosscheck-worst">{crosscheck.worst_relative_difference.toExponential(2)}</strong>{' '}
            {es ? 'contra una tolerancia de' : 'against a tolerance of'} {crosscheck.tolerance.toExponential(0)}.{' '}
            <span className={crosscheck.agrees ? 'prov-badge prov-measured' : 'prov-badge prov-assumed'}>
              {crosscheck.agrees ? (es ? 'de acuerdo' : 'agree') : es ? 'en desacuerdo' : 'disagree'}
            </span>{' '}
            spinoct {crosscheck.engines.spinoct}, Spirit {crosscheck.engines.spirit}, {crosscheck.measured_on}.
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>N</th>
                  <th>{es ? 'spinoct (cuerda)' : 'spinoct (string)'}</th>
                  <th>Spirit (GNEB)</th>
                  <th>{es ? 'Diferencia' : 'Difference'}</th>
                </tr>
              </thead>
              <tbody>
                {crosscheck.rows.map((row) => (
                  <tr key={row.n_sites}>
                    <td>{row.n_sites}</td>
                    <td>{row.spinoct_barrier_over_k.toFixed(6)} K</td>
                    <td>{row.spirit_barrier_over_k.toFixed(6)} K</td>
                    <td>{row.relative_difference.toExponential(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p className="muted">{es ? 'Cargando la comprobacion...' : 'Loading the cross-check...'}</p>
      )}
      <Refs ids={['kwiatkowski2021', 'vlasov2022', 'badarneh2023', 'scheie2022', 'ruiz2024', 'evans2014']} label="Refs" />
    </article>
  );
}

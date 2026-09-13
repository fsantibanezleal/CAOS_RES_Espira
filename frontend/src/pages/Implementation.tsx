// Implementation: how the product is built, the engine, the pipeline, the honesty of the lanes.

import { useShellLang, Cite, Refs } from '@fasl-work/caos-app-shell';

export function Implementation(): React.JSX.Element {
  const lang = useShellLang();
  const es = lang === 'es';
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
          ? 'La verdad canonica se hornea sin conexion con spinoct y se compromete como artefactos JSON con suma de verificacion. Esta pagina web reproduce esos artefactos; nunca recalcula. El motor de atomistica pesado (VAMPIRE) se llama como proceso separado para verificacion, nunca enlazado, manteniendo spinoct bajo licencia MIT.'
          : 'The canonical truth is baked offline with spinoct and committed as checksummed JSON artifacts. This web page replays those artifacts; it never recomputes. The heavy atomistic engine (VAMPIRE) is called as a separate process for verification, never linked, keeping spinoct MIT-licensed.'}{' '}
        <Cite id="evans2014" />
      </p>
      <Refs ids={['kwiatkowski2021', 'vlasov2022', 'badarneh2023', 'scheie2022', 'ruiz2024', 'evans2014']} label="Refs" />
    </article>
  );
}

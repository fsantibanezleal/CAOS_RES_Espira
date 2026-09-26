// Introduction: what Espira is, for whom, the physics in its governing equations with a symbol glossary,
// the pipeline from a published number to a page, what was checked against other people's codes, and what
// is exact, illustrative or not claimed (ADR-0017 section 2). Facts transcribed from the research dossiers
// (CAOS_MANAGE wip/espira/01, 03, 06) and this repository's docs/.

import { useShellLang, Equation, InlineMath, Figure, Cite, Refs } from '@fasl-work/caos-app-shell';

type Lang = 'en' | 'es';

function pick(lang: Lang, en: string, es: string): string {
  return lang === 'es' ? es : en;
}

function OverviewDiagram({ lang }: { lang: Lang }): React.JSX.Element {
  const boxes: { x: number; title: string; sub: string; accent?: boolean }[] = [
    { x: 20, title: pick(lang, 'Published parameters', 'Parámetros publicados'), sub: pick(lang, 'one row per value, DOI, unit', 'una fila por valor, DOI, unidad') },
    { x: 200, title: pick(lang, 'Contract 1', 'Contrato 1'), sub: pick(lang, 'ingest, canonical units, flags', 'ingesta, unidades canónicas, marcas') },
    { x: 380, title: 'spinoct', sub: pick(lang, 'the engine, pinned from PyPI', 'el motor, fijado desde PyPI'), accent: true },
    { x: 560, title: pick(lang, 'Bake', 'Cálculo previo'), sub: pick(lang, '26 cases x methods x variants', '26 casos x métodos x variantes') },
  ];
  return (
    <svg className="fig-svg wide" viewBox="0 0 760 330" role="img" aria-label={pick(lang, 'From published parameters through the engine and the bake to the committed artifacts and the web', 'De los parámetros publicados, por el motor y el cálculo previo, a los artefactos y la web')}>
      <defs>
        <marker id="ov-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0 0 L6 4 L0 8 z" className="dg-fill-accent" />
        </marker>
      </defs>
      {boxes.map((b) => (
        <g key={b.title}>
          <rect x={b.x} y="40" width="170" height="64" rx="10" className={b.accent ? 'dg-box accent' : 'dg-box'} />
          <text x={b.x + 12} y="66" className={b.accent ? 'dg-box-title accent' : 'dg-box-title'}>{b.title}</text>
          <text x={b.x + 12} y="88" className="dg-box-sub">{b.sub}</text>
        </g>
      ))}
      <line x1="190" y1="72" x2="200" y2="72" className="dg-edge" markerEnd="url(#ov-arrow)" />
      <line x1="370" y1="72" x2="380" y2="72" className="dg-edge" markerEnd="url(#ov-arrow)" />
      <line x1="550" y1="72" x2="560" y2="72" className="dg-edge" markerEnd="url(#ov-arrow)" />

      <rect x="380" y="140" width="350" height="64" rx="10" className="dg-box" />
      <text x="392" y="166" className="dg-box-title">{pick(lang, 'Committed artifacts and manifests', 'Artefactos y manifiestos en el repositorio')}</text>
      <text x="392" y="188" className="dg-box-sub">{pick(lang, 'JSON, sha256, seed, engine version, lane verdict', 'JSON, sha256, semilla, versión del motor, veredicto de carril')}</text>
      <line x1="645" y1="104" x2="645" y2="140" className="dg-edge" markerEnd="url(#ov-arrow)" />

      <rect x="20" y="140" width="330" height="64" rx="10" className="dg-box good" />
      <text x="32" y="166" className="dg-box-title">{pick(lang, 'Checked against other codes', 'Comprobado contra otros códigos')}</text>
      <text x="32" y="188" className="dg-box-sub">{pick(lang, 'Spirit (barrier), VAMPIRE (dynamics), published numbers', 'Spirit (barrera), VAMPIRE (dinámica), números publicados')}</text>
      <line x1="380" y1="172" x2="350" y2="172" className="dg-edge" markerEnd="url(#ov-arrow)" />

      <rect x="380" y="240" width="350" height="64" rx="10" className="dg-box accent" />
      <text x="392" y="266" className="dg-box-title accent">{pick(lang, 'This web app: replay', 'Esta aplicación web: reproducción')}</text>
      <text x="392" y="288" className="dg-box-sub">{pick(lang, 'six pages; two cases recomputed live in the browser', 'seis páginas; dos casos recalculados en vivo en el navegador')}</text>
      <line x1="555" y1="204" x2="555" y2="240" className="dg-edge" markerEnd="url(#ov-arrow)" />

      <rect x="20" y="240" width="330" height="64" rx="10" className="dg-box" />
      <text x="32" y="266" className="dg-box-title">{pick(lang, 'Manuscripts M1 and M2', 'Manuscritos M1 y M2')}</text>
      <text x="32" y="288" className="dg-box-sub">{pick(lang, 'tables generated from the same artifacts', 'tablas generadas desde los mismos artefactos')}</text>
      <line x1="380" y1="272" x2="350" y2="272" className="dg-edge" markerEnd="url(#ov-arrow)" />
      <text x="20" y="324" className="dg-note">{pick(lang, 'offline is canonical truth; the web never recomputes a published number except in the measured live lane', 'el cálculo previo es la verdad canónica; la web nunca recalcula un número publicado salvo en el carril en vivo medido')}</text>
    </svg>
  );
}

function Glossary({ lang }: { lang: Lang }): React.JSX.Element {
  const es = lang === 'es';
  const items: [string, string][] = [
    ['s', es ? 'la dirección del momento magnético, un vector unitario; el macrospin es un solo s' : 'the direction of the magnetic moment, a unit vector; the macrospin is a single s'],
    ['alpha', es ? 'el amortiguamiento de Gilbert, adimensional; el parámetro peor medido de la familia y asumido para la mayoría de los materiales' : 'the Gilbert damping, dimensionless; the worst-measured parameter of the family, assumed for most materials'],
    ['gamma', es ? 'la razón giromagnética, en radianes por segundo por tesla' : 'the gyromagnetic ratio, in radians per second per tesla'],
    ['mu', es ? 'la magnitud del momento por ion magnético, en magnetones de Bohr' : 'the moment magnitude per magnetic ion, in Bohr magnetons'],
    ['K', es ? 'la anisotropía uniaxial por ion magnético sobre vectores unitarios, E = -K s_z^2, en meV' : 'the uniaxial anisotropy per magnetic ion on unit vectors, E = -K s_z^2, in meV'],
    ['xi', es ? 'la razón de eje duro, E = xi K s_x^2 - K s_z^2; cero en un imán uniaxial' : 'the hard-axis ratio, E = xi K s_x^2 - K s_z^2; zero in a uniaxial magnet'],
    ['tau0 = mu / (2 gamma K)', es ? 'el tiempo de Larmor de la anisotropía; todo tiempo de conmutación se declara en múltiplos de él' : 'the Larmor time of the anisotropy; every switching time is declared in multiples of it'],
    ['T', es ? 'el tiempo de conmutación, el plazo dentro del cual el momento debe llegar a -z' : 'the switching time, the deadline within which the moment must reach -z'],
    ['b(t)', es ? 'el campo aplicado, en tesla; el control en el problema de campo' : 'the applied field, in tesla; the control in the field-driven problem'],
    ['j(t), j0 = K / (mu xi)', es ? 'la corriente de espín-órbita y su unidad reducida; el control en el problema de corriente' : 'the spin-orbit-torque current and its reduced unit; the control in the current-driven problem'],
    ['Phi', es ? 'el costo de la fuente, la integral del campo al cuadrado, en tesla al cuadrado por segundo' : 'the source cost, the integral of the squared field, in tesla squared second'],
    ['Phi_inf = 4 alpha K / (gamma mu)', es ? 'el piso universal: ningún protocolo baja de él, y es lineal en alpha' : 'the universal floor: no protocol goes below it, and it is linear in alpha'],
    ['Phi_f = pi^2 (1 + alpha^2) / (gamma^2 T)', es ? 'el costo de macrospin libre; solo un eje duro puede bajar de él' : 'the free-macrospin cost; only a hard axis can go below it'],
    ['B_r', es ? 'la componente longitudinal del campo, paralela al momento, que estabiliza y cuesta' : 'the longitudinal component of the field, parallel to the moment, which stabilizes and costs'],
    ['J', es ? 'el intercambio a primeros vecinos de una cadena o un parche, en unidades de K' : 'the nearest-neighbour exchange of a chain or a patch, in units of K'],
    ['dE_MEP', es ? 'la barrera del camino de mínima energía; fija el piso 4 alpha dE_MEP / (gamma mu)' : 'the barrier of the minimum energy path; it sets the floor 4 alpha dE_MEP / (gamma mu)'],
    ['K / k_B T', es ? 'el factor de estabilidad térmica de un sitio; la variante de los casos térmicos' : 'the thermal stability factor of one site; the variant of the thermal cases'],
    ['R00 a R16', es ? 'los peldaños del método: qué calculó cada número, en cada fila de cada artefacto' : 'the rungs of the method ladder: what computed every number, on every row of every artifact'],
  ];
  return (
    <dl className="glossary">
      {items.map(([sym, def]) => (
        <div key={sym}>
          <dt>
            <code>{sym}</code>
          </dt>
          <dd>{def}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Introduction(): React.JSX.Element {
  const lang = useShellLang();
  const es = lang === 'es';
  return (
    <article className="prose page-body">
      <div className="page-head">
        <h1>{es ? 'Introducción' : 'Introduction'}</h1>
        <p className="lede">
          {es
            ? 'Espira calcula el pulso de campo o de corriente que invierte un bit magnético bidimensional dentro de un tiempo dado con la menor energía disipada en la fuente, reproduce los resultados publicados de la teoría de control óptimo como piso de verificación y mide lo que la literatura aún no había medido: el control más allá del macrospin, el precio de un pulso realizable, el costo de la fiabilidad térmica y la co-optimización de campo y corriente. La cantidad que reporta es '
            : 'Espira computes the field or current pulse that reverses a two-dimensional magnetic bit within a given time for the least energy dissipated in the source, reproduces the published results of optimal control theory as a verification floor, and measures what the literature had not: control beyond the macrospin, the price of a realizable pulse, the cost of thermal reliability and the co-optimization of field and current. The quantity it reports is '}
          <InlineMath tex={String.raw`\Phi = \int_0^T |\vec b|^2\,dt`} />
          {es
            ? ' en tesla al cuadrado por segundo, nunca un julio sin un modelo de circuito declarado, y no es una reimplementación del artículo de referencia ni una emulación de un dispositivo.'
            : ' in tesla squared second, never a joule without a declared circuit model, and it is neither a reimplementation of the kickoff paper nor an emulation of a device.'}
        </p>
      </div>

      <section>
        <h2>{es ? 'El bit, el pulso y la cuenta' : 'The bit, the pulse and the bill'}</h2>
        <p>
          {es
            ? 'El almacenamiento de datos consume una fracción creciente de la energía mundial, y en una memoria magnética la escritura es la inversión de un momento. Un bit bidimensional es una monocapa o unas pocas capas de un imán de van der Waals, CrSBr, Fe3GaTe2, Fe3GeTe2 o un trihaluro de cromo, con una anisotropía que fija a la vez cuánto cuesta escribirlo y cuánto tiempo retiene lo escrito. El protocolo convencional aplica un campo estático antiparalelo por encima del campo de conmutación de Stoner-Wohlfarth y espera a que el amortiguamiento haga el trabajo: lento y caro. El trabajo de referencia mostró que la teoría de control óptimo produce pulsos conformados que invierten la magnetización dentro del rango de picosegundos con energías de conmutación de 9,7 a 0,94 nJ, hasta dos órdenes de magnitud por debajo de los 91,2 a 42,8 nJ de los protocolos de campo convencionales, y que en CrSBr a 126 ps el campo estático necesita 1 T donde el pulso óptimo necesita 150 mT.'
            : 'Data storage consumes a growing share of the world’s energy, and in a magnetic memory writing is the reversal of a moment. A two-dimensional bit is a monolayer or a few layers of a van der Waals magnet, CrSBr, Fe3GaTe2, Fe3GeTe2 or a chromium trihalide, with an anisotropy that sets at once how much it costs to write and how long it retains what was written. The conventional protocol applies a static antiparallel field above the Stoner-Wohlfarth switching field and waits for the damping to do the work: slow and expensive. The kickoff work showed that optimal control theory produces shaped pulses that reverse the magnetization within the picosecond range at switching energies of 9.7 to 0.94 nJ, up to two orders of magnitude below the 91.2 to 42.8 nJ of conventional field protocols, and that in CrSBr at 126 ps the static field needs 1 T where the optimal pulse needs 150 mT.'}{' '}
          <Cite id="badarneh2026" /> <Cite id="sunwang2006" />
        </p>
        <p>
          {es
            ? 'Espira toma ese resultado como piso y hace lo que la literatura no ha hecho: control óptimo sobre una cadena y un parche de espines en vez de un solo momento, el mecanismo de eje duro sobre los parámetros medidos de CrSBr, el frente costo-fiabilidad de un campo estabilizador, el precio de un pulso limitado en amplitud o en ancho de banda, y la optimización conjunta de campo y corriente de espín-órbita. Cada uno es un peldaño del método con un código, de R00 a R16, y cada número del producto lleva el suyo.'
            : 'Espira takes that result as a floor and does what the literature has not: optimal control over a chain and a patch of spins instead of a single moment, the hard-axis mechanism on the measured parameters of CrSBr, the cost-reliability front of a stabilizing field, the price of an amplitude-limited or band-limited pulse, and the joint optimization of field and spin-orbit-torque current. Each is a rung of the method ladder with a code, R00 to R16, and every number in the product carries its own.'}
        </p>
        <Figure caption={es ? 'El producto de un vistazo: parámetros publicados con su DOI, el contrato que los canoniza, el motor spinoct, el cálculo previo, los artefactos con su manifiesto, y esta web que los reproduce; las comprobaciones externas y los manuscritos leen los mismos artefactos.' : 'The product at a glance: published parameters with their DOI, the contract that canonicalizes them, the spinoct engine, the bake, the artifacts with their manifests, and this web app replaying them; the external checks and the manuscripts read the same artifacts.'}>
          <OverviewDiagram lang={lang} />
        </Figure>
      </section>

      <section>
        <h2>{es ? 'Quién pregunta, y qué página responde' : 'Who asks, and which page answers'}</h2>
        <p>
          {es
            ? 'Un diseñador de dispositivos que elige un material y un plazo encuentra en la App el caso seleccionado: su trayectoria sobre la esfera, su curva de costo frente al tiempo de conmutación con el costo libre y el piso, la forma del pulso y el contexto de por qué existe el caso y qué lo refutaría, con cada parámetro del material marcado como medido, calculado, derivado o asumido. Un físico que quiere saber si la lineamiento de control óptimo se sostiene encuentra en Metodología las ecuaciones que el motor evalúa y en Experimentos las medidas cruzadas: dónde paga el eje duro, cuándo una cadena deja de invertirse coherentemente, cuánto cuesta la fiabilidad, qué predice el sustituto barato del conjunto térmico. Quien necesita confiar en los números encuentra en Implementación las dos comprobaciones contra códigos ajenos y la paridad del carril en vivo, y en Comparativa la matriz completa de métodos por caso y la evidencia de la versión, con el hash de cada artefacto.'
            : 'A device designer choosing a material and a deadline finds the selected case on the App: its trajectory on the sphere, its cost curve against the switching time with the free cost and the floor, the shape of the pulse and the context of why the case exists and what would refute it, with every material parameter badged as measured, computed, derived or assumed. A physicist asking whether the optimal-control lineage holds up finds on Methodology the equations the engine evaluates and on Experiments the cross-case measurements: where the hard axis pays, when a chain stops reversing coherently, what reliability costs, what the cheap substitute for the thermal ensemble predicts. Whoever needs to trust the numbers finds on Implementation the two checks against other people’s codes and the live-lane parity, and on Benchmark the complete method-by-case matrix and the release evidence, with the hash of every artifact.'}
        </p>
        <p>
          {es
            ? 'Lo que el producto no es: no es una emulación de un dispositivo completo, no es un competidor de los códigos micromagnéticos de diseño inverso, y no afirma cifras en julios por bit. Los datos reales del problema son los parámetros del hamiltoniano de espín de cada material, cada uno con su DOI, su método y su incertidumbre; no existe un conjunto de datos experimental público de conmutación por pulsos conformados en estos materiales, y el producto lo dice en vez de fabricar uno.'
            : 'What the product is not: it is not an emulation of a complete device, not a competitor to the inverse-design micromagnetic codes, and it claims no joule-per-bit figures. The real data of the problem is the set of spin-Hamiltonian parameters of each material, each with its DOI, its method and its uncertainty; no public experimental dataset of shaped-pulse switching in these materials exists, and the product says so instead of fabricating one.'}
        </p>
      </section>

      <section>
        <h2>{es ? 'La física en tres ecuaciones' : 'The physics in three equations'}</h2>
        <p>
          {es
            ? 'El momento obedece la ecuación de Landau-Lifshitz-Gilbert: precesa alrededor del campo total, interno más aplicado, y se amortigua hacia él con una tasa fijada por alfa. El campo interno deriva de la energía del material sin su término Zeeman; para un imán uniaxial es 2 K s_z / mu a lo largo del eje fácil.'
            : 'The moment obeys the Landau-Lifshitz-Gilbert equation: it precesses about the total field, internal plus applied, and damps toward it at a rate set by alpha. The internal field derives from the material’s energy without its Zeeman term; for a uniaxial magnet it is 2 K s_z / mu along the easy axis.'}
        </p>
        <Equation
          tex={String.raw`(1+\alpha^2)\,\dot{\vec s} = -\gamma\,\vec s \times (\vec b_i + \vec b) - \alpha\gamma\,\vec s \times [\vec s \times (\vec b_i + \vec b)]`}
          caption={es ? 'La ecuación de movimiento, con el campo aplicado b sumado al campo interno b_i.' : 'The equation of motion, with the applied field b added to the internal field b_i.'}
        />
        <p>
          {es
            ? 'El costo es la energía que disipa el circuito que genera el campo, proporcional a la integral del campo al cuadrado. Invertir la ecuación de movimiento expresa el campo en función de la trayectoria y convierte la optimización con restricción en una sin restricción sobre la trayectoria sola; su minimizador es la trayectoria de control óptimo.'
            : 'The cost is the energy dissipated by the circuit that generates the field, proportional to the integral of the squared field. Inverting the equation of motion expresses the field as a function of the trajectory and turns the constrained optimization into an unconstrained one over the trajectory alone; its minimizer is the optimal control path.'}{' '}
          <Cite id="kwiatkowski2021" />
        </p>
        <Equation
          tex={String.raw`\Phi = \int_0^T |\vec b(t)|^2\,dt,\qquad \vec b = \frac{\alpha}{\gamma}\,\dot{\vec s} + \frac{1}{\gamma}\,\vec s\times\dot{\vec s} - \vec b_i^{\perp}`}
          caption={es ? 'El costo de la fuente, en T^2 s, y la relación inversa que lo vuelve un funcional de la trayectoria.' : 'The source cost, in T^2 s, and the inverse relation that makes it a functional of the trajectory.'}
        />
        <p>
          {es
            ? 'Dos referencias encierran todo costo del producto. El costo de macrospin libre es lo que cuesta girar un momento sin potencial alguno en el tiempo T, y la anisotropía de eje fácil nunca baja de él; el piso universal es el límite de tiempo infinito, lineal en el amortiguamiento, y ningún protocolo baja de él. Cada curva de costo del banco de trabajo se dibuja entre ambos, con la banda que abre la incertidumbre del amortiguamiento.'
            : 'Two references bracket every cost in the product. The free-macrospin cost is what turning a moment with no potential at all costs in time T, and easy-axis anisotropy never goes below it; the universal floor is the infinite-time limit, linear in the damping, and no protocol goes below it. Every cost curve on the workbench is drawn between the two, with the band the damping uncertainty opens.'}
        </p>
        <Equation
          tex={String.raw`\Phi_f = \frac{\pi^2(1+\alpha^2)}{\gamma^2 T},\qquad \Phi_\infty = \frac{4\alpha K}{\gamma\mu},\qquad \tau_0 = \frac{\mu}{2\gamma K}`}
          caption={es ? 'El costo libre, el piso universal y el tiempo de Larmor que fija la escala de todo tiempo de conmutación.' : 'The free cost, the universal floor and the Larmor time that sets the scale of every switching time.'}
        />
      </section>

      <section>
        <h2>{es ? 'Símbolos' : 'Symbols'}</h2>
        <p>
          {es
            ? 'Los símbolos que usan todas las páginas, con la unidad en que el producto los lleva. Las cantidades reducidas, tiempos en tau0, campos en campos de anisotropía, corrientes en j0, son las que hacen comparables los materiales entre sí.'
            : 'The symbols every page uses, with the unit the product carries them in. The reduced quantities, times in tau0, fields in anisotropy fields, currents in j0, are what make the materials comparable with each other.'}
        </p>
        <Glossary lang={lang} />
      </section>

      <section>
        <h2>{es ? 'De un número publicado a una página' : 'From a published number to a page'}</h2>
        <p>
          {es
            ? 'Una versión del producto es una función pura de sus entradas y sus semillas, corrida por etapas nombradas; ninguna etapa se salta y una celda faltante en la matriz de métodos rechaza la versión en vez de acortar un promedio.'
            : 'A release of the product is a pure function of its inputs and its seeds, run through named stages; no stage is skipped and a missing cell in the method matrix refuses the release instead of shortening an average.'}
        </p>
        <ol>
          <li>{es ? 'Ingesta: cada valor publicado entra como una fila con su unidad, su base, su procedencia y su DOI; una fila sin DOI, fuera de rango o duplicada se rechaza con la razón.' : 'Ingest: every published value enters as a row with its unit, its basis, its provenance and its DOI; a row without a DOI, out of range or duplicated is rejected with the reason.'}</li>
          <li>{es ? 'Preprocesamiento: conversión a la forma canónica, K en meV por ion sobre vectores unitarios, con las constantes CODATA del motor; los valores convertidos y los asumidos quedan marcados.' : 'Preprocess: conversion to the canonical form, K in meV per ion on unit vectors, with the engine’s CODATA constants; converted and assumed values stay flagged.'}</li>
          <li>{es ? 'Conjunto de datos: el registro declara 26 casos, sus métodos, sus variantes y la partición de materiales retenidos para el método aprendido.' : 'Dataset: the registry declares 26 cases, their methods, their variants and the split of held-out materials for the learned method.'}</li>
          <li>{es ? 'Rasgos y entrenamiento: las coordenadas adimensionales que consume la política amortizada, y su entrenamiento con la compuerta de aceptación que debe pasar.' : 'Features and training: the dimensionless coordinates the amortized policy consumes, and its training with the acceptance gate it must pass.'}</li>
          <li>{es ? 'Inferencia: cada método que un caso declara corre sobre cada variante con spinoct, o dice por qué no aplica.' : 'Inference: every method a case declares runs over every variant with spinoct, or says why it does not apply.'}</li>
          <li>{es ? 'Evaluación: razones al oráculo de forma cerrada donde existe, completitud de la matriz, veredicto de carril medido en tiempo de ejecución y tamaño.' : 'Evaluate: ratios to the closed-form oracle where one exists, completeness of the matrix, the lane verdict measured in runtime and size.'}</li>
          <li>{es ? 'Exportación y validación: los artefactos JSON con su manifiesto, semilla, versión del motor y sha256; la validación recalcula el hash y rechaza un artefacto alterado o desactualizado.' : 'Export and validate: the JSON artifacts with their manifest, seed, engine version and sha256; validation recomputes the hash and refuses a tampered or stale artifact.'}</li>
          <li>{es ? 'Reproducción: esta web lee los artefactos en tiempo de construcción; dos casos, C03 y C10, pasan la compuerta de carril y se recalculan en el navegador para mostrar el acuerdo.' : 'Replay: this web app reads the artifacts at build time; two cases, C03 and C10, pass the lane gate and are recomputed in the browser to show the agreement.'}</li>
        </ol>
      </section>

      <section>
        <h2>{es ? 'Lo que se comprobó contra otros' : 'What has been checked against someone else'}</h2>
        <p>
          {es
            ? 'Un producto que solo se pone de acuerdo consigo mismo no es evidencia de nada. Los campos pico publicados por el trabajo de referencia se reproducen en tres de sus cuatro puntos, y el cuarto se muestra tal cual; la tabla de robustez térmica del artículo biaxial se reproduce en sus ocho celdas (Experimentos, Replicaciones publicadas). La barrera de energía bajo cada piso la recalcula Spirit con su banda elástica geodésica, otro método para el mismo objeto, sobre las dos geometrías que el producto usa; la ecuación de movimiento la reintegra VAMPIRE como proceso separado, con su propio integrador (Implementación). Un protocolo publicado, la corriente rotatoria con barrido de frecuencia, no se reproduce, y el producto lo registra como no replicación con los valores publicados fijados junto a los suyos.'
            : 'A product that only agrees with itself is not evidence of anything. The kickoff work’s published peak fields reproduce at three of its four quoted points, and the fourth is shown as it is; the biaxial paper’s thermal-robustness table reproduces in all eight of its cells (Experiments, Published replications). The energy barrier under every floor is recomputed by Spirit with its geodesic nudged elastic band, a different method for the same object, on both geometries the product uses; the equation of motion is re-integrated by VAMPIRE as a separate process, with its own integrator (Implementation). One published protocol, the rotating current with a frequency sweep, does not reproduce, and the product records it as a non-replication with the published values pinned beside its own.'}{' '}
          <Cite id="badarneh2023" /> <Cite id="bessarab2015" /> <Cite id="evans2014" />
        </p>
      </section>

      <section>
        <h2>{es ? 'Exacto, ilustrativo y no afirmado' : 'Exact, illustrative and not claimed'}</h2>
        <p>
          {es
            ? 'Exacto: las formas cerradas uniaxial y de espín-órbita, sus identidades, y los artefactos que el motor produce a partir de parámetros con DOI, cada uno con su hash. Medido con sus límites declarados: los mapas y frentes de Experimentos, que son cotas o barridos en unidades reducidas sobre el macrospin sintético de referencia o sobre cadenas sin material asociado, y las tasas de éxito con su intervalo binomial. Ilustrativo: las trayectorias dibujadas en tres casos que no son literalmente el objeto medido, cada una con su nota en pantalla. No afirmado: energías en julios, energías de celda de dispositivos comerciales como factores de reducción, la proximidad al límite de Landauer, y el óptimo global de las inversiones no uniformes, que está acotado y no ubicado. El costo de conmutación es una integral en tesla al cuadrado por segundo; el piso es lineal en el amortiguamiento, el parámetro menos conocido, así que cada energía se reporta como banda y no como un número único.'
            : 'Exact: the uniaxial and spin-orbit-torque closed forms, their identities, and the artifacts the engine produces from parameters with a DOI, each with its hash. Measured with its stated limits: the maps and fronts of Experiments, which are bounds or sweeps in reduced units on the synthetic reference macrospin or on chains with no material attached, and the success rates with their binomial interval. Illustrative: the drawn trajectories of three cases that are not literally the measured object, each with its note on screen. Not claimed: energies in joules, cell energies of commercial devices as reduction factors, proximity to the Landauer limit, and the global optimum of the nonuniform reversals, which is bracketed and not located. The switching cost is an integral in tesla squared second; the floor is linear in the damping, the least well pinned parameter, so every energy is reported as a band rather than a single number.'}
        </p>
        <Refs ids={['badarneh2026', 'kwiatkowski2021', 'badarneh2023', 'sunwang2006', 'bessarab2015', 'evans2014']} label="Refs" />
      </section>
    </article>
  );
}

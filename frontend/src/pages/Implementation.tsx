// Implementation: how the product is built, transcribed from docs/architecture (overview, data contracts,
// staged pipeline, deploy), docs/frameworks/spinoct and the results pages of the two external checks.
// Six groups with sub-tabs (ADR-0017, at most six peers per row per ADR-0071 section 5): the
// architecture, the engine, the data contracts, the staged pipeline, the checks against other codes and
// the deploy with its gates. The data-driven panels (live-lane parity, the Spirit barrier, the VAMPIRE
// dynamics) keep their test ids; e2e/parity.mjs opens the tabs it reads.

import { useEffect, useState } from 'react';
import { useShellLang, Tabs, SubTabs, Callout, Figure, Cite, Refs } from '@fasl-work/caos-app-shell';
import type { ExternalCrosscheck, ExternalDynamicsCrosscheck, LiveParityFixture } from '../data/contract';
import { loadExternalCrosscheck, loadExternalDynamics, loadLiveParity } from '../data/load';
import { LiveParity } from '../viz/LiveParity';
import { DataText } from '../content/dataText';

type Lang = 'en' | 'es';

function pick(lang: Lang, en: string, es: string): string {
  return lang === 'es' ? es : en;
}

function ArchitectureDiagram({ lang }: { lang: Lang }): React.JSX.Element {
  const stages = ['ingest', 'preprocess', 'dataset', 'features', 'train', 'infer', 'evaluate', 'export', 'validate'];
  return (
    <svg className="fig-svg wide" viewBox="0 0 760 340" role="img" aria-label={pick(lang, 'Two repositories, three lanes and the nine stages of a release', 'Dos repositorios, tres carriles y las nueve etapas de una versión')}>
      <defs>
        <marker id="ar-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0 0 L6 4 L0 8 z" className="dg-fill-accent" />
        </marker>
      </defs>
      <rect x="20" y="24" width="300" height="86" rx="10" className="dg-box accent" />
      <text x="34" y="50" className="dg-box-title accent">CAOS_SpinOCT · spinoct</text>
      <text x="34" y="72" className="dg-box-sub">{pick(lang, 'the engine: units, dynamics, analytic and numerical', 'el motor: unidades, dinámica, control analítico y numérico')}</text>
      <text x="34" y="92" className="dg-box-sub">{pick(lang, 'optimal control, baselines, GRAPE, CRAB, lattice; PyPI, MIT', 'líneas base, GRAPE, CRAB, red; PyPI, MIT')}</text>
      <rect x="440" y="24" width="300" height="86" rx="10" className="dg-box" />
      <text x="454" y="50" className="dg-box-title">CAOS_RES_Espira</text>
      <text x="454" y="72" className="dg-box-sub">{pick(lang, 'the product: materials, cases, bakes, artifacts,', 'el producto: materiales, casos, cálculos, artefactos,')}</text>
      <text x="454" y="92" className="dg-box-sub">{pick(lang, 'the web app, the manuscripts; pins the engine', 'la web, los manuscritos; fija la versión del motor')}</text>
      <line x1="320" y1="67" x2="440" y2="67" className="dg-edge" markerEnd="url(#ar-arrow)" />
      <text x="336" y="60" className="dg-edge-label">pip install spinoct==x.y.z</text>

      <text x="20" y="146" className="dg-box-title">{pick(lang, 'the offline lane: python data-pipeline/run.py all', 'el carril fuera de línea: python data-pipeline/run.py all')}</text>
      {stages.map((s, i) => (
        <g key={s}>
          <rect x={20 + i * 80} y="158" width="72" height="34" rx="7" className={i === 8 ? 'dg-box good' : 'dg-box'} />
          <text x={26 + i * 80} y="180" className="dg-box-sub">{s}</text>
          {i < 8 ? <line x1={92 + i * 80} y1="175" x2={100 + i * 80} y2="175" className="dg-edge" /> : null}
        </g>
      ))}
      <text x="20" y="214" className="dg-note">{pick(lang, 'each stage a pure function of its inputs and seeds; a missing cell refuses the release', 'cada etapa es función pura de sus entradas y semillas; una celda faltante rechaza la versión')}</text>

      <rect x="20" y="236" width="220" height="76" rx="10" className="dg-box" />
      <text x="34" y="260" className="dg-box-title">{pick(lang, 'data/artifacts + manifests', 'data/artifacts + manifests')}</text>
      <text x="34" y="280" className="dg-box-sub">{pick(lang, 'JSON, sha256, seed, engine, lane', 'JSON, sha256, semilla, motor, carril')}</text>
      <text x="34" y="298" className="dg-box-sub">{pick(lang, 'committed; checked by tests', 'en el repositorio; probados')}</text>
      <rect x="290" y="236" width="220" height="76" rx="10" className="dg-box accent" />
      <text x="304" y="260" className="dg-box-title accent">{pick(lang, 'replay lane: this web app', 'carril de reproducción: esta web')}</text>
      <text x="304" y="280" className="dg-box-sub">{pick(lang, 'copy-data.mjs at build time', 'copy-data.mjs al construir')}</text>
      <text x="304" y="298" className="dg-box-sub">{pick(lang, 'GitHub Pages, every route 200', 'GitHub Pages, cada ruta 200')}</text>
      <rect x="560" y="236" width="180" height="76" rx="10" className="dg-box good" />
      <text x="574" y="260" className="dg-box-title">{pick(lang, 'live lane: C03, C10', 'carril en vivo: C03, C10')}</text>
      <text x="574" y="280" className="dg-box-sub">{pick(lang, 'closed forms in TypeScript', 'formas cerradas en TypeScript')}</text>
      <text x="574" y="298" className="dg-box-sub">{pick(lang, 'gate: under 250 ms, 512 kB', 'compuerta: bajo 250 ms, 512 kB')}</text>
      <line x1="240" y1="274" x2="290" y2="274" className="dg-edge" markerEnd="url(#ar-arrow)" />
      <line x1="510" y1="274" x2="560" y2="274" className="dg-edge" markerEnd="url(#ar-arrow)" />
      <text x="20" y="334" className="dg-note">{pick(lang, 'the deploy never runs a bake; the API lane (app/) is dormant', 'el despliegue nunca corre un cálculo; el carril de API (app/) está dormido')}</text>
    </svg>
  );
}

function Architecture({ lang }: { lang: Lang }): React.JSX.Element {
  const es = lang === 'es';
  return (
    <div className="prose">
      <p>
        {es
          ? 'Espira son dos repositorios con una regla entre ellos: un producto no declara ningún paquete propio. Todo lo reutilizable vive en el motor, spinoct, un paquete de Python de código abierto bajo MIT que resuelve el control óptimo sobre la dinámica de Landau-Lifshitz-Gilbert: el contrato de unidades, la dinámica, las trayectorias analíticas uniaxial y de espín-órbita, la trayectoria numérica basada en imágenes, las líneas base, GRAPE y CRAB con el adjunto, el termostato, la cadena y el parche. El producto lo consume como dependencia fijada en sus requisitos y aporta lo que es suyo: la base de parámetros de materiales, el registro de 26 casos, los cálculos previos que conducen el motor, los artefactos con sus manifiestos, esta aplicación web y los manuscritos. No se encontró en PyPI ningún paquete que resolviera este problema; los dos códigos micromagnéticos diferenciables existentes hacen diseño inverso de geometría y material, no un impulso dependiente del tiempo.'
          : 'Espira is two repositories with one rule between them: a product declares no package of its own. Everything reusable lives in the engine, spinoct, an open-source Python package under MIT that solves optimal control over Landau-Lifshitz-Gilbert dynamics: the units contract, the dynamics, the analytic uniaxial and spin-orbit-torque paths, the image-based numerical path, the baselines, GRAPE and CRAB with the adjoint, the thermostat, the chain and the patch. The product consumes it as a dependency pinned in its requirements and contributes what is its own: the material parameter database, the registry of 26 cases, the bakes that drive the engine, the artifacts with their manifests, this web app and the manuscripts. No package on PyPI was found that solves this problem; the two existing differentiable micromagnetic codes do inverse design of geometry and material, not a time-dependent drive.'}
      </p>
      <p>
        {es
          ? 'Tres carriles. El cálculo previo fuera de línea es la verdad canónica: una orden corre las nueve etapas de una versión y escribe los artefactos JSON con suma de verificación en el repositorio. El carril de reproducción es esta web, que copia esos artefactos en tiempo de construcción y los muestra en cada página; nunca recalcula un número publicado. El carril en vivo existe solo donde una compuerta lo midió: dos casos cuyos métodos son formas cerradas bajo un presupuesto de tiempo y de tamaño se recalculan en el navegador y muestran su acuerdo con el artefacto. Un cuarto carril, una API, está dormido. Cuatro cálculos producen los artefactos: el cálculo por caso, los resultados cruzados, el mapa de cruce de la cadena libre y el barrido del parche bidimensional, estos dos en paralelo y con puntos de control porque tardan horas.'
          : 'Three lanes. The offline bake is the canonical truth: one command runs the nine stages of a release and writes the checksummed JSON artifacts into the repository. The replay lane is this web app, which copies those artifacts at build time and shows them on every page; it never recomputes a published number. The live lane exists only where a gate measured it: two cases whose methods are closed forms under a runtime and a size budget are recomputed in the browser and show their agreement with the artifact. A fourth lane, an API, is dormant. Four bakes produce the artifacts: the per-case bake, the cross-case novel results, the free chain crossover map and the two-dimensional patch sweep, the last two in parallel and checkpointed because they take hours.'}
      </p>
      <Figure caption={es ? 'Los dos repositorios, el carril fuera de línea con sus nueve etapas, los artefactos con su manifiesto, y los carriles de reproducción y en vivo de esta web.' : 'The two repositories, the offline lane with its nine stages, the artifacts with their manifests, and the replay and live lanes of this web app.'}>
        <ArchitectureDiagram lang={lang} />
      </Figure>
      <p>
        {es
          ? 'El registro declara los 26 casos del plan validado; 25 están calculados y ninguno bloqueado. El que queda planificado es C16, Fe5GeTe2, porque ninguna fuente reporta su anisotropía perpendicular, su momento y su amortiguamiento en un mismo régimen, y el caso lo dice en vez de tomar prestados números de tres fuentes. Los conteos se leen del índice de artefactos en tiempo de construcción; la matriz de cobertura de Experimentos los muestra todos.'
          : 'The registry declares the 26 cases of the validated plan; 25 are baked and none is blocked. The one left planned is C16, Fe5GeTe2, because no source reports its perpendicular anisotropy, moment and damping in one regime, and the case says so rather than borrowing numbers from three sources. The counts are read from the artifact index at build time; the coverage matrix of Experiments shows all of them.'}
      </p>
    </div>
  );
}

function Engine({ lang }: { lang: Lang }): React.JSX.Element {
  const es = lang === 'es';
  const modules: [string, string, string][] = [
    ['spinoct.analytic.UniaxialOptimalControl, cost_free_macrospin, cost_infinite_time', 'per-case bake: pulses, cost curves, the free cost and the floor (R05)', 'cálculo por caso: pulsos, curvas de costo, el costo libre y el piso (R05)'],
    ['spinoct.analytic.sot.SOTOptimalControl, ideal_sot_ratio_beta', 'C03, the spin-orbit-torque oracle, and the browser’s live lane (R06)', 'C03, el oráculo de espín-órbita, y el carril en vivo del navegador (R06)'],
    ['spinoct.numeric.ImageOCPSolver', 'the biaxial reduction on CrSBr, the search family, the hard-axis map (R07)', 'la reducción biaxial en CrSBr, la familia de búsqueda, el mapa de eje duro (R07)'],
    ['spinoct.control.static_switching_field', 'the static-field baseline every reduction is quoted against (R00)', 'la línea base de campo estático contra la que se cita toda reducción (R00)'],
    ['spinoct.control.GRAPESolver, CRABSolver, HybridSolver', 'C24, C23 and C25: the price of realizability and the joint optimum, on the adjoint gradient (R08, R09, R13)', 'C24, C23 y C25: el precio de la realizabilidad y el óptimo conjunto, sobre el gradiente adjunto (R08, R09, R13)'],
    ['spinoct.thermal.switching_success_rate, br_cost_reliability_front', 'C07 and the reliability front of manuscript M1 (R11, R12)', 'C07 y el frente de fiabilidad del manuscrito M1 (R11, R12)'],
    ['spinoct.lattice.LatticeOCPSolver, minimum_energy_path, cost_floor_from_barrier, SpinPatch', 'the free chain crossover map and the patch sweep of M2 (R16)', 'el mapa de cruce de la cadena libre y el barrido del parche de M2 (R16)'],
    ['spinoct.lattice.compare_reversal_modes', 'the two-mode comparison, superseded by the free search', 'la comparación de dos modos, reemplazada por la búsqueda libre'],
    ['spinoct.pareto', 'the device trade-off front over four objectives (R14)', 'el frente de compromisos de dispositivo sobre cuatro objetivos (R14)'],
    ['spinoct.amortized.evaluate_policy', 'C26, the amortized policy against the closed form (R15)', 'C26, la política amortizada contra la forma cerrada (R15)'],
  ];
  return (
    <div className="prose">
      <p>
        {es
          ? 'spinoct es numpy y scipy puros, seguro para Pyodide; el extra de torch agrega un carril por lotes que este producto no usa, porque el cálculo canónico corre en el carril de CPU de referencia y la integración continua no instala ninguno de los dos. Una compuerta de constantes de unidad en el repositorio del motor afirma la unidad de cada literal de los solucionadores, y la conversión de un costo a julios se niega a correr sin un modelo de circuito explícito. La versión con la que se calculó cada artefacto está en su manifiesto y en el resumen de la Comparativa; la canalización la fija en sus requisitos y una prueba sostiene la documentación al mismo número, porque una guía dijo 0.16.0 durante tres versiones del motor mientras la canalización fijaba algo más nuevo.'
          : 'spinoct is pure numpy and scipy, Pyodide-safe; the torch extra adds a batched lane this product does not use, because the canonical bake runs on the reference CPU lane and CI installs neither. A unit-constant gate in the engine repository asserts the unit of every literal in the solvers, and converting a cost to joules refuses to run without an explicit circuit model. The version every artifact was baked with is in its manifest and in the Benchmark summary; the pipeline pins it in its requirements and a test holds the documentation to the same number, because a guide said 0.16.0 for three engine releases while the pipeline pinned something newer.'}{' '}
        <Cite id="kwiatkowski2021" /> <Cite id="badarneh2023" />
      </p>
      <div className="table-wrap">
        <table data-testid="engine-modules">
          <thead>
            <tr>
              <th>{es ? 'Módulo del motor' : 'Engine module'}</th>
              <th>{es ? 'Lo que calcula aquí' : 'What it computes here'}</th>
            </tr>
          </thead>
          <tbody>
            {modules.map(([mod, en, esText]) => (
              <tr key={mod}>
                <td>
                  <code>{mod}</code>
                </td>
                <td>{es ? esText : en}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        {es
          ? 'Dos peldaños del motor no son peldaños por caso aquí, a propósito. El adjunto discreto, R10, no es un protocolo sino el gradiente exacto sobre el que optimizan los solucionadores con restricción, así que corre dentro de R08, R09 y R13 en vez de producir una fila propia. El frente de Pareto, R14, se calcula sobre un barrido completo y no por caso, así que es un cálculo cruzado que aparece como la pestaña de compromisos de dispositivo. Los peldaños R01 a R03, otras líneas base convencionales, existen en el motor y ningún caso los declara: R00 lleva el papel de línea base y agregarlos repetiría una comparación que el producto ya hace.'
          : 'Two engine rungs are not per-case rungs here, on purpose. The discrete adjoint, R10, is not a protocol but the exact gradient the constrained solvers optimize on, so it runs inside R08, R09 and R13 rather than producing a row of its own. The Pareto front, R14, is computed across a whole sweep rather than per case, so it is a cross-case bake surfaced as the device trade-offs tab. Rungs R01 to R03, further conventional baselines, exist in the engine and no case declares them: R00 carries the baseline role and adding them would repeat a comparison the product already makes.'}
      </p>
      <Callout variant="honest" title={es ? 'El defecto del motor que este producto encontró' : 'The engine defect this product found'}>
        <p>
          {es
            ? 'Los tres peldaños con restricción corrían y no convergían, que no es lo mismo que funcionar. El caso C23 declara que el costo debe bajar al crecer el ancho de banda, porque más armónicos es un conjunto factible estrictamente mayor; medido contra eso, el motor devolvía 2,2 veces el óptimo analítico con dos armónicos y 14 veces con seis, a 90 a 230 segundos por corrida. Los casos se mantuvieron bloqueados con la medición en vez de calcularse, y el motor se corrigió en spinoct 0.13.000: los tres solucionadores corren sobre el gradiente adjunto exacto a través de sus bases lineales de control, y CRAB cae de forma monótona de 2,15 a 1,13 veces el óptimo de uno a seis armónicos.'
            : 'The three constrained rungs ran and did not converge, which is not the same as working. Case C23 declares that the cost must fall as the bandwidth grows, because more harmonics is a strictly larger feasible set; measured against that, the engine returned 2.2 times the analytic optimum at two harmonics and 14 times at six, at 90 to 230 seconds per solve. The cases were held blocked with the measurement rather than baked, and the engine was fixed in spinoct 0.13.000: all three solvers run on the exact adjoint gradient through their linear control bases, and CRAB falls monotonically from 2.15 to 1.13 times the optimum across one to six harmonics.'}
        </p>
      </Callout>
    </div>
  );
}

function Contract1({ lang }: { lang: Lang }): React.JSX.Element {
  const es = lang === 'es';
  const conversions: [string, string, string, string][] = [
    ['meV, unit vector', es ? 'ninguna' : 'none', 'Fe3GaTe2: 0.31 meV per Fe (DFT)', 'Fe3GaTe2: 0,31 meV por Fe (DFT)'],
    ['meV, spin operator, -D (S^z)^2', 'K = D S^2', 'CrI3: D_z = 0.22 meV, S = 3/2, K = 0.495 meV', 'CrI3: D_z = 0,22 meV, S = 3/2, K = 0,495 meV'],
    ['erg/cm^3, volume, through the cell', 'K = 0.1 K_u / (ions / V)', 'Cr2Ge2Te6: 3.95e5 erg/cm^3, six Cr in 0.8301 nm^3, 0.0341 meV', 'Cr2Ge2Te6: 3,95e5 erg/cm^3, seis Cr en 0,8301 nm^3, 0,0341 meV'],
    ['erg/cm^3, volume, through M_s', 'n = 1000 M_s / (m mu_B)', 'Fe3GeTe2: 1.46e7 erg/cm^3 at 376 emu/cm^3 and 1.58 mu_B, 0.355 meV', 'Fe3GeTe2: 1,46e7 erg/cm^3 con 376 emu/cm^3 y 1,58 mu_B, 0,355 meV'],
  ];
  return (
    <div className="prose">
      <p>
        {es
          ? 'No hay conjunto de datos experimental público de conmutación por pulsos conformados. Los datos reales son los parámetros del hamiltoniano de espín de la familia van der Waals, y la literatura escribe la misma física en formas incompatibles: el intercambio con uno u otro signo y con o sin el factor un medio de doble conteo; la anisotropía sobre operadores de espín o sobre vectores unitarios, por ion, por fórmula, por volumen o como campo. Un número movido entre dos formas sin conversión queda mal en silencio por un factor como S al cuadrado. El Contrato 1 hace explícita la forma publicada y convierte en código: cada valor entra como una fila con su material y su parámetro (momento, anisotropía, razón de eje duro, amortiguamiento, temperatura de orden), su valor, unidad y base, la longitud de espín, los iones por celda y el volumen o la magnetización de saturación cuando la conversión los necesita, una banda opcional, su procedencia (medido, calculado, derivado o asumido), su método, uno o más DOI y su nota.'
          : 'There is no public experimental dataset of shaped-pulse switching. The real data is the set of spin-Hamiltonian parameters of the van der Waals family, and the literature writes the same physics in incompatible forms: exchange with either sign and with or without the one-half double-counting factor; anisotropy on spin operators or on unit vectors, per ion, per formula unit, per volume, or as a field. A number moved between two forms without conversion is silently wrong by a factor such as S squared. Contract 1 makes the published form explicit and converts in code: every value enters as a row with its material and parameter (moment, anisotropy, hard-axis ratio, damping, ordering temperature), its value, unit and basis, the spin length, the ions per cell and the volume or the saturation magnetization where the conversion needs them, an optional band, its provenance (measured, computed, derived or assumed), its method, one or more DOIs and its note.'}{' '}
        <Cite id="scheie2022" /> <Cite id="ruiz2024" /> <Cite id="huang2017" />
      </p>
      <div className="table-wrap">
        <table data-testid="contract1-conversions">
          <thead>
            <tr>
              <th>{es ? 'Publicado como' : 'Published as'}</th>
              <th>{es ? 'Conversión' : 'Conversion'}</th>
              <th>{es ? 'Ejemplo' : 'Example'}</th>
            </tr>
          </thead>
          <tbody>
            {conversions.map(([form, conv, en, esText]) => (
              <tr key={form}>
                <td lang="en">
                  <code>{form}</code>
                </td>
                <td>
                  <code>{conv}</code>
                </td>
                <td>{es ? esText : en}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        {es
          ? 'Las constantes, el magnetón de Bohr y el meV, vienen de las unidades del motor, los mismos valores CODATA que usan los solucionadores. Se rechaza con la razón registrada: un material o parámetro desconocido; un valor faltante, no numérico o no finito; una unidad o base no aceptada; entradas de conversión faltantes; una procedencia desconocida; un valor medido, calculado o derivado sin un DOI bien formado; un valor asumido sin justificación escrita; un valor canónico fuera de su rango físico, un momento sobre 10 magnetones, una anisotropía sobre 50 meV, un amortiguamiento de uno o más, una temperatura de orden sobre 1500 K o un valor no positivo donde cero es no físico; una banda que no contiene su valor; una fila duplicada; un material al que le falta un parámetro requerido. El cálculo canónico es estricto: un rechazo lo detiene. Se acepta con marca: todo valor asumido, una banda de amortiguamiento más ancha que un factor cuatro, y todo valor convertido desde otra unidad o base; las marcas viajan a los artefactos y el panel de parámetros de la App muestra la clase de cada valor, su forma publicada, su método, su nota y sus DOI, y cuenta los asumidos.'
          : 'The constants, the Bohr magneton and the meV, come from the engine’s units, the same CODATA values the solvers use. Rejected, with the reason recorded: an unknown material or parameter; a missing, non-numeric or non-finite value; a unit or basis not accepted for the parameter; missing conversion inputs; an unknown provenance class; a measured, computed or derived value without a well-formed DOI; an assumed value without a written justification; a canonical value outside its physical range, a moment above 10 magnetons, an anisotropy above 50 meV, a damping of one or more, an ordering temperature above 1500 K or any non-positive value where zero is unphysical; a band that does not contain its value; a duplicate row; a material missing any required parameter. The canonical bake is strict: one rejection stops it. Accepted with a flag: every assumed value, a damping band wider than a factor of four, and every value converted from another unit or basis; flags travel into the artifacts and the App’s parameter panel shows each value’s class, its published form, method, note and DOI links, and counts the assumed values.'}
      </p>
      <Callout variant="honest" title={es ? 'Lo que la auditoría encontró' : 'What the audit found'}>
        <p>
          {es
            ? 'Construir el contrato exigió una fuente para cada valor, y la comprobación contra fuentes primarias corrigió valores anteriores: la anisotropía de FePS3 pasó de 2,0 a 10,64 meV, un valor errado y un S al cuadrado faltante; la de CrI3, de 0,7 meV citada a un artículo que no la reporta, a 0,495 meV; la anisotropía, el momento y la temperatura de Curie de Cr2Ge2Te6; y el momento de Fe3GeTe2, cuyo 1,82 magnetones pertenecía a Fe3GaTe2. El amortiguamiento es asumido para la mayoría de los materiales, y como el piso universal es lineal en él, esos pisos son escalas y no mediciones; la web y la documentación lo dicen.'
            : 'Building the contract required a source for every value, and the check against primary sources corrected earlier values: FePS3’s anisotropy went from 2.0 to 10.64 meV, a wrong value and a missing S squared; CrI3’s, cited to a paper that does not report it, from 0.7 to 0.495 meV; Cr2Ge2Te6’s anisotropy, moment and Curie temperature; and Fe3GeTe2’s moment, whose 1.82 magnetons belonged to Fe3GaTe2. The damping is assumed for most materials, and because the universal floor is linear in it, those floors are scales rather than measurements; the web and the docs say so.'}
        </p>
      </Callout>
    </div>
  );
}

function Contract2({ lang }: { lang: Lang }): React.JSX.Element {
  const es = lang === 'es';
  return (
    <div className="prose">
      <p>
        {es
          ? 'Los artefactos llevan una versión de esquema, y el contrato de datos de la web, en TypeScript, refleja sus formas, de modo que una deriva falla la comprobación de tipos. Un verificador de artefactos comprueba el índice contra los archivos de caso, la completitud por variante de cada caso y las invariantes de cota del mapa de la cadena libre, y la batería de pruebas comprueba que cada artefacto esté al día con las tablas de parámetros. Cada manifiesto liga un artefacto a cómo se produjo: el caso y su contrato declarado, el motor y su versión, la semilla, la partición, los métodos y cada fila de resultado, el tamaño en bytes y el sha256 del artefacto, el veredicto de carril, los conteos de completitud y las marcas del Contrato 1 de los parámetros que usó, de modo que un artefacto construido sobre un amortiguamiento asumido lo dice. La etapa de validación recalcula el hash desde el artefacto en disco; uno alterado o desactualizado falla la versión, y una prueba demuestra que la comprobación falla sobre una copia mutada.'
          : 'The artifacts carry a schema version, and the web’s data contract, in TypeScript, mirrors their shapes, so a drift fails the type-check. An artifact checker checks the index against the case files, the per-variant completeness of each case and the bound invariants of the free chain map, and the test suite checks that each artifact is current with the parameter tables. Every manifest binds an artifact to how it was produced: the case and its declared contract, the engine and its version, the seed, the split, the methods and every result row, the artifact’s byte size and sha256, the lane verdict, the completeness counts and the Contract 1 flags of the parameters it used, so an artifact built on an assumed damping says so. The validate stage recomputes the hash from the artifact on disk; a tampered or stale one fails the release, and a test proves the check fails on a mutated copy.'}
      </p>
      <p>
        {es
          ? 'El registro de modelos guarda el único método aprendido, R15, la política amortizada: su versión, motor, licencia, carril, punto de control, los materiales sobre los que entrenó, los retenidos y la regla de aceptación con los puntajes que la pasaron. La política entrena sobre un rango de amortiguamiento con los amortiguamientos de los materiales retenidos excluidos, porque cuatro de los seis materiales comparten el mismo amortiguamiento asumido y una partición por material sola no retendría nada en el espacio de entrada real de la política.'
          : 'The model registry records the one learned method, R15, the amortized policy: its version, engine, license, lane, checkpoint, the materials it trained on, the held-out ones and the acceptance rule with the scores that passed it. The policy trains over a damping range with the held-out materials’ dampings excluded, because four of the six materials share the same assumed damping and a material-level split alone would hold nothing out in the policy’s actual input space.'}
      </p>
    </div>
  );
}

function Stages({ lang }: { lang: Lang }): React.JSX.Element {
  const es = lang === 'es';
  const stages: [string, string, string][] = [
    ['ingest', 'data/materials/*.csv into the Contract 1 report: accepted values, rejections with reasons, flags', 'data/materials/*.csv al informe del Contrato 1: valores aceptados, rechazos con razones, marcas'],
    ['preprocess', 'that report into the canonical material records; strict, one rejection stops the release', 'ese informe a los registros canónicos de materiales; estricto, un rechazo detiene la versión'],
    ['dataset', 'the registry into the split (train, held out) and the declared method x case x variant cells', 'el registro a la partición (entrenamiento, retenidos) y las celdas método x caso x variante declaradas'],
    ['features', 'a case and a variant into the dimensionless coordinates the learned policy consumes', 'un caso y una variante a las coordenadas adimensionales que consume la política aprendida'],
    ['train', 'the training split into the amortized policy, its checkpoint and its registry entry, with the gate it passed', 'la partición de entrenamiento a la política amortizada, su punto de control y su entrada de registro, con la compuerta que pasó'],
    ['infer', 'a case into every declared method over every variant, in one result schema', 'un caso a cada método declarado sobre cada variante, en un solo esquema de resultado'],
    ['evaluate', 'those results into per-method scores against the oracle and the completeness of the matrix', 'esos resultados a puntajes por método contra el oráculo y la completitud de la matriz'],
    ['export', 'all of it into the artifacts, the Contract 2 manifests and benchmark.json', 'todo eso a los artefactos, los manifiestos del Contrato 2 y benchmark.json'],
    ['validate', 'the written release into its problems; any problem refuses the release', 'la versión escrita a sus problemas; cualquier problema rechaza la versión'],
  ];
  return (
    <div className="prose">
      <p>
        {es
          ? 'Una orden corre la versión, y cada etapa es una función pura de sus entradas y de las semillas declaradas. Las etapas corren solas para inspección; los resultados cruzados, el mapa de cruce de la cadena libre y el barrido del parche son puntos de entrada separados porque llevan un costo de Monte Carlo o de varias horas.'
          : 'One command runs the release, and each stage is a pure function of its inputs and the declared seeds. Stages run alone for inspection; the cross-case novel results, the free chain crossover map and the two-dimensional patch sweep are separate entry points because they carry a Monte-Carlo or multi-hour cost.'}
      </p>
      <pre>
        <code>python data-pipeline/run.py all [artifacts_dir] [manifests_dir]</code>
      </pre>
      <div className="table-wrap">
        <table data-testid="pipeline-stages">
          <thead>
            <tr>
              <th>{es ? 'Etapa' : 'Stage'}</th>
              <th>{es ? 'Entrada y salida' : 'Input and output'}</th>
            </tr>
          </thead>
          <tbody>
            {stages.map(([name, en, esText]) => (
              <tr key={name}>
                <td>
                  <code>{name}</code>
                </td>
                <td>{es ? esText : en}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ResultSchema({ lang }: { lang: Lang }): React.JSX.Element {
  const es = lang === 'es';
  return (
    <div className="prose">
      <p>
        {es
          ? 'Cada método devuelve la misma fila: el método, la variante, el costo o nulo, si el momento se invirtió, si el método era aplicable, la razón cuando no lo era, y sus propias métricas. Un método que un caso declara y que la etapa de inferencia no puede correr lanza una excepción en vez de saltarse, y la evaluación cuenta las celdas producidas más las no aplicables contra las declaradas; la validación rechaza una versión con una celda faltante, así que una matriz incompleta no puede promediarse en una tabla más corta. Dos casos "no comparables" se marcan en vez de esconderse: el protocolo de espín-órbita reporta una integral de corriente en unidades reducidas, que no es un costo de campo en T^2 s, así que su costo es nulo y sus métricas llevan la corriente; y no es aplicable en absoluto sobre un material sin acoplamientos de espín-órbita medidos, lo que queda registrado como la razón.'
          : 'Every method returns the same row: the method, the variant, the cost or null, whether the moment reversed, whether the method was applicable, the reason when it was not, and its own metrics. A method a case declares that the infer stage cannot run raises rather than skipping, and evaluate counts produced plus not-applicable against declared; validate refuses a release with a missing cell, so an incomplete matrix cannot be averaged away into a shorter table. Two "not comparable" cases are marked rather than hidden: the spin-orbit-torque protocol reports a current integral in reduced units, which is not a field cost in T^2 s, so its cost is null and its metrics carry the current; and it is not applicable at all on a material with no measured spin-orbit couplings, which is recorded as the reason.'}
      </p>
      <p>
        {es
          ? 'Un caso reporta la cantidad que se le preguntó. La mayoría reporta el costo de campo en T^2 s, para el que el costo libre y el piso son referencias con sentido; C03 reporta la corriente óptima media en unidades j0 y C07 la tasa de éxito como fracción de un conjunto de 600 copias, y citar cualquiera de los dos en T^2 s sería un fallo de unidades. Así que un caso declara un observable, su clave en la fila de la curva de costo, su etiqueta, su unidad y si es un costo de campo, el artefacto lleva la declaración y la App dibuja y lee lo que el caso declaró; sobre esos casos las razones derivadas del campo no se llevan, y el costo de campo de la misma inversión queda en la fila como referencia de escala con su nota. Una compuerta del navegador falla la construcción si un observable que no es un costo se muestra alguna vez en T^2 s. La misma regla vale para la trayectoria dibujada: tres casos dibujan un camino que no es literalmente el objeto medido, y cada uno lleva una nota que la misma compuerta comprueba que se muestre; los dos casos cuya respuesta es un camino numérico dibujan el camino del propio solucionador sobre su propia malla de imágenes.'
          : 'A case reports the quantity it was asked about. Most report the field cost in T^2 s, for which the free cost and the floor are meaningful references; C03 reports the mean optimal current in j0 units and C07 the success rate as a fraction of an ensemble of 600 copies, and quoting either in T^2 s would be a units failure. So a case declares an observable, its key in the cost-curve row, its label, its unit and whether it is a field cost, the artifact carries the declaration and the App plots and reads what the case declared; on those cases the field-derived ratios are not carried, and the field cost of the same reversal stays in the row as a scale reference with its note. A browser gate fails the build if a non-cost observable is ever shown in T^2 s. The same rule holds for the drawn trajectory: three cases draw a path that is not literally the measured object, and each carries a note the same gate checks is displayed; the two cases whose answer is a numerical path draw the solver’s own path on its own image grid.'}
      </p>
    </div>
  );
}

function LaneGate({ lang }: { lang: Lang }): React.JSX.Element {
  const es = lang === 'es';
  return (
    <div className="prose">
      <p>
        {es
          ? 'La compuerta de carril decide en vivo o cálculo previo por medición, nunca a mano: un caso puede correr en vivo en el navegador solo si cada método que corre tiene una forma cerrada lo bastante barata para el navegador, su tiempo de ejecución medido está bajo 250 ms y su artefacto bajo 512 kB. El veredicto, el tiempo medido, el tamaño del artefacto y las razones de fallo van al manifiesto; nada en el producto se etiqueta en vivo sin esos números. Dos casos pasan, C03, el oráculo de espín-órbita, y C10, la replicación de los campos pico del artículo de referencia, y los métodos de ambos son formas cerradas. Todo otro caso es cálculo previo y su manifiesto dice por qué: el solucionador numérico no tiene forma cerrada en el navegador y sus tiempos son de segundos a minutos.'
          : 'The lane gate decides live against precompute by measurement, never by hand: a case may run live in the browser only if every method it runs has a closed form cheap enough for the browser, its measured runtime is under 250 ms and its artifact is under 512 kB. The verdict, the measured runtime, the artifact size and the failing reasons go into the manifest; nothing in the product is labelled live without those numbers. Two cases pass, C03, the spin-orbit-torque oracle, and C10, the replication of the kickoff paper’s peak fields, and the methods of both are closed forms. Every other case is precompute and its manifest says why: the numerical solver has no browser closed form and its runtimes are seconds to minutes.'}
      </p>
      <p>
        {es
          ? 'Un veredicto "en vivo" que nada en el cliente pudiera evaluar sería una etiqueta y no un hecho, así que la web lleva su propia implementación de cada forma cerrada, la integral elíptica completa por la media aritmético-geométrica, escrita independientemente del camino del motor por SciPy. Escribir la segunda encontró dos defectos, uno de cada lado: el motor reportaba como pico el valor del pulso en su inicio y su punto medio, hasta 27 por ciento bajo el pico real, y el corchete del parámetro de forma del navegador estaba alto por una parte en diez mil a tiempos cortos. El caso envía las constantes que necesita, el banco de trabajo lo recalcula en el navegador y muestra el acuerdo con el artefacto, y dos compuertas sostienen los dos lados: una prueba de Python rechaza un manifiesto que ponga un caso en el carril en vivo sin implementación en el navegador de sus métodos, y la compuerta del navegador falla la construcción si las dos implementaciones difieren en más de una parte en un millón. Hoy coinciden exactamente.'
          : 'A verdict of "live" that nothing on the client could evaluate would be a label rather than a fact, so the web carries its own implementation of each closed form, the complete elliptic integral by the arithmetic-geometric mean, written independently of the engine’s path through SciPy. Writing the second one caught two defects, one on each side: the engine reported as the peak the pulse’s value at its start and midpoint, up to 27 per cent below the real peak, and the browser’s own shape-parameter bracket was high by one part in ten thousand at short switching times. The case ships the constants it needs, the workbench recomputes it in the browser and shows the agreement with the artifact, and two gates hold the two sides together: a Python test refuses a manifest that puts a case in the live lane without a browser implementation of its methods, and the browser gate fails the build if the two implementations disagree by more than a part in a million. They currently agree exactly.'}
      </p>
    </div>
  );
}

function ParityPanel({ lang, parity }: { lang: Lang; parity: LiveParityFixture | null }): React.JSX.Element {
  const es = lang === 'es';
  return (
    <div className="prose">
      <p>
        {es
          ? 'El carril en vivo tiene dos implementaciones de la misma forma cerrada: la del motor, en Python, y la del navegador, en TypeScript, escrita por separado para que el acuerdo sea una comprobación y no una copia. El banco de trabajo muestra ese acuerdo en el punto de operación del caso; aquí el navegador recalcula toda la rejilla que guardó el cálculo previo, incluida la integral elíptica cerca de su singularidad, y se muestra la peor desviación relativa contra la tolerancia que el cálculo guardó.'
          : "The live lane carries two implementations of the same closed form: the engine's, in Python, and the browser's, in TypeScript, written separately so that agreement is a check rather than a copy. The workbench shows that agreement at the case's working point; here the browser recomputes the whole grid the bake committed, the elliptic integral near its singularity included, and the worst relative deviation is shown against the tolerance the bake committed."}{' '}
        <Cite id="vlasov2022" />
      </p>
      {parity ? <LiveParity fixture={parity} es={es} /> : <p className="muted">{es ? 'Cargando la paridad...' : 'Loading the parity fixture...'}</p>}
    </div>
  );
}

function BarrierPanel({ lang, crosscheck }: { lang: Lang; crosscheck: ExternalCrosscheck | null }): React.JSX.Element {
  const es = lang === 'es';
  return (
    <div className="prose">
      <p>
        {es
          ? 'El piso bajo cada costo que publica este producto es una barrera de energía calculada por el método de cuerda del propio motor. Si ese método estuviera mal, todos los pisos estarían mal a la vez y ninguna prueba interna lo notaría. Spirit es un marco de dinámica de espines atomística escrito por otras personas, y su banda elástica geodésica es otro método para el mismo objeto: se le da el mismo hamiltoniano y el mismo camino inicial, y se compara la barrera. Se comparan las dos geometrías que el producto usa, la cadena y el parche cuadrado de los casos C20 y C21, y toda fila está por debajo de la silla coherente N K, es decir, son caminos de pared. Spirit no es una dependencia de este producto y la integración continua nunca lo instala.'
          : "The floor under every cost this product publishes is an energy barrier computed by the engine's own string method. If that method were wrong, every floor would be wrong together and no internal test would notice. Spirit is an atomistic spin-dynamics framework written by other people, and its geodesic nudged elastic band is a different method for the same object: it is given the same Hamiltonian and the same initial path, and the barriers are compared. Both geometries the product uses are compared, the chain and the square patch of cases C20 and C21, and every row sits below the coherent saddle N K, which is what makes them wall paths. Spirit is not a dependency of this product, and CI never installs it."}{' '}
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
                  <th>{es ? 'Geometría' : 'Geometry'}</th>
                  <th>J/K</th>
                  <th>{es ? 'spinoct (cuerda)' : 'spinoct (string)'}</th>
                  <th>Spirit (GNEB)</th>
                  <th>{es ? 'Barrera / NK' : 'Barrier / NK'}</th>
                  <th>{es ? 'Diferencia' : 'Difference'}</th>
                </tr>
              </thead>
              <tbody>
                {crosscheck.rows.map((row) => (
                  <tr key={`${row.geometry}-${row.width}x${row.height}-${row.exchange_over_k}`} data-geometry={row.geometry}>
                    <td>{row.geometry === 'patch' ? `${es ? 'parche' : 'patch'} ${row.width} x ${row.height}` : `${es ? 'cadena' : 'chain'} ${row.n_sites}`}</td>
                    <td>{row.exchange_over_k}</td>
                    <td>{row.spinoct_barrier_over_k.toFixed(6)} K</td>
                    <td>{row.spirit_barrier_over_k.toFixed(6)} K</td>
                    <td>{row.barrier_over_nk.toFixed(3)}</td>
                    <td>{row.relative_difference.toExponential(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p className="muted">{es ? 'Cargando la comprobación...' : 'Loading the cross-check...'}</p>
      )}
    </div>
  );
}

function DynamicsPanel({ lang, dynamics }: { lang: Lang; dynamics: ExternalDynamicsCrosscheck | null }): React.JSX.Element {
  const es = lang === 'es';
  return (
    <div className="prose">
      <p>
        {es
          ? 'La comprobación de la barrera compara un objeto estático. No dice nada sobre la ecuación de movimiento sobre la que se construye todo lo demás: si el lado derecho de Landau-Lifshitz-Gilbert del motor estuviera mal, todos los protocolos y todos los veredictos de conmutación estarían mal a la vez y la barrera seguiría siendo correcta. VAMPIRE es un código de dinámica de espines atomística escrito por otras personas, con su propio integrador. Es GPL-2, así que se ejecuta como proceso separado a partir de archivos de entrada generados: nada se enlaza y ningún código de VAMPIRE entra en este repositorio.'
          : 'The barrier check compares a static object. It says nothing about the equation of motion everything else is built on: if the engine’s Landau-Lifshitz-Gilbert right-hand side were wrong, every protocol and every switching verdict would be wrong together and the barrier would still be right. VAMPIRE is an atomistic spin-dynamics code written by other people, with its own integrator. It is GPL-2, so it runs as a separate process from generated input files: nothing is linked and no VAMPIRE code enters this repository.'}{' '}
        <Cite id="evans2014" />
      </p>
      {dynamics ? (
        <div data-testid="external-dynamics" data-agrees={String(dynamics.agrees)}>
          <p className="muted">
            {es ? 'Peor desviación de trayectoria' : 'Worst trajectory deviation'}:{' '}
            <strong data-testid="dynamics-worst">{dynamics.worst_deviation.toExponential(2)}</strong>{' '}
            {es ? 'contra una tolerancia de' : 'against a tolerance of'} {dynamics.tolerance.toExponential(0)}.{' '}
            <span className={dynamics.agrees ? 'prov-badge prov-measured' : 'prov-badge prov-assumed'}>
              {dynamics.agrees ? (es ? 'de acuerdo' : 'agree') : es ? 'en desacuerdo' : 'disagree'}
            </span>{' '}
            spinoct {dynamics.engines.spinoct}, VAMPIRE {dynamics.engines.vampire}, {dynamics.measured_on}.
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{es ? 'Configuración' : 'Configuration'}</th>
                  <th>alpha</th>
                  <th>{es ? 'Campo (T)' : 'Field (T)'}</th>
                  <th>{es ? 'Duración' : 'Duration'}</th>
                  <th>{es ? 'Peor desviación' : 'Worst deviation'}</th>
                  <th>{es ? 'Inversión' : 'Reversal'}</th>
                </tr>
              </thead>
              <tbody>
                {dynamics.rows.map((row) => (
                  <tr key={row.name} data-row={row.name.startsWith('reversal') ? 'reversal' : 'precession'}>
                    <DataText as="td" text={row.name} />
                    <td>{row.alpha}</td>
                    <td>{row.applied_field_t.map((b) => b.toFixed(2)).join(', ')}</td>
                    <td>{(row.duration_s * 1e12).toFixed(0)} ps</td>
                    <td>{row.worst_deviation.toExponential(1)}</td>
                    <td>
                      {row.reversal_time_ours_s != null && row.reversal_time_theirs_s != null
                        ? `${(row.reversal_time_ours_s * 1e12).toFixed(3)} / ${(row.reversal_time_theirs_s * 1e12).toFixed(3)} ps`
                        : es
                          ? 'sin inversión'
                          : 'no reversal'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <DataText as="p" className="muted" text={dynamics.gyromagnetic_note} />
        </div>
      ) : (
        <p className="muted">{es ? 'Cargando la comprobación de la dinámica...' : 'Loading the dynamics cross-check...'}</p>
      )}
    </div>
  );
}

function Deploy({ lang }: { lang: Lang }): React.JSX.Element {
  const es = lang === 'es';
  return (
    <div className="prose">
      <p>
        {es
          ? 'Espira es un sitio estático en GitHub Pages bajo su dominio propio; no hay servidor en tiempo de petición. El flujo de despliegue, en cada empuje a la rama principal, instala la web, copia los artefactos del repositorio, comprueba tipos y empaqueta con Vite, escribe una entrada HTML por ruta declarada en el enrutador, de modo que toda ruta profunda responde 200 con y sin barra final, y publica; nunca corre un cálculo. Los cambios científicos llegan primero como artefactos en el repositorio y el despliegue solo los reproduce. Los artefactos se piden con la versión como parámetro, así que la caché de Pages no puede servir datos viejos bajo un paquete nuevo, y el pie de página muestra la versión publicada.'
          : 'Espira is a static site on GitHub Pages under its own domain; there is no server at request time. The deploy workflow, on every push to the main branch, installs the web app, copies the committed artifacts, type-checks and bundles with Vite, writes one HTML entry per route the router declares, so every deep link answers 200 with and without a trailing slash, and publishes; it never runs a bake. Science changes land first as committed artifacts and the deploy only replays them. Artifacts are fetched with the version as a query parameter, so the Pages cache cannot serve stale data under a new bundle, and the footer shows the published version.'}
      </p>
      <p>
        {es
          ? 'Dos flujos, dos conclusiones. La integración continua corre el linter, las pruebas de Python (materiales, registro, invariantes de artefactos, un cálculo de humo en un espacio aislado, la consistencia de versiones), el verificador de artefactos, las guardas de estándares de contenido y de residuos de plantilla, la comprobación de tipos y la construcción de la web, y luego las catorce compuertas del navegador contra el sitio construido, en ambos temas y ambos idiomas; el despliegue solo construye y publica. Son independientes: desde 0.01.000 hasta 0.02.001 el despliegue estuvo verde en cada empuje mientras la integración fallaba, y la versión se reportó como verde. Una versión es verde solo cuando ambos lo son.'
          : 'Two workflows, two conclusions. CI runs the linter, the Python tests (materials, registry, artifact invariants, a sandboxed bake smoke, version consistency), the artifact checker, the content-standards and template-residue guards, the type-check and the build of the web app, and then the fourteen browser gates against the built site, in both themes and both languages; the deploy only builds and publishes. They are independent: from 0.01.000 to 0.02.001 the deploy was green on every push while CI failed, and the release was reported as green. A release is green only when both are.'}
      </p>
      <p>
        {es
          ? 'Trece compuertas van a fondo en una superficie cada una: la disposición del banco de trabajo contra los pisos medidos de ADR-0071, la matriz de cobertura contra el índice guardado, la franja de procedencia, y una por vista analítica, la cadena libre, el parche, Pareto, el mapa de eje duro, la penalización, la explotabilidad, la comparativa, las unidades del observable, la paridad del carril en vivo, la comprobación externa y las replicaciones publicadas, donde la compuerta compara cada celda dibujada con el artefacto y rechaza una tabla que haya perdido el punto que no se reproduce. La decimocuarta es la compuerta de amplitud: recorre la navegación que la propia aplicación dibuja, entra en cada pestaña de cada página, y sostiene en cada panel, en ambos temas, ambos idiomas y a un ancho de escritorio y de teléfono, que la ruta monta con un encabezado y texto suficiente, que nada se desplaza de lado ni corre bajo el pie, que ningún panel sigue mostrando su marcador de espera tras asentarse la red, que ningún valor roto llega al texto visible, que la página en español lleva sus acentos y ninguna frase en inglés fuera de los datos marcados, y que los dos idiomas son documentos distintos.'
          : 'Thirteen gates go deep on one surface each: the workbench layout against the measured ADR-0071 floors, the coverage matrix against the committed index, the provenance strip, and one per analytical view, the free chain, the patch, Pareto, the hard-axis map, the penalty, the exploitability, the benchmark, the observable units, the live-lane parity, the external cross-check and the published replications, where the gate compares every rendered cell with the artifact and refuses a table that has dropped the point that does not reproduce. The fourteenth is the breadth gate: it walks the nav the app itself renders, steps through every tab of every page, and holds on every panel, in both themes, both languages and at a desktop and a phone width, that the route mounts with a heading and enough text, that nothing scrolls sideways or runs under the footer, that no panel still shows its fetch placeholder after the network settled, that no broken value reaches the visible text, that the Spanish page carries its accents and no English sentence outside the marked data, and that the two languages are different documents.'}
      </p>
    </div>
  );
}

export function Implementation(): React.JSX.Element {
  const lang = useShellLang();
  const es = lang === 'es';
  const [parity, setParity] = useState<LiveParityFixture | null>(null);
  const [crosscheck, setCrosscheck] = useState<ExternalCrosscheck | null>(null);
  const [dynamics, setDynamics] = useState<ExternalDynamicsCrosscheck | null>(null);
  useEffect(() => {
    loadLiveParity().then(setParity).catch(() => setParity(null));
    loadExternalCrosscheck().then(setCrosscheck).catch(() => setCrosscheck(null));
    loadExternalDynamics().then(setDynamics).catch(() => setDynamics(null));
  }, []);
  return (
    <article className="prose page-body">
      <div className="page-head">
        <h1>{es ? 'Implementación' : 'Implementation'}</h1>
        <p className="lede">
          {es
            ? 'Cómo está construido el producto: dos repositorios con el motor separado del producto, tres carriles de ejecución de los que solo uno es la verdad canónica, dos contratos de datos que canonizan lo que entra y ligan por hash lo que sale, una canalización de nueve etapas que rechaza una versión con una celda faltante, tres comprobaciones contra códigos ajenos, y un despliegue sostenido por catorce compuertas del navegador. Cada afirmación de esta página tiene una prueba o una compuerta detrás, y las que fallaron alguna vez dicen cuándo.'
            : 'How the product is built: two repositories with the engine separate from the product, three execution lanes of which only one is canonical truth, two data contracts that canonicalize what comes in and bind by hash what goes out, a nine-stage pipeline that refuses a release with a missing cell, three checks against other people’s codes, and a deploy held by fourteen browser gates. Every claim on this page has a test or a gate behind it, and the ones that once failed say when.'}
        </p>
      </div>
      <Tabs
        ariaLabel={es ? 'secciones de implementación' : 'implementation sections'}
        initial="architecture"
        tabs={[
          { id: 'architecture', label: es ? 'Arquitectura' : 'Architecture', content: <Architecture lang={lang} /> },
          { id: 'engine', label: es ? 'El motor' : 'The engine', content: <Engine lang={lang} /> },
          {
            id: 'contracts',
            label: es ? 'Contratos de datos' : 'Data contracts',
            content: (
              <SubTabs
                ariaLabel={es ? 'contratos de datos' : 'data contracts'}
                tabs={[
                  { id: 'contract1', label: es ? 'Contrato 1, parámetros que entran' : 'Contract 1, parameters in', content: <Contract1 lang={lang} /> },
                  { id: 'contract2', label: es ? 'Contrato 2, artefactos que salen' : 'Contract 2, artifacts out', content: <Contract2 lang={lang} /> },
                ]}
              />
            ),
          },
          {
            id: 'pipeline',
            label: es ? 'La canalización' : 'The pipeline',
            content: (
              <SubTabs
                ariaLabel={es ? 'la canalización' : 'the pipeline'}
                tabs={[
                  { id: 'stages', label: es ? 'Etapas' : 'Stages', content: <Stages lang={lang} /> },
                  { id: 'schema', label: es ? 'El esquema de resultados' : 'The result schema', content: <ResultSchema lang={lang} /> },
                  { id: 'lane', label: es ? 'La compuerta de carril' : 'The lane gate', content: <LaneGate lang={lang} /> },
                ]}
              />
            ),
          },
          {
            id: 'checks',
            label: es ? 'Comprobaciones' : 'Checks',
            content: (
              <SubTabs
                ariaLabel={es ? 'comprobaciones contra otros códigos' : 'checks against other codes'}
                tabs={[
                  { id: 'parity', label: es ? 'Paridad del carril en vivo' : 'Live-lane parity', content: <ParityPanel lang={lang} parity={parity} /> },
                  { id: 'barrier', label: es ? 'Barrera (Spirit)' : 'Barrier (Spirit)', content: <BarrierPanel lang={lang} crosscheck={crosscheck} /> },
                  { id: 'dynamics', label: es ? 'Dinámica (VAMPIRE)' : 'Dynamics (VAMPIRE)', content: <DynamicsPanel lang={lang} dynamics={dynamics} /> },
                ]}
              />
            ),
          },
          { id: 'deploy', label: es ? 'Despliegue y compuertas' : 'Deploy and gates', content: <Deploy lang={lang} /> },
        ]}
      />
      <Refs ids={['kwiatkowski2021', 'vlasov2022', 'badarneh2023', 'sunwang2006', 'scheie2022', 'ruiz2024', 'huang2017', 'bessarab2015', 'evans2014']} label="Refs" />
    </article>
  );
}

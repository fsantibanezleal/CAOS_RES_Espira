// The in-app Architecture modal (ADR-0058). Bilingual, theme-aware inline SVGs: every translatable
// <text> is tagged twice (l-en / l-es) at the same coordinates; the shell shows exactly one. Strokes
// use currentColor so the diagram tracks the theme.

import type { ArchitectureConfig } from '@fasl-work/caos-app-shell';

const S = 'stroke="currentColor" fill="none" stroke-width="1.6"';
const BOX = 'rx="8" stroke="currentColor" fill="none" stroke-width="1.4"';

const problemSvg = `
<svg viewBox="0 0 640 300" role="img" style="width:100%;height:auto;color:var(--color-fg)">
  <circle cx="180" cy="150" r="110" ${S} opacity="0.5"/>
  <ellipse cx="180" cy="150" rx="110" ry="34" ${S} opacity="0.3"/>
  <circle cx="180" cy="45" r="4" fill="currentColor"/>
  <circle cx="180" cy="255" r="4" fill="currentColor"/>
  <path d="M180 45 C 250 90, 120 150, 200 200 S 150 250, 180 255" stroke="var(--color-accent,#3b82f6)" fill="none" stroke-width="2.4"/>
  <text x="196" y="44" class="l-en" font-size="13" fill="currentColor">+z start</text>
  <text x="196" y="44" class="l-es" font-size="13" fill="currentColor">+z inicio</text>
  <text x="196" y="262" class="l-en" font-size="13" fill="currentColor">-z end</text>
  <text x="196" y="262" class="l-es" font-size="13" fill="currentColor">-z fin</text>
  <text x="360" y="120" class="l-en" font-size="15" fill="currentColor">Minimize the cost</text>
  <text x="360" y="120" class="l-es" font-size="15" fill="currentColor">Minimizar el costo</text>
  <text x="360" y="150" font-size="16" fill="var(--color-accent,#3b82f6)">Phi = integral |b|^2 dt</text>
  <text x="360" y="185" class="l-en" font-size="13" fill="currentColor">over trajectories that reverse</text>
  <text x="360" y="185" class="l-es" font-size="13" fill="currentColor">sobre trayectorias que invierten</text>
  <text x="360" y="205" class="l-en" font-size="13" fill="currentColor">the moment in time T, under the</text>
  <text x="360" y="205" class="l-es" font-size="13" fill="currentColor">el momento en tiempo T, bajo la</text>
  <text x="360" y="225" class="l-en" font-size="13" fill="currentColor">Landau-Lifshitz-Gilbert equation.</text>
  <text x="360" y="225" class="l-es" font-size="13" fill="currentColor">ecuacion de Landau-Lifshitz-Gilbert.</text>
</svg>`;

const engineSvg = `
<svg viewBox="0 0 660 250" role="img" style="width:100%;height:auto;color:var(--color-fg)">
  <rect x="10" y="95" width="120" height="60" ${BOX}/>
  <text x="70" y="120" text-anchor="middle" class="l-en" font-size="12" fill="currentColor">Material DB</text>
  <text x="70" y="120" text-anchor="middle" class="l-es" font-size="12" fill="currentColor">Base materiales</text>
  <text x="70" y="138" text-anchor="middle" font-size="11" fill="currentColor" opacity="0.7">DOI + units</text>
  <rect x="180" y="95" width="120" height="60" ${BOX}/>
  <text x="240" y="122" text-anchor="middle" font-size="13" fill="var(--color-accent,#3b82f6)">spinoct</text>
  <text x="240" y="140" text-anchor="middle" font-size="11" fill="currentColor" opacity="0.7">OCP engine</text>
  <rect x="350" y="95" width="120" height="60" ${BOX}/>
  <text x="410" y="120" text-anchor="middle" class="l-en" font-size="12" fill="currentColor">Bake</text>
  <text x="410" y="120" text-anchor="middle" class="l-es" font-size="12" fill="currentColor">Horneado</text>
  <text x="410" y="138" text-anchor="middle" font-size="11" fill="currentColor" opacity="0.7">JSON</text>
  <rect x="520" y="95" width="120" height="60" ${BOX}/>
  <text x="580" y="120" text-anchor="middle" class="l-en" font-size="12" fill="currentColor">Web replay</text>
  <text x="580" y="120" text-anchor="middle" class="l-es" font-size="12" fill="currentColor">Web replay</text>
  <text x="580" y="138" text-anchor="middle" font-size="11" fill="currentColor" opacity="0.7">this page</text>
  <path d="M130 125 H180" ${S} marker-end="url(#a)"/>
  <path d="M300 125 H350" ${S} marker-end="url(#a)"/>
  <path d="M470 125 H520" ${S} marker-end="url(#a)"/>
  <defs><marker id="a" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L6 4 L0 8" fill="currentColor"/></marker></defs>
  <text x="330" y="40" text-anchor="middle" class="l-en" font-size="13" fill="currentColor">Offline is canonical truth; the web only replays committed artifacts.</text>
  <text x="330" y="40" text-anchor="middle" class="l-es" font-size="13" fill="currentColor">Lo offline es la verdad canonica; la web solo reproduce artefactos.</text>
</svg>`;

const honestySvg = `
<svg viewBox="0 0 640 240" role="img" style="width:100%;height:auto;color:var(--color-fg)">
  <rect x="20" y="40" width="280" height="160" ${BOX}/>
  <text x="160" y="66" text-anchor="middle" font-size="14" fill="var(--color-accent,#3b82f6)">Phi  (T^2 s)</text>
  <text x="160" y="92" text-anchor="middle" class="l-en" font-size="12" fill="currentColor">what the engine computes:</text>
  <text x="160" y="92" text-anchor="middle" class="l-es" font-size="12" fill="currentColor">lo que calcula el motor:</text>
  <text x="160" y="112" text-anchor="middle" class="l-en" font-size="12" fill="currentColor">model-free, exact</text>
  <text x="160" y="112" text-anchor="middle" class="l-es" font-size="12" fill="currentColor">sin modelo, exacto</text>
  <path d="M300 120 H360" ${S} marker-end="url(#b)"/>
  <text x="330" y="108" text-anchor="middle" font-size="11" fill="currentColor" opacity="0.7">x C</text>
  <rect x="360" y="40" width="260" height="160" ${BOX} stroke-dasharray="5 4"/>
  <text x="490" y="66" text-anchor="middle" font-size="14" fill="currentColor">Energy  (J)</text>
  <text x="490" y="92" text-anchor="middle" class="l-en" font-size="12" fill="currentColor">only through a stated</text>
  <text x="490" y="92" text-anchor="middle" class="l-es" font-size="12" fill="currentColor">solo mediante un modelo</text>
  <text x="490" y="112" text-anchor="middle" class="l-en" font-size="12" fill="currentColor">circuit model C</text>
  <text x="490" y="112" text-anchor="middle" class="l-es" font-size="12" fill="currentColor">de circuito C declarado</text>
  <text x="490" y="150" text-anchor="middle" class="l-en" font-size="11" fill="currentColor" opacity="0.7">not a device cell energy</text>
  <text x="490" y="150" text-anchor="middle" class="l-es" font-size="11" fill="currentColor" opacity="0.7">no una energia de celda</text>
  <defs><marker id="b" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L6 4 L0 8" fill="currentColor"/></marker></defs>
</svg>`;

const outsideSvg = `
<svg viewBox="0 0 660 280" role="img" style="width:100%;height:auto;color:var(--color-fg)">
  <rect x="250" y="20" width="160" height="54" ${BOX}/>
  <text x="330" y="44" text-anchor="middle" font-size="13" fill="var(--color-accent,#3b82f6)">spinoct</text>
  <text x="330" y="62" text-anchor="middle" class="l-en" font-size="11" fill="currentColor" opacity="0.75">this product's engine</text>
  <text x="330" y="62" text-anchor="middle" class="l-es" font-size="11" fill="currentColor" opacity="0.75">el motor de este producto</text>

  <rect x="20" y="150" width="230" height="110" ${BOX} stroke-dasharray="5 4"/>
  <text x="135" y="176" text-anchor="middle" font-size="13" fill="currentColor">Spirit (GNEB)</text>
  <text x="135" y="200" text-anchor="middle" class="l-en" font-size="11" fill="currentColor" opacity="0.75">the barrier: the STATICS</text>
  <text x="135" y="200" text-anchor="middle" class="l-es" font-size="11" fill="currentColor" opacity="0.75">la barrera: la ESTATICA</text>
  <text x="135" y="224" text-anchor="middle" font-size="12" fill="var(--color-accent,#3b82f6)">1.4e-06</text>
  <text x="135" y="244" text-anchor="middle" class="l-en" font-size="11" fill="currentColor" opacity="0.75">6 lattices, chain and patch</text>
  <text x="135" y="244" text-anchor="middle" class="l-es" font-size="11" fill="currentColor" opacity="0.75">6 redes, cadena y parche</text>

  <rect x="410" y="150" width="230" height="110" ${BOX} stroke-dasharray="5 4"/>
  <text x="525" y="176" text-anchor="middle" font-size="13" fill="currentColor">VAMPIRE (Heun)</text>
  <text x="525" y="200" text-anchor="middle" class="l-en" font-size="11" fill="currentColor" opacity="0.75">the trajectory: the DYNAMICS</text>
  <text x="525" y="200" text-anchor="middle" class="l-es" font-size="11" fill="currentColor" opacity="0.75">la trayectoria: la DINAMICA</text>
  <text x="525" y="224" text-anchor="middle" font-size="12" fill="var(--color-accent,#3b82f6)">4.7e-06</text>
  <text x="525" y="244" text-anchor="middle" class="l-en" font-size="11" fill="currentColor" opacity="0.75">separate process, GPL-2, never linked</text>
  <text x="525" y="244" text-anchor="middle" class="l-es" font-size="11" fill="currentColor" opacity="0.75">proceso aparte, GPL-2, nunca enlazado</text>

  <path d="M280 74 L 160 150" ${S} marker-end="url(#c)"/>
  <path d="M380 74 L 500 150" ${S} marker-end="url(#c)"/>
  <text x="330" y="120" text-anchor="middle" class="l-en" font-size="12" fill="currentColor">same Hamiltonian, same starting path</text>
  <text x="330" y="120" text-anchor="middle" class="l-es" font-size="12" fill="currentColor">mismo hamiltoniano, mismo camino inicial</text>
  <defs><marker id="c" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L6 4 L0 8" fill="currentColor"/></marker></defs>
</svg>`;

export const ARCHITECTURE: ArchitectureConfig = {
  title_en: 'How Espira works',
  title_es: 'Como funciona Espira',
  tabs: [
    {
      id: 'problem',
      en: 'The problem',
      es: 'El problema',
      body_en:
        'Espira computes the control pulse that reverses a magnetic moment for the least dissipated energy. The moment lives on a sphere; the reversal is a path from the north pole to the south pole. The cost is the time integral of the squared control field, which is proportional to the Joule heating of the circuit that generates it.\n\nThe optimal path is not the lowest ridge over the energy barrier. It deliberately climbs higher where the material internal torque assists the reversal.',
      body_es:
        'Espira calcula el pulso de control que invierte un momento magnetico con la menor energia disipada. El momento vive en una esfera; la reversion es un camino del polo norte al polo sur. El costo es la integral en el tiempo del campo de control al cuadrado, proporcional al calentamiento Joule del circuito que lo genera.\n\nEl camino optimo no es la cresta mas baja sobre la barrera. Sube deliberadamente mas alto donde el torque interno del material ayuda a la reversion.',
      svg: problemSvg,
    },
    {
      id: 'engine',
      en: 'The engine and lanes',
      es: 'El motor y las lineas',
      body_en:
        'The computation is done by spinoct, an open-source Python package that solves optimal control over Landau-Lifshitz-Gilbert dynamics. A curated material database (each value with a DOI) feeds the engine; the canonical bake runs it offline and commits checksummed JSON artifacts. This web page replays those artifacts, except the one case the lane gate measured as cheap enough for the browser, which it recomputes on the client and checks against its artifact.',
      body_es:
        'El calculo lo hace spinoct, un paquete de Python de codigo abierto que resuelve el control optimo sobre la dinamica de Landau-Lifshitz-Gilbert. Una base de materiales curada (cada valor con un DOI) alimenta el motor; el horneado canonico lo ejecuta sin conexion y compromete artefactos JSON. Esta pagina reproduce esos artefactos, salvo el unico caso que el gate de carril midio como suficientemente barato para el navegador, que recalcula en el cliente y compara con su artefacto.',
      svg: engineSvg,
    },
    {
      id: 'honesty',
      en: 'Cost is not energy',
      es: 'El costo no es energia',
      body_en:
        'The switching cost is an integral in tesla-squared-seconds, not an energy. It becomes joules only through an explicit circuit model, and even then it is the energy the driving circuit dissipates, not the cell energy of a memory device. Espira reports the model-free cost as primary and makes the circuit assumption visible.',
      body_es:
        'El costo de conmutacion es una integral en tesla al cuadrado por segundo, no una energia. Se vuelve julios solo mediante un modelo de circuito explicito, y aun asi es la energia que disipa el circuito, no la energia de celda de un dispositivo de memoria. Espira reporta el costo sin modelo como primario y hace visible la suposicion del circuito.',
      svg: honestySvg,
    },
    {
      id: 'outside',
      en: 'Checked from outside',
      es: 'Comprobado desde afuera',
      body_en:
        'A product that only agrees with itself proves nothing, so the two objects everything else rests on are computed twice, by codes written by other people. Spirit recomputes the energy barrier with a different method (geodesic nudged elastic band against the string method) on both geometries, chains and the square patch, and agrees to 1.4e-06. VAMPIRE reintegrates the equation of motion with a different integrator and agrees to 4.7e-06, putting the moment through the equator at the same 78.7319 ps. Neither is a dependency: Spirit runs in its own environment, VAMPIRE is GPL-2 and runs as a separate process, and CI installs neither.',
      body_es:
        'Un producto que solo se pone de acuerdo consigo mismo no prueba nada, asi que los dos objetos sobre los que descansa todo lo demas se calculan dos veces, con codigos escritos por otras personas. Spirit recalcula la barrera de energia con otro metodo (banda elastica geodesica frente al metodo de cuerda) en ambas geometrias, cadenas y el parche cuadrado, y coincide a 1.4e-06. VAMPIRE reintegra la ecuacion de movimiento con otro integrador y coincide a 4.7e-06, cruzando el ecuador en los mismos 78.7319 ps. Ninguno es dependencia: Spirit corre en su propio entorno, VAMPIRE es GPL-2 y corre como proceso separado, y CI no instala ninguno.',
      svg: outsideSvg,
    },
  ],
};

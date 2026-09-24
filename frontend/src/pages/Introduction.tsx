// Introduction: what Espira is, honestly, in both languages.

import { useShellLang, Cite, Refs } from '@fasl-work/caos-app-shell';

export function Introduction(): React.JSX.Element {
  const lang = useShellLang();
  if (lang === 'es') {
    return (
      <article className="prose">
        <h1>Espira</h1>
        <p className="lead">
          Control óptimo de la conmutación de la magnetización en imanes de van der Waals
          bidimensionales: dado un bit magnético y un tiempo de conmutación, calcular el pulso de campo
          o corriente que lo invierte con la menor energía disipada.
        </p>
        <p>
          El almacenamiento de datos consume una fracción creciente de la energía mundial, y el costo de
          conmutar un bit magnético importa cada vez más. El trabajo de referencia{' '}
          <Cite id="badarneh2026" /> mostró que la teoría de control óptimo produce pulsos de campo
          conformados que invierten la magnetización en picosegundos con energías hasta dos órdenes de
          magnitud por debajo de los protocolos de campo convencionales.
        </p>
        <p>
          Espira no es una reimplementación de ese artículo. Reproduce sus resultados publicados como
          piso de verificación y luego hace lo que la literatura aún no ha hecho: control óptimo más
          allá del macrospin, el mecanismo de eje duro en CrSBr <Cite id="rudenko2023" />, el costo de
          la fiabilidad térmica, el precio de la realizabilidad de banda limitada, y la optimización conjunta de
          campo y corriente.
        </p>
        <h2>Lo que se comprobó contra otros</h2>
        <p>
          Un producto que solo se pone de acuerdo consigo mismo no es evidencia de nada. Los campos pico
          publicados por el trabajo de referencia se reproducen en tres de sus cuatro puntos, y el cuarto
          se muestra tal cual; la tabla de robustez térmica del artículo biaxial se reproduce en sus ocho
          celdas (Experimentos, Replicaciones publicadas). La barrera de energía la recalcula Spirit y la
          ecuación de movimiento la reintegra VAMPIRE, dos códigos escritos por otras personas con otros
          métodos (Implementación).
        </p>
        <h2>Honestidad</h2>
        <p>
          El costo de conmutación es una integral en unidades de tesla al cuadrado por segundo, no una
          energía. Se convierte en julios solo a través de un modelo de circuito explícito. No existe un
          conjunto de datos experimental público de conmutación por pulsos conformados en estos
          materiales; los datos reales son los parámetros del hamiltoniano de espín, cada uno con su
          DOI. El piso de energía es lineal en el amortiguamiento, que es el parámetro menos conocido,
          así que cada energía se reporta como banda, no como número único.
        </p>
        <Refs ids={['badarneh2026', 'rudenko2023']} label="Refs" />
      </article>
    );
  }
  return (
    <article className="prose">
      <h1>Espira</h1>
      <p className="lead">
        Optimal control of magnetization switching in two-dimensional van der Waals magnets: given a
        magnetic bit and a target switching time, compute the field or current pulse that flips it for
        the least dissipated energy.
      </p>
      <p>
        Data storage consumes a growing share of the world energy budget, and the cost of switching a
        magnetic bit matters more every year. The kickoff work <Cite id="badarneh2026" /> showed that
        optimal control theory produces shaped field pulses that reverse the magnetization within
        picoseconds at switching energies up to two orders of magnitude below conventional field
        protocols.
      </p>
      <p>
        Espira is not a reimplementation of that paper. It reproduces its published results as a
        verification floor and then does what the literature has not: optimal control beyond the
        macrospin, the hard-axis mechanism in CrSBr <Cite id="rudenko2023" />, the cost of thermal
        reliability, the price of band-limited realizability, and the co-optimization of field and
        current.
      </p>
      <h2>What has been checked against someone else</h2>
      <p>
        A product that only agrees with itself is not evidence of anything. The kickoff work's published
        peak fields reproduce at three of its four quoted points, and the fourth is shown as it is; the
        biaxial paper's thermal-robustness table reproduces in all eight of its cells (Experiments,
        Published replications). The energy barrier is recomputed by Spirit and the equation of motion
        re-integrated by VAMPIRE, two codes written by other people with other methods (Implementation).
      </p>
      <h2>Honesty</h2>
      <p>
        The switching cost is an integral in tesla-squared-seconds, not an energy. It becomes joules
        only through an explicit circuit model. There is no public experimental dataset of shaped-pulse
        switching in these materials; the real data is the set of spin-Hamiltonian parameters, each with
        a DOI. The energy floor is linear in the Gilbert damping, the least well pinned parameter, so
        every energy is reported as a band rather than a single number.
      </p>
      <Refs ids={['badarneh2026', 'rudenko2023']} label="Refs" />
    </article>
  );
}

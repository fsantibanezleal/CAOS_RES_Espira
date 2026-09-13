// Introduction: what Espira is, honestly, in both languages.

import { useShellLang, Cite } from '@fasl-work/caos-app-shell';

export function Introduction(): React.JSX.Element {
  const lang = useShellLang();
  if (lang === 'es') {
    return (
      <article className="prose">
        <h1>Espira</h1>
        <p className="lead">
          Control optimo de la conmutacion de la magnetizacion en imanes de van der Waals
          bidimensionales: dado un bit magnetico y un tiempo de conmutacion, calcular el pulso de campo
          o corriente que lo invierte con la menor energia disipada.
        </p>
        <p>
          El almacenamiento de datos consume una fraccion creciente de la energia mundial, y el costo de
          conmutar un bit magnetico importa cada vez mas. El trabajo de referencia{' '}
          <Cite id="badarneh2026" /> mostro que la teoria de control optimo produce pulsos de campo
          conformados que invierten la magnetizacion en picosegundos con energias hasta dos ordenes de
          magnitud por debajo de los protocolos de campo convencionales.
        </p>
        <p>
          Espira no es una reimplementacion de ese articulo. Reproduce sus resultados publicados como
          piso de verificacion y luego hace lo que la literatura aun no ha hecho: control optimo mas
          alla del macrospin, el mecanismo de eje duro en CrSBr, el costo de la fiabilidad termica, el
          precio de la realizabilidad de banda limitada, y la co-optimizacion de campo y corriente.
        </p>
        <h2>Honestidad</h2>
        <p>
          El costo de conmutacion es una integral en unidades de tesla al cuadrado por segundo, no una
          energia. Se convierte en julios solo a traves de un modelo de circuito explicito. No existe un
          conjunto de datos experimental publico de conmutacion por pulsos conformados en estos
          materiales; los datos reales son los parametros del hamiltoniano de espin, cada uno con su
          DOI. El piso de energia es lineal en el amortiguamiento, que es el parametro menos conocido,
          asi que cada energia se reporta como banda, no como numero unico.
        </p>
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
      <h2>Honesty</h2>
      <p>
        The switching cost is an integral in tesla-squared-seconds, not an energy. It becomes joules
        only through an explicit circuit model. There is no public experimental dataset of shaped-pulse
        switching in these materials; the real data is the set of spin-Hamiltonian parameters, each with
        a DOI. The energy floor is linear in the Gilbert damping, the least well pinned parameter, so
        every energy is reported as a band rather than a single number.
      </p>
    </article>
  );
}

// Theory: the optimal control problem, transcribed from the primary sources with KaTeX and citations.

import { useShellLang, Tabs, Equation, Cite, Refs } from '@fasl-work/caos-app-shell';

function Problem(): React.JSX.Element {
  const lang = useShellLang();
  return (
    <div className="prose">
      <p>
        {lang === 'es'
          ? 'Un momento magnético tiene una dirección s, un vector unitario. Queremos invertirlo en un tiempo T gastando la menor energía posible en el circuito que lo impulsa. La dinámica obedece la ecuación de Landau-Lifshitz-Gilbert:'
          : 'A magnetic moment has a direction s, a unit vector. We want to reverse it in a time T while spending the least energy in the circuit that drives it. The dynamics obey the Landau-Lifshitz-Gilbert equation:'}
      </p>
      <Equation tex="(1+\alpha^2)\,\dot{\vec s} = -\gamma\,\vec s \times (\vec b_i + \vec b) - \alpha\gamma\,\vec s \times [\vec s \times (\vec b_i + \vec b)]" />
      <p>
        {lang === 'es'
          ? 'con alfa el amortiguamiento de Gilbert, gamma la razón giromagnética, b_i el campo interno de anisotropía y b el campo de control. El costo es el calentamiento Joule del circuito:'
          : 'with alpha the Gilbert damping, gamma the gyromagnetic ratio, b_i the internal anisotropy field, and b the control field. The cost is the Joule heating of the circuit:'}
      </p>
      <Equation tex="\Phi = \int_0^T |\vec b(t)|^2\, dt" caption={lang === 'es' ? 'unidades de tesla al cuadrado por segundo, no julios' : 'units of tesla-squared-seconds, not joules'} />
      <p>
        {lang === 'es'
          ? 'La clave es invertir la ecuación de movimiento para expresar b en función de la trayectoria, convirtiendo un problema con restricción en uno sin restricción sobre s(t). Su minimizador es la trayectoria de control óptimo.'
          : 'The key move is to invert the equation of motion to express b in terms of the trajectory, turning a constrained problem into an unconstrained one over s(t). Its minimizer is the optimal control path.'}{' '}
        <Cite id="kwiatkowski2021" />
      </p>
      <Refs ids={['kwiatkowski2021', 'badarneh2026']} label="Refs" />
    </div>
  );
}

function Uniaxial(): React.JSX.Element {
  const lang = useShellLang();
  return (
    <div className="prose">
      <p>
        {lang === 'es'
          ? 'Para un imán puramente uniaxial, E = -K s_z^2, las ecuaciones de Euler-Lagrange se separan y la trayectoria óptima es exacta. El ángulo polar resuelve la ecuación de sine-Gordon y es una amplitud de Jacobi:'
          : 'For a purely uniaxial magnet, E = -K s_z^2, the Euler-Lagrange equations separate and the optimal path is exact. The polar angle solves the sine-Gordon equation and is a Jacobi amplitude:'}
      </p>
      <Equation tex="\theta(t) = \tfrac12\,\mathrm{am}\!\left(\frac{t}{p\tau_0(1+\alpha^2)}\,\middle|\,-\alpha^2 p^2\right)" />
      <p>
        {lang === 'es' ? 'El pulso óptimo es siempre perpendicular al momento, con amplitud' : 'The optimal pulse is always perpendicular to the moment, with amplitude'}
      </p>
      <Equation tex="b(t) = \frac{K}{\mu p \sqrt{1+\alpha^2}}\left[\mathrm{dn}(u) + \alpha p\,\mathrm{sn}(u)\right]" />
      <p>
        {lang === 'es' ? 'y el costo mínimo, el piso universal y el costo de macrospin libre son' : 'and the minimum cost, the universal floor, and the free-macrospin cost are'}
      </p>
      <Equation tex="\Phi_m = \frac{2K[2E(m)-K(m)]}{\gamma\mu p},\quad \Phi_\infty = \frac{4\alpha K}{\gamma\mu},\quad \Phi_f = \frac{\pi^2(1+\alpha^2)}{\gamma^2 T}" />
      <p>
        {lang === 'es'
          ? 'Estas formas cerradas son los controles positivos: todo método numérico se valida contra ellas antes de usarse donde no hay forma cerrada.'
          : 'These closed forms are the positive controls: every numerical method is validated against them before it is used where no closed form exists.'}{' '}
        <Cite id="kwiatkowski2021" /> <Cite id="sunwang2006" />
      </p>
      <Refs ids={['kwiatkowski2021', 'sunwang2006']} label="Refs" />
    </div>
  );
}

function HardAxis(): React.JSX.Element {
  const lang = useShellLang();
  return (
    <div className="prose">
      <p>
        {lang === 'es'
          ? 'Un eje duro reduce el costo de conmutación por debajo del piso de macrospin libre, algo imposible en un sistema uniaxial, porque el torque interno del material apunta en la dirección de conmutación en parte del espacio de configuración. Lo notable: la barrera de energía, y por tanto la estabilidad térmica, no cambia. Esto disuelve el dilema entre facilidad de escritura y estabilidad de la memoria magnética.'
          : 'A hard axis reduces the switching cost below the free-macrospin floor, which is impossible in a uniaxial system, because the material internal torque points in the switching direction in part of configuration space. The remarkable part: the energy barrier, and therefore the thermal stability, is unchanged. This dissolves the writability-versus-stability dilemma of magnetic memory.'}{' '}
        <Cite id="badarneh2023" />
      </p>
      {/* The word inside \text is prose, so it follows the page's language; String.raw keeps the TeX
          backslashes literal (a plain template literal would turn \t in \tilde into a tab). */}
      <Equation
        tex={String.raw`\tilde E = -K s_y^2 + \xi K s_x^2, \qquad \Phi_m(T) < \Phi_f(T) \;\text{${lang === 'es' ? 'cuando' : 'when'}}\; \xi > 0`}
      />
      <p>
        {lang === 'es'
          ? 'CrSBr es triaxial y su anisotropía es sintonizable por el sustrato, así que es el candidato natural para este mecanismo.'
          : 'CrSBr is triaxial and its anisotropy is substrate-tunable, so it is the natural host of this mechanism.'}{' '}
        <Cite id="rudenko2023" /> <Cite id="scheie2022" />
      </p>
      <Refs ids={['badarneh2023', 'rudenko2023', 'scheie2022']} label="Refs" />
    </div>
  );
}

export function Theory(): React.JSX.Element {
  const lang = useShellLang();
  return (
    <article className="prose">
      <h1>{lang === 'es' ? 'Teoría' : 'Theory'}</h1>
      <Tabs
        ariaLabel="theory sections"
        tabs={[
          { id: 'problem', label: lang === 'es' ? 'El problema' : 'The problem', content: <Problem /> },
          { id: 'uniaxial', label: lang === 'es' ? 'Solución uniaxial' : 'Uniaxial solution', content: <Uniaxial /> },
          { id: 'hardaxis', label: lang === 'es' ? 'Eje duro' : 'Hard axis', content: <HardAxis /> },
        ]}
      />
    </article>
  );
}

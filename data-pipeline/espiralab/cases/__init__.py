"""The case registry: the explicit coverage matrix of the product.

The 26 cases of the validated plan, in six categories: exact oracles, published replication, real
materials, beyond the macrospin, constrained and hybrid control, and screening with the learned policy.
Every case declares its variant family, its seed, its split, what a domain expert should see, and the
kill criterion that would make it a failure, before anything is computed.

Each case also carries an honest status. `baked` cases have committed artifacts; `planned` cases are
declared and runnable but not yet computed; `blocked` cases name what is missing. The coverage matrix in
the wiki and the Experiments page are generated from this registry, so a declared-but-absent case cannot
hide.
"""

from __future__ import annotations

from .model import GROUND_TRUTH, SPLITS, STATUSES, SURFACES, Case, SyntheticSystem, VariantAxis

__all__ = [
    "CASES",
    "Case",
    "SyntheticSystem",
    "VariantAxis",
    "baked_cases",
    "cases_by_category",
    "coverage_counts",
    "get_case",
    "validate_registry",
]

#: The default switching-time sweep, in units of the Larmor timescale tau0.
_SWEEP = (2.0, 5.0, 10.0, 20.0, 50.0, 100.0)
_LONG_SWEEP = (5.0, 10.0, 20.0, 50.0, 100.0, 200.0)


def _time_axis(values: tuple[float, ...] = _SWEEP) -> VariantAxis:
    return VariantAxis("switching_time", "Switching time", "tau0", values)


CATEGORIES = {
    "A. Exact oracles": "Closed-form or exactly-known answers every numerical method must reproduce.",
    "B. Published replication": "Figures and tables of the lineage papers, reproduced or refuted.",
    "C. Real materials": "Each van der Waals magnet from primary-source parameters, with a negative control.",
    "D. Beyond the macrospin": "Chains, patches and the continuum limit, where the single-moment picture fails.",
    "E. Constrained and hybrid control": "Bandwidth, amplitude and slew limits; field together with current.",
    "F. Screening and learned": "The parameter family as a search space, and the amortized policy on held-out materials.",
}

CASES: dict[str, Case] = {
    # ---------------------------------------------------------------- A. exact oracles
    "free-macrospin": Case(
        slug="free-macrospin",
        code="C01",
        title="Free macrospin, no anisotropy",
        category="A. Exact oracles",
        reason="With no anisotropy the optimal cost has the closed form pi^2 (1 + alpha^2) / (gamma^2 T), "
        "the fastest possible reversal of a free moment. It is the simplest oracle in the ladder.",
        expectation="The numerical cost matches the closed form at every switching time, and falls as 1/T.",
        kill_criterion="A numerical cost that differs from the closed form by more than a per cent at any "
        "switching time means the cost functional or the integrator is wrong.",
        axis=_time_axis(),
        status="planned",
        ground_truth="analytic",
        split="control",
        synthetic=SyntheticSystem(anisotropy_mev=0.15, damping=0.1),
        methods=("R05",),
        sources=("10.1103/PhysRevLett.126.177206",),
    ),
    "uniaxial-analytic": Case(
        slug="uniaxial-analytic",
        code="C02",
        title="Uniaxial macrospin, the analytic optimum",
        category="A. Exact oracles",
        reason="The closed-form uniaxial optimal control path in Jacobi elliptic functions, the exact "
        "result the whole product is built on.",
        expectation="The pulse reverses the moment exactly at T, its cost sits between the infinite-time "
        "floor and the free-macrospin cost, and the numerical solver converges onto it from above.",
        kill_criterion="A cost below the universal floor 4 alpha K / (gamma mu), or a pulse that does not "
        "reverse the moment, falsifies the implementation.",
        axis=_time_axis(),
        status="baked",
        ground_truth="analytic",
        split="control",
        synthetic=SyntheticSystem(),
        methods=("R05", "R07"),
        sources=("10.1103/PhysRevLett.126.177206",),
    ),
    "sot-analytic": Case(
        slug="sot-analytic",
        code="C03",
        title="Spin-orbit torque, the analytic optimum",
        category="A. Exact oracles",
        reason="The current-driven counterpart: the closed-form optimal spin-orbit-torque protocol, with "
        "its ideal field-like to damping-like ratio.",
        expectation="The optimal ratio xi_D = -alpha xi_F reproduces the published protocol; the cost "
        "falls with switching time like the field case.",
        kill_criterion="A reversal at the forbidden ratio xi_F = alpha xi_D, where the torque cannot "
        "drive the moment over the barrier, would mean the spin-orbit torque enters with the wrong sign.",
        axis=_time_axis(),
        status="planned",
        ground_truth="analytic",
        split="control",
        synthetic=SyntheticSystem(),
        methods=("R06",),
        sources=("10.1103/PhysRevB.105.134404",),
    ),
    "biaxial-hard-axis": Case(
        slug="biaxial-hard-axis",
        code="C04",
        title="Biaxial anisotropy, the hard-axis cost reduction",
        category="A. Exact oracles",
        reason="A hard axis lets the internal torque do part of the work, which is the one mechanism in "
        "this literature that beats the free-macrospin cost. The sweep over the hard-axis ratio is the "
        "mechanism's signature and has no closed form.",
        expectation="The benefit is not monotone. The cost falls to a minimum at a hard-axis ratio of "
        "order one (at this damping and switching time, about 45 per cent below the uniaxial optimum) and "
        "rises again for a stronger hard axis, which adds an in-plane barrier the moment must cross. "
        "Measured 2026-09-17; the location of the minimum moves with the damping.",
        kill_criterion="A cost below the universal floor means the internal torque is being double "
        "counted. A benefit that survives at long switching time would also be wrong: as the switching "
        "time grows the uniaxial cost saturates at the floor while the hard axis keeps charging for the "
        "in-plane barrier, so the mechanism must turn harmful there.",
        axis=VariantAxis("hard_axis_ratio", "Hard-axis ratio", "xi", (0.5, 1.0, 2.0, 3.0, 4.0, 5.0)),
        status="baked",
        ground_truth="provisional",
        split="control",
        synthetic=SyntheticSystem(damping=0.2),
        includes_biaxial=True,
        methods=("R07",),
        sources=("10.1103/PhysRevB.107.214448",),
    ),
    # ---------------------------------------------------------------- B. published replication
    "prb107-biaxial-figures": Case(
        slug="prb107-biaxial-figures",
        code="C05",
        title="Biaxial numerical optimal control (Phys. Rev. B 107, 214448, figures 3 and 7)",
        category="B. Published replication",
        reason="The lineage paper's own numerical optimal control paths for a biaxial particle; the "
        "closest published comparison for our image-based solver.",
        expectation="Our solver reproduces the published cost against switching time within the digitizing "
        "uncertainty of the figures.",
        kill_criterion="A systematic offset larger than the digitizing uncertainty means our cost "
        "functional differs from theirs, most likely in the anisotropy convention.",
        axis=_time_axis(),
        status="blocked",
        blocked_reason="The published figure values have not been digitized from the paper; without them "
        "there is nothing to compare against, and inventing reference points would be fabrication.",
        ground_truth="published",
        split="control",
        material="crsbr",
        methods=("R07",),
        sources=("10.1103/PhysRevB.107.214448",),
    ),
    "ocp-family": Case(
        slug="ocp-family",
        code="C06",
        title="The optimal control path family (several coexisting optima)",
        category="B. Published replication",
        reason="At a biaxial ratio of four and moderate damping, several distinct optimal control paths "
        "coexist at the same switching time. A single-seed solver reports one of them and calls it the "
        "optimum, which is the failure this case exists to expose.",
        expectation="A multi-seed search finds more than one distinct path, with costs close together, "
        "and the cheapest is reported.",
        kill_criterion="If every seed converges to the same path, either the search is not exploring or "
        "the family does not exist at these parameters; both change what the product may claim.",
        axis=VariantAxis("seed", "Search seed", "index", (0.0, 1.0, 2.0, 3.0, 4.0, 5.0)),
        status="planned",
        ground_truth="published",
        split="control",
        synthetic=SyntheticSystem(damping=0.2, hard_axis_ratio=4.0),
        includes_biaxial=True,
        methods=("R07",),
        sources=("10.1103/PhysRevB.107.214448",),
    ),
    "thermal-success-rate": Case(
        slug="thermal-success-rate",
        code="C07",
        title="Thermal success rate against switching time",
        category="B. Published replication",
        reason="An optimal pulse is derived at zero temperature; at finite temperature it sometimes fails. "
        "The success rate against the thermal stability factor is the honest reliability statement.",
        expectation="The success rate falls as the thermal stability factor falls, and the pulse that is "
        "optimal at zero temperature is not the most reliable one.",
        kill_criterion="A success rate that does not depend on temperature would mean the thermostat is "
        "not actually perturbing the trajectory.",
        axis=VariantAxis("stability_factor", "Thermal stability factor", "K/kT", (10.0, 20.0, 30.0, 40.0, 60.0, 80.0)),
        status="planned",
        ground_truth="published",
        split="control",
        material="crsbr",
        methods=("R11",),
        sources=("10.1103/PhysRevB.107.214448",),
    ),
    "sot-down-chirp": Case(
        slug="sot-down-chirp",
        code="C08",
        title="Spin-orbit torque, the simplified down-chirp protocol",
        category="B. Published replication",
        reason="The published simplified current protocol, which trades a little cost for a pulse a "
        "circuit can actually produce.",
        expectation="The simplified protocol costs more than the exact optimum by a modest factor and "
        "still reverses the moment.",
        kill_criterion="A simplified protocol that beats the exact optimum would mean the optimum is not "
        "optimal, and the analytic derivation is wrong.",
        axis=_time_axis(),
        status="planned",
        ground_truth="published",
        split="control",
        synthetic=SyntheticSystem(),
        methods=("R06", "R04"),
        sources=("10.1103/PhysRevB.105.134404",),
    ),
    "longitudinal-stabilization": Case(
        slug="longitudinal-stabilization",
        code="C09",
        title="Longitudinal stabilization, the cost of reliability",
        category="B. Published replication",
        reason="A field along the moment is invisible to the optimal pulse dynamics but removes the "
        "hyperbolic instability that thermal fluctuations excite. The published work shows the "
        "stabilization; what it costs is our own addition, and manuscript M1.",
        expectation="The success rate rises with the longitudinal field, and the added cost grows with "
        "its square, so there is a front rather than a free lunch.",
        kill_criterion="A longitudinal field that changes the zero-temperature trajectory would mean it "
        "is not longitudinal in the implementation.",
        axis=VariantAxis("longitudinal_field", "Longitudinal field", "B_r / (K/mu)", (0.0, 0.5, 1.0, 1.5, 2.0, 2.5)),
        status="baked",
        surface="experiments",
        ground_truth="published",
        split="control",
        material="crsbr",
        methods=("R11", "R12"),
        sources=("10.48550/arXiv.2312.11293",),
    ),
    "kickoff-replication": Case(
        slug="kickoff-replication",
        code="C10",
        title="The kickoff paper's own switching energies",
        category="B. Published replication",
        reason="The paper that started this product reports switching times and energies for three van "
        "der Waals magnets. Reproducing them is the most direct external check available.",
        expectation="Our costs, converted through an explicit circuit model, land in the same range as "
        "the published energies for the same materials and switching times.",
        kill_criterion="A disagreement larger than the damping uncertainty band would mean either their "
        "circuit assumption or our parameter set differs, and the product must say which.",
        axis=_time_axis(),
        status="blocked",
        blocked_reason="The full text is behind a Cloudflare challenge and has not been read. The "
        "abstract's 1 to 10 ps rotation window and the press summaries' 126 to 140 ps switching times are "
        "in tension, and no number may be quoted until the paper itself is read (programme backlog BL-002).",
        ground_truth="published",
        split="control",
        material="crsbr",
        methods=("R05", "R07"),
        sources=("10.1002/adma.202523059",),
    ),
    # ---------------------------------------------------------------- C. real materials
    "crsbr-field": Case(
        slug="crsbr-field",
        code="C11",
        title="CrSBr, field-driven reversal",
        category="C. Real materials",
        reason="The kickoff material and, because of its triaxial anisotropy, the natural host of the "
        "biaxial cost-reduction mechanism.",
        expectation="The optimal pulse cost falls with switching time toward the universal floor; the "
        "hard axis pushes the numerical cost below the free-macrospin floor.",
        kill_criterion="A biaxial cost above the free-macrospin cost would mean the hard axis is not "
        "being exploited, and the material's headline advantage does not exist.",
        axis=_time_axis(),
        status="baked",
        ground_truth="provisional",
        split="train",
        material="crsbr",
        includes_biaxial=True,
        methods=("R00", "R05", "R07"),
    ),
    "fe3gete2-field": Case(
        slug="fe3gete2-field",
        code="C12",
        title="Fe3GeTe2, field-driven reversal",
        category="C. Real materials",
        reason="An itinerant metal with strong perpendicular anisotropy, cleanly uniaxial, and a "
        "spin-orbit-torque-compatible conductor.",
        expectation="Uniaxial: the analytic optimal control path applies and the cost cannot beat the "
        "free-macrospin floor.",
        kill_criterion="A cost below the free-macrospin floor for a uniaxial material would mean the "
        "analytic solution is being applied outside its validity.",
        axis=_time_axis(),
        status="baked",
        ground_truth="provisional",
        split="train",
        material="fe3gete2",
        methods=("R00", "R05"),
    ),
    "fe3gate2-field": Case(
        slug="fe3gate2-field",
        code="C13",
        title="Fe3GaTe2, field-driven reversal",
        category="C. Real materials",
        reason="The only above-room-temperature member of the family, so the only one whose numbers "
        "matter for a device that runs on a desk.",
        expectation="Uniaxial, room-temperature-relevant; the cost curve mirrors Fe3GeTe2 scaled by its "
        "anisotropy and moment.",
        kill_criterion="A cost curve that does not scale with the anisotropy and moment as the analytic "
        "solution predicts would mean the parameter canonicalization is wrong.",
        axis=_time_axis(),
        status="baked",
        ground_truth="provisional",
        split="train",
        material="fe3gate2",
        methods=("R00", "R05"),
    ),
    "cri3-field": Case(
        slug="cri3-field",
        code="C14",
        title="CrI3, field-driven reversal",
        category="C. Real materials",
        reason="The archetypal two-dimensional magnet and the clean strong-uniaxial extreme of the family.",
        expectation="Large anisotropy: a fast, high-amplitude optimal pulse; the analytic solution is exact.",
        kill_criterion="A peak field far outside what a laboratory coil or an antenna can produce, without "
        "the product saying so, would make the result a number rather than a result.",
        axis=_time_axis(),
        status="baked",
        ground_truth="provisional",
        split="test",
        material="cri3",
        methods=("R00", "R05"),
    ),
    "cr2ge2te6-floor": Case(
        slug="cr2ge2te6-floor",
        code="C15",
        title="Cr2Ge2Te6, the low-damping floor",
        category="C. Real materials",
        reason="The record-low-damping member, which sets the best-case universal floor because that floor "
        "is linear in the damping.",
        expectation="The lowest universal floor of the family, with a narrow band because the damping is "
        "measured rather than assumed.",
        kill_criterion="A floor that does not scale linearly with the damping would falsify the floor "
        "formula the product quotes everywhere.",
        axis=_time_axis(),
        status="baked",
        ground_truth="provisional",
        split="test",
        material="cr2ge2te6",
        methods=("R00", "R05"),
    ),
    "fe5gete2-field": Case(
        slug="fe5gete2-field",
        code="C16",
        title="Fe5GeTe2, the near-room-temperature metal",
        category="C. Real materials",
        reason="A metallic member whose ordering temperature is near room temperature with a weaker "
        "perpendicular anisotropy, which moves it to a different corner of the parameter space.",
        expectation="A lower anisotropy than Fe3GeTe2 gives a lower floor and a longer natural timescale.",
        kill_criterion="Parameters that cannot be traced to a primary source must not enter; a case "
        "without provenance is not a case.",
        axis=_time_axis(),
        status="planned",
        ground_truth="provisional",
        split="test",
        methods=("R00", "R05"),
    ),
    "crcl3-crbr3-contrast": Case(
        slug="crcl3-crbr3-contrast",
        code="C17",
        title="CrCl3 against CrBr3, the anisotropy-sign contrast",
        category="C. Real materials",
        reason="Two members of one chemical family with opposite anisotropy character, easy-plane against "
        "easy-axis. The optimal control problem changes qualitatively between them.",
        expectation="The easy-plane member has no barrier along the field axis in the macrospin picture, "
        "so the product must refuse the uniaxial machinery rather than produce a number.",
        kill_criterion="Producing a switching cost for an easy-plane material through the easy-axis "
        "solution would be exactly the error the negative control exists to catch.",
        axis=_time_axis(),
        status="planned",
        ground_truth="provisional",
        split="test",
        methods=("R00", "R05"),
    ),
    "feps3-negative-control": Case(
        slug="feps3-negative-control",
        code="C18",
        title="FePS3, negative control",
        category="C. Real materials",
        reason="An Ising antiferromagnet where uniform ferromagnetic-macrospin reversal is not the "
        "relevant switching mode. Included to show the machinery's honest limit.",
        expectation="The macrospin numbers are computed and shown with an explicit banner: they are what "
        "the machinery returns when its own assumptions fail, not predictions.",
        kill_criterion="Presenting these numbers without that warning anywhere they appear would make the "
        "product dishonest, which is the failure this case guards against.",
        axis=_time_axis(),
        status="baked",
        ground_truth="provisional",
        split="control",
        material="feps3",
        methods=("R00", "R05"),
    ),
    # ---------------------------------------------------------------- D. beyond the macrospin
    "chain-crossover": Case(
        slug="chain-crossover",
        code="C19",
        title="The spin chain, where uniform rotation stops being optimal",
        category="D. Beyond the macrospin",
        reason="The open question the method's authors state in print: under what conditions nonuniform "
        "reversal becomes the energy-efficient mechanism.",
        expectation="Short chains and short switching times reverse uniformly; above a crossover length "
        "and at long switching time a domain wall is cheaper, bounded below by the barrier floor.",
        kill_criterion="A cost below the minimum-energy-path floor would falsify either the floor "
        "derivation or the solver; a cost above the uniform bound would mean the search is broken.",
        axis=VariantAxis("chain_length", "Chain length", "sites", (4.0, 6.0, 8.0, 10.0, 12.0, 16.0, 20.0, 24.0, 32.0)),
        status="baked",
        surface="experiments",
        ground_truth="provisional",
        split="control",
        synthetic=SyntheticSystem(damping=0.5),
        methods=("R07", "R16"),
        sources=("10.1103/PhysRevB.107.214448", "10.17586/2220-8054-2020-11-3-294-300"),
    ),
    "patch-2d-crsbr": Case(
        slug="patch-2d-crsbr",
        code="C20",
        title="A two-dimensional CrSBr patch, size sweep",
        category="D. Beyond the macrospin",
        reason="A chain is one dimension; a real element is a patch. The crossover length in two "
        "dimensions is the quantity a device designer actually needs.",
        expectation="The same barrier argument applies with a two-dimensional wall, so the crossover "
        "moves to a different length scale.",
        kill_criterion="A two-dimensional result that contradicts the one-dimensional limit at small "
        "width would mean the lattice generalization is wrong.",
        axis=VariantAxis("patch_width", "Patch width", "sites", (4.0, 8.0, 12.0, 16.0, 24.0, 32.0)),
        status="planned",
        ground_truth="provisional",
        split="control",
        methods=("R16",),
    ),
    "patch-2d-fe3gate2": Case(
        slug="patch-2d-fe3gate2",
        code="C21",
        title="A two-dimensional Fe3GaTe2 patch, perpendicular anisotropy",
        category="D. Beyond the macrospin",
        reason="The perpendicular-anisotropy metal in two dimensions, the geometry closest to a "
        "magnetic memory cell.",
        expectation="Strong perpendicular anisotropy narrows the wall, which pushes the crossover to "
        "larger patches than the weakly anisotropic case.",
        kill_criterion="A wall width that does not follow the square root of the exchange over the "
        "anisotropy would mean the energetics are wrong.",
        axis=VariantAxis("patch_width", "Patch width", "sites", (4.0, 8.0, 12.0, 16.0, 24.0, 32.0)),
        status="planned",
        ground_truth="provisional",
        split="control",
        methods=("R16",),
    ),
    "continuum-cross-check": Case(
        slug="continuum-cross-check",
        code="C22",
        title="Continuum cross-check against a micromagnetic solver",
        category="D. Beyond the macrospin",
        reason="Our lattice solver and an established micromagnetic code should agree in the continuum "
        "limit. Agreement is evidence; disagreement is a finding either way.",
        expectation="Wall energies and reversal costs agree within the discretization error once the "
        "lattice spacing is small against the wall width.",
        kill_criterion="A disagreement that does not shrink with the lattice spacing means one of the "
        "two energy functionals is wrong.",
        axis=VariantAxis("lattice_spacing", "Sites per wall width", "sites", (1.0, 2.0, 4.0, 6.0, 8.0, 12.0)),
        status="planned",
        ground_truth="provisional",
        split="control",
        methods=("R16",),
    ),
    # ---------------------------------------------------------------- E. constrained and hybrid
    "crab-bandwidth": Case(
        slug="crab-bandwidth",
        code="C23",
        title="Band-limited control, the price of realizability",
        category="E. Constrained and hybrid control",
        reason="An arbitrary-waveform optimum is not what an antenna emits. Restricting the pulse to a "
        "few harmonics prices what realizability costs.",
        expectation="The cost rises as the bandwidth falls, gently at first and then sharply once the "
        "pulse can no longer follow the precession.",
        kill_criterion="A band-limited pulse cheaper than the unconstrained optimum would mean the "
        "unconstrained solver is stuck in a local minimum.",
        axis=VariantAxis("harmonics", "Harmonics", "count", (1.0, 2.0, 3.0, 4.0, 6.0, 8.0)),
        status="planned",
        ground_truth="analytic",
        split="control",
        synthetic=SyntheticSystem(),
        methods=("R09", "R05"),
    ),
    "grape-amplitude-slew": Case(
        slug="grape-amplitude-slew",
        code="C24",
        title="Amplitude and slew-rate limited control",
        category="E. Constrained and hybrid control",
        reason="A driver has a maximum field and a maximum rate of change. The optimum under those two "
        "limits is what an engineer can actually ask for.",
        expectation="Below a critical amplitude cap the moment cannot be reversed in the given time at "
        "any cost, and the solver must report failure rather than a number.",
        kill_criterion="A reported reversal under a cap that cannot physically reverse the moment means "
        "the constraint is not being enforced.",
        axis=VariantAxis("amplitude_cap", "Amplitude cap", "K/mu", (0.5, 1.0, 1.5, 2.0, 3.0, 5.0)),
        status="planned",
        ground_truth="analytic",
        split="control",
        synthetic=SyntheticSystem(),
        methods=("R08", "R05"),
    ),
    "field-plus-current": Case(
        slug="field-plus-current",
        code="C25",
        title="Field together with current, the hybrid cost",
        category="E. Constrained and hybrid control",
        reason="The kickoff paper names hybridization with current- and light-driven approaches as the "
        "open design space. The two-term cost prices the trade directly.",
        expectation="As the relative price of current falls, the optimum shifts from field-dominated to "
        "current-dominated; whether the mixture ever beats both pure protocols is the open question.",
        kill_criterion="A hybrid that beats both pure protocols at every price would be too good: it "
        "would mean the two cost terms are not being weighed consistently.",
        axis=VariantAxis("current_price", "Current price", "C_j / C_b", (0.1, 0.3, 1.0, 3.0, 10.0, 30.0)),
        status="planned",
        ground_truth="provisional",
        split="control",
        synthetic=SyntheticSystem(),
        methods=("R13",),
        sources=("10.1002/adma.202523059",),
    ),
    # ---------------------------------------------------------------- F. screening and learned
    "amortized-policy": Case(
        slug="amortized-policy",
        code="C26",
        title="The amortized policy on held-out materials",
        category="F. Screening and learned",
        reason="Every solver here re-optimizes from scratch. A policy that emits a near-optimal pulse "
        "instantly is the useful object, and the uniaxial optimum is known, so its claim is checkable.",
        expectation="On materials it never trained on, the emitted pulse reverses the moment and costs "
        "within ten per cent of the analytic optimum.",
        kill_criterion="A policy that cannot reach the analytic optimum where the optimum is known has "
        "no business being trusted anywhere else; that is the pre-declared acceptance gate.",
        axis=VariantAxis("damping", "Damping", "alpha", (0.005, 0.01, 0.05, 0.1, 0.2, 0.5)),
        status="planned",
        ground_truth="analytic",
        split="test",
        methods=("R15",),
    ),
}


def get_case(slug: str) -> Case:
    """Look up a case by slug.

    Raises:
        KeyError: if the slug is unknown.
    """
    if slug not in CASES:
        raise KeyError(f"unknown case {slug!r}; known: {list(CASES)}")
    return CASES[slug]


def baked_cases(surface: str | None = None) -> dict[str, Case]:
    """The cases with committed artifacts, optionally restricted to one surface."""
    return {
        slug: case
        for slug, case in CASES.items()
        if case.status == "baked" and (surface is None or case.surface == surface)
    }


def cases_by_category() -> dict[str, list[Case]]:
    """The cases grouped by category, in registry order."""
    grouped: dict[str, list[Case]] = {}
    for case in CASES.values():
        grouped.setdefault(case.category, []).append(case)
    return grouped


def coverage_counts() -> dict[str, int]:
    """How many cases are baked, planned and blocked."""
    counts = dict.fromkeys(STATUSES, 0)
    for case in CASES.values():
        counts[case.status] += 1
    return counts


def validate_registry() -> None:
    """Check the registry's internal contract. Raises on the first violation.

    Every case: a unique code; a known status, split, ground truth and surface; a reason, an expectation
    and a kill criterion; at least six variants; a material in the database or a synthetic system when it
    is baked; a blocked reason if and only if it is blocked; a biaxial case needs a hard axis.
    """
    from ..materials import material_slugs

    known = set(material_slugs())
    codes: set[str] = set()
    for slug, case in CASES.items():
        if case.slug != slug:
            raise ValueError(f"case {slug!r} carries slug {case.slug!r}")
        if case.code in codes:
            raise ValueError(f"duplicate case code {case.code}")
        codes.add(case.code)
        if case.status not in STATUSES:
            raise ValueError(f"case {slug!r} has unknown status {case.status!r}")
        if case.split not in SPLITS:
            raise ValueError(f"case {slug!r} has unknown split {case.split!r}")
        if case.ground_truth not in GROUND_TRUTH:
            raise ValueError(f"case {slug!r} has unknown ground truth {case.ground_truth!r}")
        if case.surface not in SURFACES:
            raise ValueError(f"case {slug!r} has unknown surface {case.surface!r}")
        for field_name in ("reason", "expectation", "kill_criterion"):
            if not getattr(case, field_name).strip():
                raise ValueError(f"case {slug!r} has no {field_name}")
        if len(case.axis.values) < 6:
            raise ValueError(f"case {slug!r} declares {len(case.axis.values)} variants, fewer than six")
        if (case.status == "blocked") != bool(case.blocked_reason.strip()):
            raise ValueError(f"case {slug!r}: a blocked reason is required exactly when blocked")
        if case.material is not None and case.material not in known:
            raise ValueError(f"case {slug!r} references unknown material {case.material!r}")
        if case.status == "baked" and case.material is None and case.synthetic is None:
            raise ValueError(f"baked case {slug!r} has neither a material nor a synthetic system")
        if case.includes_biaxial:
            ratio = (
                case.synthetic.hard_axis_ratio
                if case.synthetic is not None
                else _material_hard_axis(case.material)
            )
            if case.axis.name != "hard_axis_ratio" and ratio <= 0.0:
                raise ValueError(f"biaxial case {slug!r} runs on a system with no hard axis")


def _material_hard_axis(slug: str | None) -> float:
    from ..materials import get_material

    return 0.0 if slug is None else get_material(slug).hard_axis_ratio

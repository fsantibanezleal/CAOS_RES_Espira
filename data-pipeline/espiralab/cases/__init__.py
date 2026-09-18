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

from .model import (
    GROUND_TRUTH,
    SPLITS,
    STATUSES,
    SURFACES,
    Case,
    Observable,
    SyntheticSystem,
    VariantAxis,
)

__all__ = [
    "CASES",
    "Case",
    "Observable",
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
        reason="A moment with no magnetic potential costs pi^2 (1 + alpha^2) / (gamma^2 T) to reverse, "
        "the fastest possible reversal and the reference every material is scored against. The free limit "
        "is reached by making the switching time short compared with the Larmor time tau0 rather than by "
        "setting the anisotropy to zero, which the engine refuses because tau0 would be undefined: below "
        "tau0 the anisotropy has no time to act, and both solvers must return the free cost.",
        expectation="Both the closed-form uniaxial optimum and the numerical image-based solver return the "
        "free-moment cost, and it falls as 1/T. Measured 2026-09-17: the deviation from the closed form is "
        "below one part in a million up to 0.2 tau0 and is 1.5e-4 at one tau0, where the anisotropy starts "
        "to be felt, so the approach to the free limit is visible along the sweep rather than assumed.",
        kill_criterion="A numerical cost that differs from the closed form by more than a per cent at any "
        "switching time means the cost functional or the integrator is wrong. A cost BELOW the free value "
        "would be worse: no uniaxial magnet can beat it.",
        axis=_time_axis((0.02, 0.05, 0.1, 0.2, 0.5, 1.0)),
        status="baked",
        ground_truth="analytic",
        split="control",
        synthetic=SyntheticSystem(anisotropy_mev=0.15, damping=0.1),
        methods=("R05", "R07"),
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
        expectation="At the ideal ratio xi_D = -alpha xi_F the current torque points entirely along the "
        "switching direction, the average current follows Eq. 8 exactly, and the fast-switching cost "
        "asymptote falls as 1/T like the field case. At the forbidden ratio xi_F = alpha xi_D the protocol "
        "is reported as forbidden rather than returning a finite cost. The reported quantity is a current "
        "integral in the reference reduced units, NOT a field cost in T^2 s, and the case declares that so "
        "it is never mixed into a field-cost comparison.",
        kill_criterion="A reversal at the forbidden ratio xi_F = alpha xi_D, where the torque cannot "
        "drive the moment over the barrier, would mean the spin-orbit torque enters with the wrong sign. "
        "A mean current that disagrees with the closed form of Eq. 8, or a reduced-unit cost quoted in "
        "T^2 s, is equally a failure.",
        axis=_time_axis(),
        status="baked",
        ground_truth="analytic",
        split="control",
        synthetic=SyntheticSystem(),
        primary_method="R06",
        observable=Observable(
            key="mean_current_reduced",
            label="Mean optimal current",
            unit="reduced units j0",
            is_field_cost=False,
            note="The spin-orbit-torque control is a current, and its cost is Joule heating in the "
            "reference reduced units. It is not a field cost in T^2 s and the two are never compared.",
        ),
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
        expectation="A multi-seed search finds more than one distinct converged path, and they are NOT "
        "close together. Measured 2026-09-17 at a hard-axis ratio of four, a damping of 0.2 and ten tau0: "
        "two families, one passing near the easy plane at 1.5206e-11 T^2 s and one climbing over the hard "
        "axis at 2.0250e-11, a spread of 33 per cent. Three of the six seeds land on the expensive family, "
        "so a single-seed solver has an even chance of reporting a cost a third too high and calling it "
        "the optimum. The cheapest is what the product reports everywhere else, which is why every "
        "biaxial bake in this repository runs a multi-seed search.",
        kill_criterion="If every seed converges to the same path, either the search is not exploring or "
        "the family does not exist at these parameters; both change what the product may claim. A seed "
        "that converges BELOW the cheapest family would mean the converged flag is not trustworthy.",
        axis=VariantAxis("seed", "Search seed", "index", (0.0, 1.0, 2.0, 3.0, 4.0, 5.0)),
        status="baked",
        ground_truth="published",
        split="control",
        synthetic=SyntheticSystem(damping=0.2, hard_axis_ratio=4.0),
        includes_biaxial=True,
        primary_method="R07",
        methods=("R07",),
        sources=("10.1103/PhysRevB.107.214448",),
    ),
    "thermal-success-rate": Case(
        slug="thermal-success-rate",
        code="C07",
        title="Thermal success rate against the stability factor",
        category="B. Published replication",
        reason="An optimal pulse is derived at zero temperature; at finite temperature it sometimes fails. "
        "The success rate against the thermal stability factor is the honest reliability statement. The "
        "factor is per site: a single CrSBr site carries an anisotropy of 1.7 K in temperature units, so "
        "the window where the pulse starts to fail is sub-Kelvin. Device-grade retention comes from the "
        "exchange-coupled volume, not from one site, and this case measures the single site.",
        expectation="The success rate falls as the thermal stability factor falls, and the pulse that is "
        "optimal at zero temperature is NOT the most reliable one: the same pulse with a longitudinal "
        "field at twice the anisotropy field succeeds more often, at an added cost the case reports. "
        "Measured 2026-09-17 with 600 copies per point: 0.810 against 0.952 at a stability factor of two, "
        "and 0.983 against 1.000 at ten. The declared window (10 to 80) was corrected to (1 to 20) from "
        "measurement, because above ten the zero-temperature pulse already succeeds essentially always "
        "and the case would have shown a flat line.",
        kill_criterion="A success rate that does not depend on temperature would mean the thermostat is "
        "not actually perturbing the trajectory. A longitudinal field that buys reliability at NO added "
        "cost would mean the added cost is not being charged.",
        axis=VariantAxis("stability_factor", "Thermal stability factor", "K/kT", (1.0, 2.0, 3.0, 5.0, 10.0, 20.0)),
        status="baked",
        ground_truth="published",
        split="control",
        material="crsbr",
        primary_method="R11",
        observable=Observable(
            key="success_rate",
            label="Switching success rate",
            unit="fraction of copies",
            is_field_cost=False,
            note="A reliability case reports how often the pulse reversed the moment out of the ensemble, "
            "with its 95 per cent interval. The field cost of the pulse is the same at every point of the "
            "sweep, so plotting it would say nothing.",
        ),
        methods=("R11", "R12"),
        sources=("10.1103/PhysRevB.107.214448",),
    ),
    "sot-down-chirp": Case(
        slug="sot-down-chirp",
        code="C08",
        title="Spin-orbit torque, the simplified down-chirp protocol",
        category="B. Published replication",
        reason="At the ideal ratio of the spin-orbit-torque couplings the optimal current rotates at the "
        "precession frequency and reverses its rotation at the barrier crossing. The source replaces it "
        "by a current a circuit can produce: constant amplitude, frequency swept linearly from 1.4 times "
        "the resonant frequency to minus that (its Eq. 15), and reports the switching probability at a "
        "thermal stability factor of 60. Those probabilities are the published ground truth.",
        expectation="The source reports a switching probability of 0.89 at 0.17 j0, 0.97 at 0.18 j0 and "
        "practically one at 0.20 j0. Measured 2026-09-18 with 1,000 stochastic copies per point, this "
        "engine does NOT reproduce them: 0.009 at 0.17 j0, 0.043 at 0.18, 0.22 at 0.20, 0.59 at 0.22 and "
        "0.90 at 0.25, the same curve shifted up by about 1.4 in amplitude, with a zero-temperature "
        "threshold of 0.21 j0. Ruled out: the rotation sense, the starting tilt, the coupling convention, "
        "the chirp tuning, thermal noise, the pulse length and a factor of two in the time unit. The case "
        "is a recorded non-replication, not a hidden one; the sweep extends past the published amplitudes "
        "so the engine's own curve is visible.",
        kill_criterion="Quoting the source's probabilities as reproduced when the engine does not reproduce "
        "them. Equally, a chirped pulse that switches in the counter-rotating sense would mean the "
        "spin-orbit torque enters with the wrong handedness.",
        axis=VariantAxis("current_amplitude", "Current amplitude", "j0", (0.17, 0.18, 0.20, 0.22, 0.25, 0.30)),
        status="baked",
        ground_truth="published",
        split="control",
        synthetic=SyntheticSystem(),
        primary_method="R04",
        observable=Observable(
            key="success_rate",
            label="Switching probability",
            unit="fraction of copies",
            is_field_cost=False,
            note="A replication of published switching probabilities, so the case reports the fraction of "
            "1,000 stochastic copies that reversed, at a thermal stability factor of 60, beside the "
            "published value where the source gives one.",
        ),
        methods=("R04",),
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
        reason="A metallic member whose ordering temperature is near room temperature (310 K in bulk "
        "single crystals), which would move the family into the regime a device operates in.",
        expectation="Not computable yet, because the material's anisotropy is not one number. Bulk "
        "ferromagnetic resonance at 290 K finds an easy PLANE with no uniaxial anisotropy inside it "
        "(Bera 2024), which leaves no bistable state to switch between; bulk magnetometry and flake "
        "measurements report a weak perpendicular anisotropy, and flakes thinner than six layers cant "
        "in-plane (ACS Nano 2022, layer-dependent domains). The declared premise, a weaker perpendicular "
        "anisotropy than Fe3GeTe2, holds only in some of those regimes. The case bakes once a primary "
        "source gives a quantitative perpendicular anisotropy, a moment and a damping measured in the "
        "same regime.",
        kill_criterion="Parameters that cannot be traced to a primary source must not enter; a case "
        "without provenance is not a case. Mixing an anisotropy from one temperature or thickness with a "
        "damping from another would be the same failure in a quieter form.",
        axis=_time_axis(),
        status="planned",
        ground_truth="provisional",
        split="test",
        methods=("R00", "R05"),
        sources=("10.1103/PhysRevB.110.224401", "10.1021/acsnano.2c01948", "10.1088/2053-1583/ac2028"),
    ),
    "crcl3-crbr3-contrast": Case(
        slug="crcl3-crbr3-contrast",
        code="C17",
        title="CrBr3 against CrCl3, a bit and a non-bit",
        category="C. Real materials",
        reason="Two members of one chemical family with opposite anisotropy character. CrBr3 has a weak "
        "easy axis (a single-ion term fitted to inelastic neutron scattering, Cai 2021) and is a "
        "switchable bit. CrCl3 has an easy PLANE that is the dipolar shape anisotropy barely overcoming "
        "the weak spin-orbit coupling of the light ligand, with no measurable preference inside the plane "
        "and antiferromagnetic stacking in bulk (Schneeloch 2022): it has no bistable single-domain state "
        "at all.",
        expectation="CrBr3 switches like the rest of the easy-axis family, with the lowest anisotropy "
        "of the materials here (0.045 meV per site), so the lowest floor and the longest natural "
        "timescale. CrCl3 is refused: with no barrier there is no bit to write, and the product must not "
        "produce a switching cost for it. It enters no parameter table, and this case says why.",
        kill_criterion="Producing a switching cost for an easy-plane material through the easy-axis "
        "solution would be exactly the error the negative control exists to catch. For CrBr3, quoting "
        "its anisotropy as resolved when it is a fit below the instrument resolution would overstate it.",
        axis=_time_axis(),
        status="baked",
        ground_truth="provisional",
        split="test",
        material="crbr3",
        methods=("R00", "R05"),
        sources=("10.1103/PhysRevB.104.L020402", "10.1038/s41535-022-00473-3"),
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
        expectation="The cost falls monotonically as the bandwidth grows and flattens out well above the "
        "unconstrained optimum: the gap that remains is the price of realizability. Measured 2026-09-17 "
        "on the reference macrospin at ten tau0, against the closed form: 2.15 at one harmonic, 1.39 at "
        "two, 1.23 at three, 1.16 at four, 1.15 at six and 1.14 at eight. The floor of about 14 per cent "
        "is the cost of a pulse that must be band limited and must vanish at both ends of the window.",
        kill_criterion="A band-limited pulse cheaper than the unconstrained optimum would mean the "
        "unconstrained solver is stuck in a local minimum, or that the band-limited pulse did not "
        "finish the reversal and banked the saving. A cost that RISES with bandwidth is equally a "
        "failure: more harmonics is a strictly larger feasible set. That is what caught the engine's "
        "previous solver, which returned 2.2 times the optimum at two harmonics and 14 times at six.",
        axis=VariantAxis("harmonics", "Harmonics", "count", (1.0, 2.0, 3.0, 4.0, 6.0, 8.0)),
        status="baked",
        primary_method="R09",
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
        "any cost, and the solver must report failure rather than a number. Above it the cost falls back "
        "onto the unconstrained optimum, because a cap that does not bind costs nothing. Measured "
        "2026-09-17 on the reference macrospin at ten tau0, where the unconstrained optimum itself peaks "
        "at 0.63 anisotropy fields: no reversal at 0.3 or 0.4 per component, 1.08 times the optimum at "
        "0.5, 1.008 at 0.6, and 1.003 from one upwards. The threshold sits between 0.4 and 0.5, and a "
        "cap binds per component, so the magnitude it allows is larger by the square root of two.",
        kill_criterion="A reported reversal under a cap that cannot physically reverse the moment means "
        "the constraint is not being enforced. A cost BELOW the unconstrained optimum means the pulse "
        "did not finish the reversal, which is the failure the reversal threshold exists to catch.",
        axis=VariantAxis("amplitude_cap", "Amplitude cap", "K/mu", (0.3, 0.4, 0.5, 0.6, 1.0, 2.0)),
        status="baked",
        primary_method="R08",
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
        "current-dominated. Measured 2026-09-17 on the reference macrospin at ten tau0 with a "
        "spin-orbit-torque coupling of 0.05 on both the field-like and damping-like channels: the share "
        "of the weighted cost carried by the field falls from 0.96 at a price of 0.1 to 0.72 at 0.01, "
        "0.21 at 0.001 and 0.11 at 0.0001, and the field cost itself drops to 0.4 per cent of the "
        "field-only optimum, which is the current doing the work, so the crossover is inside that window and the originally "
        "declared sweep (0.1 to 30) sat entirely on the field-dominated side. The quantity plotted is the "
        "FIELD cost, which is comparable with every other case; the weighted cost mixes two units and is "
        "meaningful only at a fixed price.",
        kill_criterion="A hybrid that beats both pure protocols at every price would be too good: it "
        "would mean the two cost terms are not being weighed consistently.",
        axis=VariantAxis("current_price", "Current price", "C_j / C_b", (0.0001, 0.001, 0.01, 0.1, 1.0, 10.0)),
        status="baked",
        primary_method="R13",
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
        expectation="Inside the damping range it was trained over (the van der Waals family, 3e-4 to "
        "4e-2), the emitted pulse reverses the moment and costs within about ten per cent of the analytic "
        "optimum, including at the held-out materials' dampings. Outside that range it degrades and then "
        "fails: measured 2026-09-17, 1.11 times the optimum at a damping of 0.05, 1.86 at 0.1, and no "
        "reversal at all at 0.2 and above. The sweep is deliberately wider than the training range so the "
        "limit of amortization is visible rather than implied.",
        kill_criterion="A policy that cannot reach the analytic optimum INSIDE its training range, where "
        "the optimum is known, has no business being trusted anywhere else; that is the pre-declared "
        "acceptance gate, and it is what the model registry records. Failing outside the range is not a "
        "kill, but presenting those numbers without saying the pulse did not switch would be.",
        axis=VariantAxis("damping", "Damping", "alpha", (0.005, 0.01, 0.05, 0.1, 0.2, 0.5)),
        status="baked",
        ground_truth="analytic",
        split="test",
        synthetic=SyntheticSystem(),
        primary_method="R15",
        methods=("R15", "R05"),
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

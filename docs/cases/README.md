# Cases

A case is a scientific question the product answers with a baked result: a material, a regime, and a
family of variants. The validated plan (programme plan section 4) defines 26 cases in six categories.
This page is the coverage matrix against that plan; each baked case has its own page, generated from the
registry.

## Categories of the plan

| Category | Purpose |
|---|---|
| A. Positive controls | Exact oracles the numerical methods must reproduce |
| B. Published replication | Reproduce the lineage papers' figures and tables |
| C. Real materials, macrospin | Each van der Waals magnet from primary-source parameters, including a negative control |
| D. Beyond macrospin | Chains, 2D patches, and a continuum cross-check |
| E. Constrained and hybrid control | Bandwidth, amplitude and slew limits; field plus current |
| F. Screening and learned | Screening over the parameter database; the amortized policy on held-out materials |

## Coverage matrix

| Plan case | Baked as | Status |
|---|---|---|
| C01 free macrospin; C02 uniaxial analytic; C03 SOT analytic; C04 biaxial perturbative | engine test suite (positive controls) | validated in `spinoct`, not baked as product cases |
| C05 biaxial numerical OCP replication (PRB 107 214448) | engine test suite | not baked |
| C06 six-OCP family; C07 thermal success table; C08 SOT down-chirp; C09 longitudinal stabilization | partially in the engine (C09 underlies the reliability front) | not baked |
| C10 the kickoff paper's own figures | none | blocked: the full text is Cloudflare-blocked (backlog BL-002) |
| C11 CrSBr | [crsbr-field](crsbr-field.md) | baked, includes the biaxial solve |
| C12 Fe3GeTe2 | [fe3gete2-field](fe3gete2-field.md) | baked |
| C13 Fe3GaTe2 | [fe3gate2-field](fe3gate2-field.md) | baked |
| C14 CrI3 | [cri3-field](cri3-field.md) | baked |
| C15 Cr2Ge2Te6 | [cr2ge2te6-floor](cr2ge2te6-floor.md) | baked |
| C16 Fe5GeTe2; C17 CrCl3 versus CrBr3 | none | parameters not yet transcribed |
| C18 FePS3 negative control | [feps3-negative-control](feps3-negative-control.md) | baked with 3 variants; the case contract requires 6 |
| C19 1D chain | the free chain crossover map (`data/artifacts/lattice_ocp.json`, Experiments page) | baked as a J/K = 10 map over length, time and damping; the Nanosystems standing-spin-wave replication is not baked |
| C20, C21 2D patches; C22 continuum cross-check | none | not started |
| C23 bandwidth-constrained CRAB; C24 constrained GRAPE; C25 field plus SOT | solvers in the engine | not baked |
| C26 screening and the amortized policy | the policy in the engine | not baked |

Cross-material results (the reliability front for CrSBr, the two-mode lattice comparison, the free chain
map) are shown only on the Experiments page, never in the single-case workbench.

Regenerate the per-case pages after any registry or material change: `python scripts/gen_case_docs.py`.

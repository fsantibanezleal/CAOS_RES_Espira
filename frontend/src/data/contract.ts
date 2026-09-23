// The web contract: TypeScript types mirroring the baked artifact schema (espiralab.bake).
// A drift between this and the Python schema fails `tsc`, per ADR-0057's two-contract rule.

// Kept equal to espiralab.bake.ARTIFACT_SCHEMA_VERSION by a test; the loader refuses an artifact
// built under a different major version rather than reading fields that may have moved.
export const ARTIFACT_SCHEMA_VERSION = '2.1.0';

export interface MaterialInfo {
  slug: string;
  name: string;
  family: string;
  spin: number;
  moment_bohr: number;
  anisotropy_mev: number;
  hard_axis_ratio: number;
  damping: number;
  damping_low: number;
  damping_high: number;
  curie_kelvin: number;
  easy_axis: string;
  notes: string;
  sources: string[];
  /** Contract 1 record per parameter (moment, anisotropy, hard_axis_ratio, damping, ordering_temperature). */
  provenance: Record<string, ParameterProvenance>;
  flags: string[];
}

export interface ParameterProvenance {
  value: number;
  low: number | null;
  high: number | null;
  provenance: 'measured' | 'computed' | 'derived' | 'assumed';
  method: string;
  sources: string[];
  note: string;
  input: { value: number; unit: string; basis: string };
  flags: string[];
}

export interface VariantAxis {
  name: string;
  label: string;
  unit: string;
  values: number[];
}

export interface CostRow {
  /** The value of the case's variant family at this row (a switching time, a hard-axis ratio, ...). */
  variant: number;
  /** Null when the method did not reverse the moment at this variant. */
  switched?: boolean;
  switching_time_tau0: number;
  switching_time_s: number;
  /** The field cost in T^2 s. Absent on a case whose observable is not a field cost (see Observable). */
  cost?: number | null;
  cost_low_damping?: number;
  cost_high_damping?: number;
  /** Absent on a case that is not a single-moment reversal (a chain barrier). */
  cost_free?: number;
  cost_floor?: number;
  cost_over_floor?: number | null;
  cost_over_free?: number;
  mean_amplitude?: number;
  /** On a case that does not report a field cost: the closed-form field cost of the same reversal, for
   * scale only, with the note that says so. Never plotted as the case's own quantity. */
  field_cost_reference?: number;
  field_cost_note?: string;
  /** The case's declared observable value, under its own key, plus one block per method rung. */
  [key: string]: unknown;
}

/** What a case actually measures. Most report the field cost; the spin-orbit-torque oracle reports a
 * current in reduced units and the thermal case a success rate, and neither is a field cost. */
export interface Observable {
  key: string;
  label: string;
  unit: string;
  is_field_cost: boolean;
  note: string;
}

/** The constants a live-lane case needs to recompute itself in the browser, in SI. */
export interface LiveInputs {
  method: string;
  alpha: number;
  gamma: number;
  anisotropy_j: number;
  mu: number;
  tau0_s: number;
  xi: number;
  beta: number;
  note: string;
}

/** One method's row inside a cost row, on a case whose observable is not the field cost. */
export interface MethodBlock {
  cost: number | null;
  switched: boolean;
  reason: string;
  [metric: string]: number | boolean | string | null;
}

export interface ReferencePulse {
  switching_time_tau0: number;
  switching_time_s: number;
  time_s: number[];
  sx: number[];
  sy: number[];
  sz: number[];
  field_amplitude_t: number[];
  field_x_t: number[];
  field_y_t: number[];
  field_z_t: number[];
  /** What the signal arrays carry when it is not an applied field in tesla (a current in j0). */
  signal_label?: string;
  signal_unit?: string;
  /** The factor from the stored values to the displayed unit; absent means tesla shown in mT. */
  signal_scale?: number;
  /** Names of the amplitude and first component series, when they are not |b| and b_x; a case with
   * only these two series (an energy and its continuum reference) sets them. */
  signal_series?: string[];
  /** The x axis when it is not time in seconds shown in ps (a path coordinate, for a barrier). */
  x_label?: string;
  x_unit?: string;
  x_scale?: number;
}

export interface StaticBaseline {
  switching_time_tau0: number;
  static_cost: number;
  static_switched: boolean;
  optimal_cost: number;
  reduction_factor: number | null;
}

export interface BiaxialReduction {
  switching_time_tau0: number;
  hard_axis_ratio: number;
  uniaxial_cost: number;
  biaxial_cost: number;
  cost_free: number;
  biaxial_over_free: number;
  reduction_vs_uniaxial: number | null;
  converged: boolean;
}

export interface CaseInfo {
  slug: string;
  title: string;
  category: string;
  material: string;
  reason: string;
  expectation: string;
  includes_biaxial: boolean;
  code: string;
  kill_criterion: string;
  ground_truth: string;
  split: string;
  status: string;
  surface: string;
  methods: string[];
  sources: string[];
}

export interface CaseArtifact {
  schema_version: string;
  case: CaseInfo;
  material: MaterialInfo;
  axis: VariantAxis;
  observable: Observable;
  /** What the drawn trajectory is, when it is not literally the control the case measures. */
  pulse_note: string;
  /** Present only on a case the lane gate put in the live lane. */
  live_inputs: LiveInputs | null;
  cost_curve: CostRow[];
  pulses: ReferencePulse[];
  reference_pulse: ReferencePulse;
  static_baseline: StaticBaseline;
  biaxial_reduction?: BiaxialReduction;
}

export interface RegistryRow {
  slug: string;
  code: string;
  title: string;
  category: string;
  status: 'baked' | 'planned' | 'blocked';
  surface: string;
  blocked_reason: string;
  split: string;
  ground_truth: string;
  variants: number;
  axis: string;
  methods: string[];
}

export interface IndexEntry {
  slug: string;
  code: string;
  title: string;
  category: string;
  material: string | null;
  material_name: string;
  includes_biaxial: boolean;
  axis: string;
}

export interface ArtifactIndex {
  schema_version: string;
  cases: IndexEntry[];
  categories: Record<string, string[]>;
  /** How many of the declared cases are baked, planned and blocked. */
  coverage: Record<string, number>;
  /** Every declared case, baked or not, so the coverage matrix cannot hide a missing one. */
  registry: RegistryRow[];
}

export interface ReliabilityPoint {
  br_over_anisotropy: number;
  added_cost: number;
  success_rate: number;
  confidence95: number;
  hyperbolic_fraction: number;
}

export interface LatticeRow {
  n_sites: number;
  uniform_cost: number;
  domain_wall_cost: number;
  ratio: number;
  cheaper_mode: string;
}

export interface NovelResults {
  schema_version: string;
  reliability_front: {
    material: string;
    thermal_stability_factor: number;
    points: ReliabilityPoint[];
  };
  lattice_crossover: {
    material: string;
    exchange_over_anisotropy: number;
    rows: LatticeRow[];
  };
  notes: { reliability: string; lattice: string };
}

// ---- the free chain optimal control crossover map (data/artifacts/lattice_ocp.json) ----

export interface LatticeStart {
  ratio: number;
  nonuniformity: number;
  converged: boolean;
  iterations: number;
}

export interface LatticeOCPCase {
  key: string;
  exchange_over_k: number;
  alpha: number;
  switching_tau0: number;
  n_sites: number;
  n_images: number;
  uniform_bound_t2s: number;
  barrier_over_nk: number;
  floor_ratio: number;
  best_start: 'uniform' | 'wall' | 'mep';
  best_ratio: number;
  best_nonuniformity: number;
  saving: number;
  starts: Record<'uniform' | 'wall' | 'mep', LatticeStart>;
  sz_map: { times_over_t: number[]; sz: number[][] };
}

export interface LatticeOCPArtifact {
  schema: string;
  description: string;
  reference: { mu_bohr: number; anisotropy_mev: number };
  cases: LatticeOCPCase[];
}

// ---- the two-dimensional patch sweep (data/artifacts/patch_ocp.json), cases C20 and C21 ----

export interface PatchOCPCase {
  key: string;
  exchange_over_k: number;
  wall_width_sites: number;
  alpha: number;
  switching_tau0: number;
  width: number;
  n_sites: number;
  n_images: number;
  uniform_bound_t2s: number;
  /** Null with floor_ratio when the minimum energy path did not converge: then it bounds nothing. */
  barrier_over_nk: number | null;
  barrier_converged: boolean;
  floor_ratio: number | null;
  best_start: 'uniform' | 'wall' | 'mep';
  best_ratio: number;
  best_nonuniformity: number;
  saving: number;
  starts: Record<'uniform' | 'wall' | 'mep', LatticeStart>;
  /** s_z averaged along y, one column per x, because the wall travels along x. */
  sz_map: { times_over_t: number[]; sz_by_column: number[][] };
}

export interface PatchOCPArtifact {
  schema: string;
  description: string;
  reference: { mu_bohr: number; anisotropy_mev: number };
  cases: PatchOCPCase[];
}

// ---- the live-lane parity fixture (data/artifacts/live_parity.json) ----

export interface ParityEllipticRow {
  /** The modulus in the PARAMETER convention, m = k^2. */
  m: number;
  k: number;
}

export interface ParityProtocolRow {
  switching_time_tau0: number;
  switching_time_s: number;
  mean_current_reduced: number;
  cost_fast_reduced: number;
  characteristic_time_s: number;
}

export interface LiveParityFixture {
  schema: string;
  case: string;
  code: string;
  description: string;
  inputs: { alpha: number; gamma: number; anisotropy_j: number; mu: number; tau0_s: number; xi: number; beta: number };
  /** The relative agreement demanded of each group, from the offline lane. */
  tolerances: { elliptic_k: number; protocol: number };
  elliptic_k: ParityEllipticRow[];
  protocol: ParityProtocolRow[];
}

// ---- the device trade-off front (data/artifacts/pareto.json), rung R14 ----

export interface ParetoPoint {
  switching_time_tau0: number;
  switching_time_s: number;
  cost: number;
  peak_field_t: number;
  bandwidth_hz: number;
  /** True when another protocol beats this one on every objective, the switching time included. With
   * every point at a different time that can never happen, which is why the question is also asked
   * with the deadline set aside. */
  dominated: boolean;
  /** True when another protocol costs no more, needs no higher a peak field and no wider a band. */
  dominated_without_time: boolean;
}

export interface ParetoExponent {
  /** The fitted log-log slope against the switching time. */
  slope: number;
  /** The largest residual of that fit, in log units: a large one means it is not a power law. */
  max_log_residual: number;
}

export interface ParetoMaterial {
  material: string;
  name: string;
  damping: number;
  damping_provenance: string;
  tau0_s: number;
  points: ParetoPoint[];
  front_size: number;
  /** How many protocols survive once the deadline is fixed and only the supply objectives are ranked. */
  supply_front_size: number;
  /** Pairs where the slower protocol needs the wider band, and the worst of them. */
  bandwidth_inversions: {
    count: number;
    worst: { faster_tau0: number; slower_tau0: number; faster_hz: number; slower_hz: number; ratio: number } | null;
  };
  exponents: Record<'cost' | 'peak_field_t' | 'bandwidth_hz', ParetoExponent>;
}

export interface ParetoArtifact {
  schema: string;
  description: string;
  objectives: { key: string; label: string; unit: string }[];
  materials: ParetoMaterial[];
}

// ---- where a hard axis pays (data/artifacts/hard_axis_map.json), backlog BL-035 ----

export interface HardAxisPoint {
  key: string;
  ratio: number;
  damping: number;
  switching_tau0: number;
  uniaxial_cost: number;
  biaxial_cost: number;
  /** Uniaxial closed form over the numerical biaxial cost: above one the hard axis paid for itself. */
  reduction: number | null;
  /** The same, divided by the control at this damping and switching time. */
  reduction_vs_control: number | null;
  /** The control itself: the solver reproducing the closed form it already knows, at ratio zero. */
  control: number | null;
  converged: boolean;
  /** The uniaxial optimum is its own infinite-time floor here, so the comparison stops existing. */
  at_floor: boolean;
  /** The control holds and the solve converged, so the cell is evidence of something. */
  reliable: boolean;
  helped: boolean;
}

export interface HardAxisMapArtifact {
  schema: string;
  description: string;
  axes: { ratio: number[]; damping: number[]; switching_tau0: number[] };
  summary: {
    points: number;
    reliable: number;
    helped: number;
    unconverged: number;
    at_floor: number;
    control_tolerance: number;
    worst_control: number;
    best: { key: string; ratio: number; damping: number; switching_tau0: number; reduction: number; reduction_vs_control: number };
  };
  points: HardAxisPoint[];
}

// ---- does the instability penalty predict the ensemble? (data/artifacts/penalty_test.json), BL-020 ----

export interface PenaltyCell {
  br_over_anisotropy: number;
  stability_factor: number;
  /** The deterministic hyperbolicity integral, in units of the infinite-time cost floor. */
  penalty_over_floor: number;
  /** The fraction of the path the linearized analysis calls unstable at this field. */
  hyperbolic_fraction: number;
  added_cost_over_floor: number;
  success_rate: number;
  confidence95: number;
  failure_rate: number;
}

export interface PenaltyRow {
  stability_factor: number;
  /** Rank correlation between the penalty and the measured failure rate along the field sweep. */
  spearman_penalty_failure: number;
  /** The same for the hyperbolic fraction, the other deterministic predictor in the module. */
  spearman_fraction_failure: number;
  /** Whether the measured failure rate falls at every step of the field sweep. */
  failure_monotone_in_field: boolean;
  failure_at_zero_field: number;
  failure_at_full_field: number;
  /** True when the two ends differ by more than both confidence intervals, so the row can decide. */
  separated: boolean;
  gap: number;
}

export interface PenaltyTestArtifact {
  schema: string;
  material: string;
  switching_time_tau0: number;
  copies: number;
  description: string;
  axes: { br_over_anisotropy: number[]; stability_factor: number[] };
  cells: PenaltyCell[];
  per_stability: PenaltyRow[];
  verdict: {
    testable_rows: number;
    rows_agreeing: number;
    rows: number;
    /** How many rows each deterministic predictor ranks correctly end to end. */
    rows_ranked_by_penalty: number;
    rows_ranked_by_fraction: number;
    rows_failing_monotonically: number;
  };
}

// ---- exploitability descriptors per material (data/artifacts/descriptors.json), backlog BL-026 ----

export interface DescriptorReferenceTime {
  switching_time_tau0: number;
  switching_time_s: number;
  cost: number;
  cost_over_floor: number | null;
  cost_over_free: number | null;
  /** Null where the optimum is already its infinite-time floor, so there is no pulse to measure. */
  peak_field_t: number | null;
  bandwidth_hz: number | null;
  at_floor: boolean;
}

export interface DescriptorRetention {
  stability_factor: number;
  /** Sites needed if the element reversed coherently; the optimistic end, see retention_note. */
  sites_needed_coherent: number;
}

export interface MaterialDescriptors {
  material: string;
  name: string;
  family: string;
  easy_axis: string;
  moment_bohr: number;
  anisotropy_mev: number;
  damping: number;
  hard_axis_ratio: number;
  curie_kelvin: number;
  above_room_temperature: boolean;
  tau0_s: number;
  cost_floor: number;
  anisotropy_field_t: number;
  /** The single-site anisotropy in temperature units, which is why retention needs many sites. */
  single_site_kelvin: number;
  reference_times: DescriptorReferenceTime[];
  retention: DescriptorRetention[];
  /** The thermal front at this material's damping: what the stabilizing field buys and charges. */
  reliability: {
    stability_factor: number;
    switching_time_tau0: number;
    br_over_anisotropy: number;
    copies: number;
    temperature_k: number;
    bare_success: number;
    bare_confidence95: number;
    stabilised_success: number;
    stabilised_confidence95: number;
    hyperbolic_fraction_bare: number;
    added_cost: number;
    added_cost_over_optimal: number | null;
  };
  hard_axis: {
    available: boolean;
    map_damping?: number;
    damping_decades_away?: number;
    helped_cells?: number;
    best_reduction?: number;
    best_ratio?: number | null;
    pays_up_to_tau0?: number;
  };
  provenance: Record<string, string>;
  flags: string[];
}

export interface DescriptorArtifact {
  schema: string;
  description: string;
  room_temperature_k: number;
  retention_note: string;
  reliability_note: string;
  reference_times_tau0: number[];
  retention_factors: number[];
  materials: MaterialDescriptors[];
}

// ---- the external cross-check (data/artifacts/external_crosscheck.json), backlog BL-013 ----

export interface CrosscheckRow {
  /** 'chain' (a line of sites) or 'patch' (the square element of cases C20 and C21). */
  geometry: 'chain' | 'patch';
  width: number;
  height: number;
  n_sites: number;
  exchange_over_k: number;
  images: number;
  spinoct_barrier_over_k: number;
  spinoct_converged: boolean;
  spirit_barrier_over_k: number;
  spirit_saddle_image: number;
  /** The barrier over the coherent-rotation saddle N K: below one, the reversal is a wall. */
  barrier_over_nk: number;
  relative_difference: number;
}

// ---- the external DYNAMICS cross-check (data/artifacts/external_dynamics_crosscheck.json) ----
// The statics cross-check above compares a barrier; this one compares a trajectory, against VAMPIRE,
// which is GPL-2 and therefore run as a separate process and never linked.

export interface DynamicsRow {
  name: string;
  alpha: number;
  start: number[];
  applied_field_t: number[];
  samples: number;
  duration_s: number;
  worst_deviation: number;
  worst_at_s: number;
  final_ours: number[];
  final_theirs: number[];
  /** When the moment crossed the equator, s. Null on a row that is not a reversal. */
  reversal_time_ours_s: number | null;
  reversal_time_theirs_s: number | null;
  reversal_time_difference: number | null;
}

export interface ExternalDynamicsCrosscheck {
  schema: string;
  description: string;
  engines: Record<string, string>;
  gyromagnetic_ratio_rad_per_s_t: number;
  gyromagnetic_note: string;
  moment_bohr: number;
  anisotropy_j: number;
  time_step_s: number;
  tolerance: number;
  measured_on: string;
  worst_deviation: number;
  agrees: boolean;
  rows: DynamicsRow[];
}

export interface ExternalCrosscheck {
  schema: string;
  description: string;
  engines: Record<string, string>;
  anisotropy_mev: number;
  moment_bohr: number;
  tolerance: number;
  measured_on: string;
  worst_relative_difference: number;
  agrees: boolean;
  rows: CrosscheckRow[];
}

// ---- the benchmark (data/artifacts/benchmark.json) and the Contract 2 manifests ----

export interface MethodScore {
  method: string;
  cells: number;
  produced: number;
  not_applicable: number;
  switched: number;
  best_cost: number | null;
  worst_ratio_to_oracle: number | null;
  notes: string;
}

export interface CaseScore {
  case: string;
  methods: MethodScore[];
  complete: boolean;
}

export interface ManifestSummary {
  case: string;
  code: string;
  manifest: string;
  sha256: string;
  lane: string;
  completeness: { expected: number; produced: number; not_applicable: number; missing: number };
}

export interface Benchmark {
  schema: string;
  engine: { name: string; version: string };
  cases: CaseScore[];
  manifests: ManifestSummary[];
  complete: boolean;
}

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

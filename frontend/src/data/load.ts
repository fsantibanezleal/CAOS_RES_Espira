// Loading the committed artifacts. Cache-busted with the app version because index.html is
// CDN-cached on GitHub Pages (reference_github_pages_spa_stale_cache).

import { ARTIFACT_SCHEMA_VERSION } from './contract';
import type { ArtifactIndex, CaseArtifact } from './contract';
import { APP_VERSION } from '../version';

const base = import.meta.env.BASE_URL;

function bust(path: string): string {
  return `${path}?v=${APP_VERSION}`;
}

export async function loadIndex(): Promise<ArtifactIndex> {
  const response = await fetch(bust(`${base}artifacts/index.json`));
  if (!response.ok) throw new Error(`index.json ${response.status}`);
  return response.json();
}

/** The major version of a schema string: an added field is compatible, a moved one is not. */
function major(version: string): string {
  return version.split('.')[0];
}

export async function loadCase(slug: string): Promise<CaseArtifact> {
  const response = await fetch(bust(`${base}artifacts/${slug}.json`));
  if (!response.ok) throw new Error(`${slug}.json ${response.status}`);
  const artifact: CaseArtifact = await response.json();
  if (major(artifact.schema_version) !== major(ARTIFACT_SCHEMA_VERSION)) {
    throw new Error(
      `${slug}.json is schema ${artifact.schema_version}, the app reads ${ARTIFACT_SCHEMA_VERSION}`,
    );
  }
  return artifact;
}

export async function loadNovel(): Promise<import('./contract').NovelResults> {
  const response = await fetch(bust(`${base}artifacts/novel.json`));
  if (!response.ok) throw new Error(`novel.json ${response.status}`);
  return response.json();
}

export async function loadLatticeOCP(): Promise<import('./contract').LatticeOCPArtifact> {
  const response = await fetch(bust(`${base}artifacts/lattice_ocp.json`));
  if (!response.ok) throw new Error(`lattice_ocp.json ${response.status}`);
  return response.json();
}

export async function loadBenchmark(): Promise<import('./contract').Benchmark> {
  const response = await fetch(bust(`${base}artifacts/benchmark.json`));
  if (!response.ok) throw new Error(`benchmark.json ${response.status}`);
  return response.json();
}

export async function loadPatchOCP(): Promise<import('./contract').PatchOCPArtifact> {
  const response = await fetch(bust(`${base}artifacts/patch_ocp.json`));
  if (!response.ok) throw new Error(`patch_ocp.json ${response.status}`);
  return response.json();
}

export async function loadLiveParity(): Promise<import('./contract').LiveParityFixture> {
  const response = await fetch(bust(`${base}artifacts/live_parity.json`));
  if (!response.ok) throw new Error(`live_parity.json ${response.status}`);
  return response.json();
}

export async function loadPareto(): Promise<import('./contract').ParetoArtifact> {
  const response = await fetch(bust(`${base}artifacts/pareto.json`));
  if (!response.ok) throw new Error(`pareto.json ${response.status}`);
  return response.json();
}

export async function loadHardAxisMap(): Promise<import('./contract').HardAxisMapArtifact> {
  const response = await fetch(bust(`${base}artifacts/hard_axis_map.json`));
  if (!response.ok) throw new Error(`hard_axis_map.json ${response.status}`);
  return response.json();
}

export async function loadPenaltyTest(): Promise<import('./contract').PenaltyTestArtifact> {
  const response = await fetch(bust(`${base}artifacts/penalty_test.json`));
  if (!response.ok) throw new Error(`penalty_test.json ${response.status}`);
  return response.json();
}

export async function loadDescriptors(): Promise<import('./contract').DescriptorArtifact> {
  const response = await fetch(bust(`${base}artifacts/descriptors.json`));
  if (!response.ok) throw new Error(`descriptors.json ${response.status}`);
  return response.json();
}

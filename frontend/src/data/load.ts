// Loading the committed artifacts. Cache-busted with the app version because index.html is
// CDN-cached on GitHub Pages (reference_github_pages_spa_stale_cache).

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

export async function loadCase(slug: string): Promise<CaseArtifact> {
  const response = await fetch(bust(`${base}artifacts/${slug}.json`));
  if (!response.ok) throw new Error(`${slug}.json ${response.status}`);
  return response.json();
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

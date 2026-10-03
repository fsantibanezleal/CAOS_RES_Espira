// A negative control is a case whose material breaks the model's own assumption: the macrospin model is a
// single ferromagnetic moment, and on an antiferromagnet its numbers are what the machinery returns when
// that assumption fails, not a prediction. The rule is keyed to the material's magnetic order, as the
// Workbench banner is, so any antiferromagnet added later is marked everywhere without a code change.
// C18 (FePS3) declares that its numbers must never appear without this warning; the Benchmark used to put
// its 360x reduction beside the real materials with nothing to say so.

import type { CaseArtifact } from './contract';

export function isNegativeControl(artifact: CaseArtifact): boolean {
  return /antiferromagnet/i.test(artifact.material?.family ?? '');
}

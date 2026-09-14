# manifests/

Per-case result manifests (Contract 2): the case, its variants, the methods run, the engine version, the
seeds, each artifact's byte size and sha256, the measured lane verdict, and the method x case x variant
completeness counts.

**Not produced yet.** Today the artifacts in `data/artifacts/` carry a schema version and the web mirrors
their shapes in TypeScript, but there are no manifests or hashes. They arrive with the `export` and
`validate` stages (unit U4 of the rebuild).

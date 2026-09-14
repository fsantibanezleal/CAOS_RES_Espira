# app/, the dormant FastAPI backend

**This solution does not require a request-time backend at the moment.** Espira is a static,
deterministic-replay product: GitHub Pages serves the web app, and the app reads the committed
artifacts in `data/artifacts/` directly. Every number it shows was computed offline by the bake.

The module exists because the ADR-0057 layout is uniform across products. It compiles, it is
documented, and nothing runs it. Activate it only on an ADR-0002 trigger: server-side processing of
uploaded material parameters, auth-gated private data, or paid request-time compute. A plausible future
trigger for Espira is letting a user submit a new material and receive its optimal pulse, which would
need the `spinoct` solvers at request time.

To activate: pin `requirements-api.txt`, install it into `.venv`, and run `uvicorn app.main:app`. The
endpoints serve the same committed artifacts read-only (`DATA_DIR`, default `data/artifacts`); they are
a thin layer over `data/`, never a re-implementation of the engine.

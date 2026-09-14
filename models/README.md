# models/

Trained model artifacts and the model registry.

Espira's only learned method is R15, the amortized policy: a small multilayer perceptron in the
`spinoct` engine (`spinoct.amortized`) that maps the damping and the log switching time to the shape
parameter of the optimal pulse. It is trained in the engine's test suite and validated there against the
analytic optimum on held-out parameters, but **the product does not yet train, checkpoint or register it**.
That arrives with the staged pipeline (`train` stage, unit U4 of the rebuild), trained on the training
materials only and scored on the held-out materials, with the checkpoint (a JSON of weights and
normalization, a few kilobytes) committed here and listed in a registry with version, source, license,
lane and status.

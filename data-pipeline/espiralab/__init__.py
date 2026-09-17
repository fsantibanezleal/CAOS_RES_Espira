"""espiralab: the offline data pipeline for the Espira product.

Curates the van der Waals magnet parameter database, declares the case matrix, and bakes the canonical
artifacts by driving the `spinoct` engine. The web app replays the committed artifacts and never
recomputes them.
"""

from __future__ import annotations

__version__ = "0.03.000"

// Printing a variant's value with its unit.
//
// The case registry gives every variant axis a `unit`, and for most axes it is one: tau0, ps, sites,
// K/kT. For four it is not. The damping `alpha`, the hard-axis ratio `xi`, a harmonic `count` and a
// search-seed `index` are dimensionless, and the registry names the quantity in the unit's place. That
// reads correctly as an axis annotation, "Harmonics (count)", and wrongly after a value, "4 count" or
// "Damping = 0.1 alpha", which is how the workbench's variant bar and the Materials table printed them.

import { tr } from '../content/dataText';

/** The registry's axis units that name a dimensionless quantity rather than a unit. A test in
 * `tests/test_docs.py` holds every unit the registry declares to be either in this set or a real unit,
 * so a new placeholder cannot slip in and print as "3 flag". */
export const DIMENSIONLESS_AXIS_UNITS = new Set(['alpha', 'xi', 'count', 'index']);

/** A variant's value with its unit, or the bare value when the axis is dimensionless. The unit is data
 * (English in the artifact), so on the Spanish page it is printed through the translation table:
 * "4 sites" became "4 sitios" in 0.16.000. */
export function withUnit(value: number | string, unit: string, es = false): string {
  return !unit || DIMENSIONLESS_AXIS_UNITS.has(unit) ? String(value) : `${value} ${tr(unit, es)}`;
}

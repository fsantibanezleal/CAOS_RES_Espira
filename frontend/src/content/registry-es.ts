// Spanish for the case registry's own labels where the interface uses them as chrome.
//
// The registry is English, as every technical artifact here is. Two of its fields are not prose but
// structure: the six case categories head the coverage matrix and group the case selector, and the
// variant-axis labels name controls and chart axes. On the Spanish page those printed in English,
// "A. Exact oracles" over a Spanish table, because nothing translated them. They are a closed set, so
// they are translated here, and a test in `tests/test_docs.py` holds both tables complete against the
// registry: a category or an axis added later cannot reach the page untranslated.
//
// Case titles, reasons, expectations, kill criteria and every other data string the pages render are
// translated separately, in data-es.json through dataText.tsx, keyed by their exact English text, with
// tests/test_translations.py holding that file to the artifacts. Until 0.16.000 they stayed in English
// on the Spanish page under a note that said so.

export const CATEGORY_ES: Record<string, string> = {
  'A. Exact oracles': 'A. Oráculos exactos',
  'B. Published replication': 'B. Replicación de lo publicado',
  'C. Real materials': 'C. Materiales reales',
  'D. Beyond the macrospin': 'D. Más allá del macrospin',
  'E. Constrained and hybrid control': 'E. Control con restricciones e híbrido',
  'F. Screening and learned': 'F. Cribado y aprendizaje',
};

export const AXIS_LABEL_ES: Record<string, string> = {
  'Switching time': 'Tiempo de conmutación',
  'Barrier over thermal energy': 'Barrera sobre energía térmica',
  'Thermal stability factor': 'Factor de estabilidad térmica',
  'Longitudinal field': 'Campo longitudinal',
  'Current price': 'Precio de la corriente',
  'Amplitude cap': 'Tope de amplitud',
  Damping: 'Amortiguamiento',
  Harmonics: 'Armónicos',
  'Search seed': 'Semilla de búsqueda',
  'Current amplitude': 'Amplitud de la corriente',
  'Chain length': 'Largo de la cadena',
  'Patch side': 'Lado del parche',
  'Sites per wall width': 'Sitios por ancho de pared',
  'Hard-axis ratio': 'Razón de eje duro',
};

export function translateCategory(category: string, es: boolean): string {
  return es ? (CATEGORY_ES[category] ?? category) : category;
}

export function translateAxisLabel(label: string, es: boolean): string {
  return es ? (AXIS_LABEL_ES[label] ?? label) : label;
}

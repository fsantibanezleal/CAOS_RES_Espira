// Text that comes from the data, rendered in the reader's language.
//
// The case registry, the materials database and the bake write their prose in English, like every
// technical artifact of this product: case titles, reasons, expectations, kill criteria, notes and
// descriptions. The interface is bilingual, and until 0.16.000 the Spanish page showed all of it in
// English, about 31,000 characters, marked lang="en" and explained away by a note. data-es.json now
// carries a Spanish version of every such string, keyed by its exact English text, and
// tests/test_translations.py holds the file to every string the committed artifacts carry, with the
// numbers of each translation equal to the numbers of its source. A string that changes in the data
// therefore fails that test until its translation is updated, instead of silently falling back.
//
// The fallback still exists for a string the test has not seen: it shows the English and marks it
// lang="en" (the HTML language of parts), so a screen reader switches voice and the breadth gate,
// which allows no lang="en" on a Spanish page, reports it.

import { useShellLang } from '@fasl-work/caos-app-shell';
import DATA_ES from './data-es.json';

const ES: Record<string, string> = DATA_ES;

/** The string in the page's language, and whether it fell back to English. */
export function dataText(text: string, es: boolean): { text: string; lang?: 'en' } {
  if (!es) return { text };
  const translated = ES[text];
  return translated ? { text: translated } : { text, lang: 'en' };
}

/** A plain string in the page's language, for places that take a string (labels, chip names). */
export function tr(text: string, es: boolean): string {
  return dataText(text, es).text;
}

interface Props {
  text: string | null | undefined;
  as?: 'span' | 'p' | 'div' | 'td';
  className?: string;
}

/** A data string as an element, in the page's language, marked lang="en" only when it fell back. */
export function DataText({ text, as: Tag = 'span', className }: Props): React.JSX.Element | null {
  const lang = useShellLang();
  if (!text) return null;
  const shown = dataText(text, lang === 'es');
  return (
    <Tag className={className} lang={shown.lang}>
      {shown.text}
    </Tag>
  );
}

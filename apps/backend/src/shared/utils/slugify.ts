const CYRILLIC = 'абвгдеёзийклмнопрстуфхцчшщъыьэюя';
const LATIN = [
  'a',
  'b',
  'v',
  'g',
  'd',
  'e',
  'yo',
  'z',
  'i',
  'y',
  'k',
  'l',
  'm',
  'n',
  'o',
  'p',
  'r',
  's',
  't',
  'u',
  'f',
  'h',
  'ts',
  'ch',
  'sh',
  'sch',
  '',
  'y',
  '',
  'e',
  'yu',
  'ya',
];
const SLUG_MAX_LENGTH = 100;
const COMBINING_DIACRITICS_RANGE_START = 0x0300;
const COMBINING_DIACRITICS_RANGE_END = 0x036f;
const HEX_ESCAPE_LENGTH = 4;
const combiningDiacriticsPattern = new RegExp(
  `[\\u${COMBINING_DIACRITICS_RANGE_START.toString(16).padStart(HEX_ESCAPE_LENGTH, '0')}` +
    `-\\u${COMBINING_DIACRITICS_RANGE_END.toString(16).padStart(HEX_ESCAPE_LENGTH, '0')}]`,
  'g',
);

/**
 * Транслитерирует кириллицу и превращает строку в URL-safe slug.
 * @param {string} value - Произвольный заголовок (например, название задачи).
 * @returns {string} Строка из латиницы, цифр и дефисов, не длиннее SLUG_MAX_LENGTH.
 */
export function slugify(value: string): string {
  const transliterated = [...value.toLowerCase()]
    .map((character) => {
      const index = CYRILLIC.indexOf(character);
      return index >= 0 ? LATIN[index] : character;
    })
    .join('');

  return transliterated
    .normalize('NFKD')
    .replace(combiningDiacriticsPattern, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SLUG_MAX_LENGTH);
}

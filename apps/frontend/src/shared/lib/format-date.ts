/**
 * Форматирует ISO-дату в длинную календарную дату с учётом локали (например, "20 августа 2026 г.").
 * @param {string} isoDate - дата в формате, который понимает `Date`, обычно ISO-строка.
 * @param {string} locale - тег локали BCP 47, под которую форматировать.
 * @returns {string} Отформатированная дата.
 */
export function formatDate(isoDate: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" }).format(new Date(isoDate));
}

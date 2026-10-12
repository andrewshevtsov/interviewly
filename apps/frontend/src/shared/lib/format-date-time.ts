/**
 * Форматирует ISO-дату в короткую дату и время в часовом поясе браузера, ("20 августа, 15:00").
 * @param {string} isoDate - дата в формате, который понимает `Date`, обычно ISO-строка.
 * @param {string} locale - тег локали BCP 47, под которую форматировать.
 * @returns {string} Отформатированные дата и время.
 */
export function formatDateTime(isoDate: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoDate));
}

/**
 * Форматирует ISO-дату цифрами: день, месяц, год и время ("14.10.2026, 13:26") в часовом поясе браузера.
 * @param {string} isoDate - дата в формате, который понимает `Date`, обычно ISO-строка.
 * @param {string} locale - тег локали BCP 47; английский пишется день-месяц-год, как русский.
 * @returns {string} Отформатированные дата и время.
 */
export function formatDateTimeNumeric(isoDate: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(isoDate));
}

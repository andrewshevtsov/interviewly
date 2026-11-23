// Поиск ссылок в пользовательском тексте: защита от фишинга в полях, чате и уведомлениях.

const EXPLICIT = String.raw`(?:[a-z][a-z0-9+.-]*:\/\/|www\.)[^\s<>]+`;
const LABEL = String.raw`[a-z0-9а-яё](?:[a-z0-9а-яё-]*[a-z0-9а-яё])?`;
const CYRILLIC_ZONES = 'рф|рус|бел|укр|москва|онлайн|сайт|дети|орг|ком';
// Зона только латиницей или из списка: иначе «время.Давайте» без пробела после точки считалось бы доменом
const BARE = String.raw`(?<![\p{L}\p{N}_-])(?:${LABEL}\.)+(?:[a-z]{2,24}|${CYRILLIC_ZONES})(?![\p{L}\p{N}_-])(?:[/?#][^\s<>]*)?`;

const linkPattern = () => new RegExp(`${EXPLICIT}|${BARE}`, 'giu');
const EXPLICIT_START = /^(?:[a-z][a-z0-9+.-]*:\/\/|www\.)/i;
const SCHEME_START = /^[a-z][a-z0-9+.-]*:\/\//i;
const TRAILING_PUNCTUATION = /[.,;:!?)\]}'"»]+$/;

// Домен без схемы считаем ссылкой только в распространённой зоне: `Node.js` и `index.ts` - не ссылки
const COMMON_ZONES = new Set(
  `com net org ru su io me co cc ly gg to tk xyz top site online info biz app dev link click shop store pro live club
   page by kz ua uk de us eu ai tv ws ${CYRILLIC_ZONES.replaceAll('|', ' ')}`.split(
    /\s+/,
  ),
);

// Названия технологий, совпадающие с настоящими доменами
const TECH_NAMES = new Set([
  'asp.net',
  'ado.net',
  'vb.net',
  'ml.net',
  'socket.io',
]);

/**
 * Хост ссылки так, как его откроет браузер: `https://site.com@evil.com/` ведёт на `evil.com`.
 * @param {string} link - Найденная в тексте ссылка, со схемой или без.
 * @returns {string} Хост в нижнем регистре; если ссылку не разобрать - она сама.
 */
function toHost(link: string): string {
  try {
    return (
      new URL(SCHEME_START.test(link) ? link : `http://${link}`).hostname ||
      link.toLowerCase()
    );
  } catch {
    return link.toLowerCase();
  }
}

function isLikelyLink(link: string): boolean {
  if (EXPLICIT_START.test(link)) {
    return true;
  }

  const domain = link.replace(/[/?#].*$/, '').toLowerCase();
  const zone = domain.slice(domain.lastIndexOf('.') + 1);

  return COMMON_ZONES.has(zone) && !TECH_NAMES.has(domain);
}

/**
 * Находит в тексте ссылки: со схемой, с `www.` и домены в распространённых зонах.
 * Эвристика: запись вида `evil[.]com` или домен в редкой зоне она не увидит.
 * @param {string} text - Пользовательский текст.
 * @returns {string[]} Хосты найденных ссылок без повторов, в порядке появления.
 */
export function findLinks(text: string): string[] {
  const links = Array.from(text.matchAll(linkPattern()), (match) => match[0].replace(TRAILING_PUNCTUATION, ''));

  return [...new Set(links.filter(isLikelyLink).map(toHost))];
}

/**
 * Делает ссылки и упоминания некликабельными для Telegram и почтовых клиентов: `evil.com` → `evil[.]com`.
 * В отличие от {@link findLinks}, срабатывает на любой домен: лишняя скобка в `Node[.]js` безопаснее
 * пропущенной ссылки в редкой зоне.
 * @param {string} text - Пользовательский текст, который уходит в уведомление.
 * @returns {string} Текст, в котором клиент не найдёт ни ссылки, ни `@упоминания`.
 */
export function defangLinks(text: string): string {
  return text
    .replace(linkPattern(), (link) =>
      link.replaceAll('://', '[://]').replaceAll('.', '[.]'),
    )
    .replace(/@(?=[\p{L}\p{N}_])/gu, '@ ');
}

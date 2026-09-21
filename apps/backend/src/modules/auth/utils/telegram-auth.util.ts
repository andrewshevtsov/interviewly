import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Поля, которые Telegram Login Widget подписывает своим `hash`. Совпадает по
 * форме с `TelegramAuthDto`, но объявлен отдельно, чтобы эта проверка не
 * зависела от decorators/Swagger-метаданных DTO.
 */
export interface TelegramWidgetPayload {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

/**
 * Строит data-check-string по правилам Telegram: все переданные поля кроме
 * `hash`, отсортированные по ключу, пустые (`undefined`/`null`) пропущены.
 */
function buildDataCheckString(fields: Record<string, string | number | undefined | null>): string {
  return Object.entries(fields)
    .filter(([, value]) => value !== undefined && value !== null)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${String(value)}`)
    .join('\n');
}

/**
 * Считает подпись Telegram Login Widget для набора полей: HMAC-SHA256 от
 * data-check-string с ключом SHA256(botToken). Используется и на проверке
 * (`isValidTelegramAuth`), и в dev-helper'е, который генерирует тестовые
 * payload'ы (см. `AuthDevController`) там, где нужно самим сформировать
 * валидный `hash`, а не только проверить чужой.
 */
export function computeTelegramAuthHash(
  fields: Omit<TelegramWidgetPayload, 'hash'>,
  botToken: string,
): string {
  const dataCheckString = buildDataCheckString(fields);
  const secretKey = createHash('sha256').update(botToken).digest();
  return createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
}

/**
 * Проверяет подпись данных Telegram Login Widget: пересчитывает `hash` через
 * `computeTelegramAuthHash` и сравнивает с присланным за константное время.
 * См. https://core.telegram.org/widgets/login#checking-authorization
 */
export function isValidTelegramAuth(payload: TelegramWidgetPayload, botToken: string): boolean {
  const { hash, ...fields } = payload;
  const expectedHash = computeTelegramAuthHash(fields, botToken);

  const expected = Buffer.from(expectedHash, 'hex');
  const actual = Buffer.from(hash ?? '', 'hex');
  if (expected.length !== actual.length) {
    return false;
  }
  return timingSafeEqual(expected, actual);
}

/**
 * Отклоняет данные виджета, если `auth_date` старше `maxAgeSeconds` (защита
 * от replay ранее перехваченного набора полей) или указывает на будущее.
 */
export function isTelegramAuthFresh(authDate: number, maxAgeSeconds: number): boolean {
  const ageSeconds = Date.now() / 1000 - authDate;
  return ageSeconds >= 0 && ageSeconds <= maxAgeSeconds;
}

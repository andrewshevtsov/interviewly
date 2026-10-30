// Слой entities: правила отклика, которые проверяет и backend (время встречи, длина причины).
// Чистые функции без сети: сервер всё равно перепроверяет, здесь - мгновенная подсказка в форме.

const MINUTE_MS = 60_000;
const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

/**
 * Встреча не раньше, чем через столько часов от "сейчас".
 */
const MIN_LEAD_HOURS = 3;

/**
 * Встреча не позже, чем через столько дней от "сейчас".
 */
const MAX_LEAD_DAYS = 30;

/**
 * Статусы сессии, пока встреча по отклику считается действующей.
 */
const ACTIVE_MEETING_STATUSES = ["SCHEDULED", "READY", "ACTIVE"];

/**
 * Минимальная длина причины отказа (после обрезки пробелов).
 */
export const REASON_MIN_LENGTH = 30;

/**
 * Максимальная длина причины отказа (после обрезки пробелов).
 */
export const REASON_MAX_LENGTH = 500;

/**
 * Максимальная длина сообщения в чате (после обрезки пробелов).
 */
export const MESSAGE_MAX_LENGTH = 1000;

/**
 * Длина строки вида "2026-10-12T15:00" - формат значения `<input type="datetime-local">`.
 */
export const DATETIME_LOCAL_LENGTH = 16;

/**
 * Границы допустимого времени встречи.
 */
export interface SlotBounds {
  /**
   * Самое раннее допустимое время.
   */
  min: Date;

  /**
   * Самое позднее допустимое время.
   */
  max: Date;
}

/**
 * Границы допустимого времени встречи относительно момента `now`.
 * @param {Date} now - Текущий момент.
 * @returns {SlotBounds} Самое раннее и самое позднее допустимое время.
 */
export function getSlotBounds(now: Date): SlotBounds {
  return {
    min: new Date(now.getTime() + (MIN_LEAD_HOURS * HOUR_MS)),
    max: new Date(now.getTime() + (MAX_LEAD_DAYS * DAY_MS)),
  };
}

/**
 * Превращает дату в значение для `<input type="datetime-local">`: местное время без часового пояса.
 * @param {Date} date - Момент времени.
 * @returns {string} Строка вида "2026-10-12T15:00" в часовом поясе браузера.
 */
export function toDateTimeLocalValue(date: Date): string {
  const local = new Date(date.getTime() - (date.getTimezoneOffset() * MINUTE_MS));

  return local.toISOString().slice(0, DATETIME_LOCAL_LENGTH);
}

/**
 * Проверяет, что выбранное в поле время укладывается в границы отклика.
 * @param {string} localValue - Значение `datetime-local` (местное время).
 * @param {Date} now - Текущий момент.
 * @returns {boolean} `true`, если время корректно и не раньше min и не позже max.
 */
export function isSlotAllowed(localValue: string, now: Date): boolean {
  const slot = new Date(localValue).getTime();
  if (Number.isNaN(slot)) {
    return false;
  }

  const { min, max } = getSlotBounds(now);

  return slot >= min.getTime() && slot <= max.getTime();
}

/**
 * Переводит местное время из поля в ISO-8601 с часовым поясом, как требует backend.
 * @param {string} localValue - Значение `datetime-local`, например "2026-10-12T15:00".
 * @returns {string} ISO-строка в UTC, например "2026-10-12T11:00:00.000Z".
 */
export function localValueToIso(localValue: string): string {
  return new Date(localValue).toISOString();
}

/**
 * Проверяет длину причины отказа так же, как backend: пробелы по краям не считаются.
 * @param {string} reason - Введённый текст причины.
 * @returns {boolean} `true`, если после обрезки длина от 100 до 500 символов.
 */
export function isReasonLengthValid(reason: string): boolean {
  const length = reason.trim().length;

  return length >= REASON_MIN_LENGTH && length <= REASON_MAX_LENGTH;
}

/**
 * Отклик из истории, по которому решается, можно ли откликнуться снова.
 */
interface RespondAgainSubject {
  /**
   * Статус отклика.
   */
  status: string;

  /**
   * Статус созданной сессии.
   */
  sessionStatus: string | null;

  /**
   * Конец паузы после отказа (только у исходящих).
   */
  canRetryAt?: string | null;
}

/**
 * Можно ли предложить откликнуться снова из истории откликов: отклик уже решён, нет действующей
 * встречи и не идёт пауза после отказа. Остальное (например, свой более новый отклик) проверит backend.
 * @param {RespondAgainSubject} response - Отклик из списка входящих или исходящих.
 * @param {Date} now - Текущий момент.
 * @returns {boolean} `true`, если можно показывать кнопку отклика.
 */
export function canRespondAgain(response: RespondAgainSubject, now: Date): boolean {
  if (response.status === "PENDING") {
    return false;
  }

  if (response.status === "ACCEPTED") {
    return response.sessionStatus === null || !ACTIVE_MEETING_STATUSES.includes(response.sessionStatus);
  }

  return !response.canRetryAt || new Date(response.canRetryAt).getTime() <= now.getTime();
}

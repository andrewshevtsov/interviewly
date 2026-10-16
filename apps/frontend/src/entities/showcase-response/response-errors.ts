// Слой entities: разбор ошибок backend по отклику в ключи переводов. Чистые функции.
// Статус даёт общую категорию, а на 409 - сообщение backend: у него несколько разных причин.

/**
 * Что пошло не так при отклике на карточку.
 */
export type RespondErrorKey =
  | "invalidTime"
  | "ownCard"
  | "cardGone"
  | "noProfile"
  | "alreadyPending"
  | "meetingScheduled"
  | "cooldown"
  | "ownerBusy"
  | "youBusy"
  | "generic";

/**
 * Разобранная ошибка отклика.
 */
export interface RespondError {
  /**
   * Ключ перевода сообщения для пользователя.
   */
  key: RespondErrorKey;

  /**
   * Для `cooldown`: когда можно откликнуться снова, ISO; иначе `null`.
   */
  retryAt: string | null;
}

/**
 * Что пошло не так при принятии, отказе или отзыве отклика.
 */
export type ReviewErrorKey = "alreadyReviewed" | "timePassed" | "youBusy" | "responderBusy" | "notAllowed" | "generic";

const HTTP_BAD_REQUEST = 400;
const HTTP_FORBIDDEN = 403;
const HTTP_NOT_FOUND = 404;
const HTTP_CONFLICT = 409;

const RETRY_AT_PATTERN = /after (\S+Z)/;
const RETRY_AT_GROUP = 1;

/**
 * Ошибка без времени повтора.
 * @param {RespondErrorKey} key - Ключ перевода.
 * @returns {RespondError} Ошибка отклика.
 */
function plain(key: RespondErrorKey): RespondError {
  return { key, retryAt: null };
}

// Статус → ключ сообщения (кроме 409: там причин несколько, их разбираем по тексту)
const STATUS_ERRORS: Partial<Record<number, RespondErrorKey>> = {
  [HTTP_BAD_REQUEST]: "invalidTime",
  [HTTP_FORBIDDEN]: "ownCard",
  [HTTP_NOT_FOUND]: "cardGone",
};

/**
 * Причина конфликта (409): по какому фрагменту сообщения backend её узнать.
 */
interface ConflictError {
  /**
   * Фрагмент текста `message` из ответа backend.
   */
  fragment: string;

  /**
   * Ключ перевода сообщения для пользователя.
   */
  key: RespondErrorKey;
}

// 409: фрагмент сообщения backend → ключ; фрагменты не пересекаются, порядок не важен (проверяет тест)
export const CONFLICT_ERRORS: ConflictError[] = [
  { fragment: "Fill in your profile", key: "noProfile" },
  { fragment: "pending response to this card", key: "alreadyPending" },
  { fragment: "meeting scheduled", key: "meetingScheduled" },
  { fragment: "previous response was rejected", key: "cooldown" },
  { fragment: "card owner is busy", key: "ownerBusy" },
  { fragment: "already have an interview or a pending response", key: "youBusy" },
];

/**
 * Определяет причину неудачного отклика по статусу и сообщению от бэка.
 * @param {number | undefined} status - HTTP-статус; `undefined` для сетевых ошибок.
 * @param {string} message - Текст `message` из ответа backend (пустой, если его нет).
 * @returns {RespondError} Ключ перевода и, для паузы после отказа, время повтора.
 */
export function classifyRespondError(status: number | undefined, message: string): RespondError {
  const byStatus = status && STATUS_ERRORS[status];
  if (byStatus) {
    return plain(byStatus);
  }
  if (status !== HTTP_CONFLICT) {
    return plain("generic");
  }

  const key = CONFLICT_ERRORS.find((conflict) => message.includes(conflict.fragment))?.key ?? "generic";
  const retryAt = key === "cooldown" ? (RETRY_AT_PATTERN.exec(message)?.[RETRY_AT_GROUP] ?? null) : null;

  return { key, retryAt };
}

/**
 * Определяет причину неудачного решения (принять, отказать, отозвать) по статусу и сообщению.
 * @param {number | undefined} status - HTTP-статус; `undefined` для сетевых ошибок.
 * @param {string} message - Текст `message` из ответа backend.
 * @returns {ReviewErrorKey} Ключ перевода сообщения для пользователя.
 */
export function classifyReviewError(status: number | undefined, message: string): ReviewErrorKey {
  if (status === HTTP_FORBIDDEN) {
    return "notAllowed";
  }
  if (status !== HTTP_CONFLICT) {
    return "generic";
  }

  if (message.includes("already passed")) {
    return "timePassed";
  }
  if (message.includes("no longer available")) {
    return "responderBusy";
  }
  if (message.includes("You already have an interview around this time")) {
    return "youBusy";
  }

  return "alreadyReviewed";
}

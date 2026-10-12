// Слой entities: перевод ошибок смены email в ключи сообщений. Импортирует только shared.
import { getHttpStatus } from "@/shared/api/http-client";

/**
 * Ключ сообщения об ошибке смены email в группе переводов.
 */
export type EmailChangeErrorKey = "errWrongPassword" | "errEmailTaken" | "errEmailInvalid" | "errMailFailed" | "errGeneric";

const HTTP_BAD_REQUEST = 400;
const HTTP_FORBIDDEN = 403;
const HTTP_CONFLICT = 409;
const HTTP_SERVICE_UNAVAILABLE = 503;

const KEY_BY_STATUS: Record<number, EmailChangeErrorKey> = {
  [HTTP_BAD_REQUEST]: "errEmailInvalid",
  [HTTP_FORBIDDEN]: "errWrongPassword",
  [HTTP_CONFLICT]: "errEmailTaken",
  [HTTP_SERVICE_UNAVAILABLE]: "errMailFailed",
};

/**
 * Подбирает сообщение для ошибки запроса или подтверждения смены email.
 * @param {unknown} error - Ошибка из вызова `httpClient`.
 * @returns {EmailChangeErrorKey} Ключ перевода.
 */
export function classifyEmailChangeError(error: unknown): EmailChangeErrorKey {
  const status = getHttpStatus(error);

  return (status && KEY_BY_STATUS[status]) || "errGeneric";
}

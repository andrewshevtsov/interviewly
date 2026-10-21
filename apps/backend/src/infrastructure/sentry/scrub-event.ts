import type { ErrorEvent } from '@sentry/nestjs';

const SENSITIVE_HEADERS = new Set(['authorization', 'cookie', 'set-cookie']);

/**
 * Убирает из события то, что нельзя отправлять в GlitchTip: тело запроса (там бывают пароли),
 * cookie, заголовки авторизации и query string (в ссылках бывают токены).
 */
export function scrubEvent(event: ErrorEvent): ErrorEvent {
  const { request } = event;
  if (request) {
    delete request.data;
    delete request.cookies;
    delete request.query_string;
    if (request.headers) {
      request.headers = Object.fromEntries(
        Object.entries(request.headers).filter(([name]) => !SENSITIVE_HEADERS.has(name.toLowerCase())),
      );
    }
  }
  delete event.user;
  return event;
}

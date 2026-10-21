import type { Breadcrumb, ErrorEvent, NodeOptions } from "@sentry/nextjs";

const SENSITIVE_HEADERS = new Set(["authorization", "cookie", "set-cookie"]);
const BREADCRUMB_URL_KEYS = ["url", "from", "to"] as const;
const QUERY_OR_HASH = /[?#]/;

/**
 * Cuts the query string and hash from a URL: they carry tokens (e.g. email confirmation links).
 * @param {string} url - Absolute or relative URL.
 * @returns {string} URL without query string and hash.
 */
function stripQuery(url: string): string {
  return url.split(QUERY_OR_HASH)[0] ?? url;
}

/**
 * Removes request bodies, cookies, auth headers, query strings and user data from an error event
 * before it is sent to GlitchTip.
 * @param {ErrorEvent} event - Sentry error event.
 * @returns {ErrorEvent} The same event without sensitive data.
 */
export function scrubEvent(event: ErrorEvent): ErrorEvent {
  const { request } = event;

  if (request) {
    delete request.data;
    delete request.cookies;
    delete request.query_string;

    if (request.url) {
      request.url = stripQuery(request.url);
    }
    if (request.headers) {
      request.headers = Object.fromEntries(
        Object.entries(request.headers).filter(([name]) => !SENSITIVE_HEADERS.has(name.toLowerCase())),
      );
    }
  }
  delete event.user;

  return event;
}

/**
 * Strips query strings from URLs stored in navigation and network breadcrumbs.
 * @param {Breadcrumb} breadcrumb - Sentry breadcrumb.
 * @returns {Breadcrumb} Breadcrumb without query strings in URLs.
 */
export function scrubBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb {
  const { data } = breadcrumb;

  if (data) {
    for (const key of BREADCRUMB_URL_KEYS) {
      const value: unknown = data[key];

      if (typeof value === "string") {
        data[key] = stripQuery(value);
      }
    }
  }

  return breadcrumb;
}

/**
 * Options shared by the browser and the server SDK: errors only, no personal data.
 * The SDK collects cookies, headers, bodies, user and local variables by default, so everything is switched off.
 * Without a DSN (local development) the SDK sends nothing.
 */
export const SENTRY_OPTIONS = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: false,
    httpBodies: [],
    urlQueryParams: false,
    stackFrameVariables: false,
  },
  beforeSend: scrubEvent,
  beforeBreadcrumb: scrubBreadcrumb,
} satisfies NodeOptions;

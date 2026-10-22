import * as Sentry from "@sentry/nextjs";

import { SENTRY_OPTIONS } from "@/shared/lib/sentry-options";

/**
 * Initializes error reporting for the Node.js server runtime.
 */
export function register(): void {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init(SENTRY_OPTIONS);
  }
}

export const onRequestError = Sentry.captureRequestError;

"use client";

import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";
import { type ReactElement, useEffect } from "react";

/** Props passed by Next.js to the global error boundary. */
interface GlobalErrorProps {
  /** Error thrown while rendering. */
  error: Error & {
    /** Hash that matches the error with server logs. */
    digest?: string;
  };
}

/**
 * Last-resort error boundary: reports the error and shows Next.js' generic error page.
 * @param {GlobalErrorProps} props - Component props.
 * @returns {ReactElement} Document with the generic error page.
 */
export default function GlobalError({ error }: GlobalErrorProps): ReactElement {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}

import { type NextRequest, NextResponse } from "next/server";

import {
  isLocale,
  LOCALE_COOKIE_NAME,
  REQUEST_LOCALE_HEADER_NAME,
  resolveLocale,
} from "@/shared/i18n";

const LOCALE_PATH_SEGMENT_INDEX = 1;

/**
 * Redirects non-localized pages and exposes the URL locale to server components.
 * @param {NextRequest} request - Incoming Next.js request.
 * @returns {NextResponse} Redirect or localized request response.
 */
export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const requestedLocale = pathname.split("/")[LOCALE_PATH_SEGMENT_INDEX];

  if (isLocale(requestedLocale)) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(REQUEST_LOCALE_HEADER_NAME, requestedLocale);

    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.cookies.set(LOCALE_COOKIE_NAME, requestedLocale, {
      path: "/",
      sameSite: "lax",
      maxAge: 31_536_000,
    });

    return response;
  }

  const locale = resolveLocale(request.cookies.get(LOCALE_COOKIE_NAME)?.value);
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;

  return NextResponse.redirect(redirectUrl);
}

export const config = { matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"] };

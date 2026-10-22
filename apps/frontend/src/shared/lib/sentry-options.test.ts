import type { Breadcrumb, ErrorEvent } from "@sentry/nextjs";
import { describe, expect, it } from "vitest";

import { scrubBreadcrumb, scrubEvent } from "./sentry-options";

describe("scrubEvent", () => {
  it("убирает тело, cookie, заголовки авторизации, user и query из ссылки", () => {
    const event = {
      type: undefined,
      request: {
        url: "https://interviewly.top/ru/confirm-email?token=secret#x",
        data: { password: "secret" },
        cookies: { a: "b" },
        query_string: "token=secret",
        headers: { Authorization: "Bearer x", "User-Agent": "ua" },
      },
      user: { id: "1", email: "a@b.c" },
    } as ErrorEvent;

    const result = scrubEvent(event);

    expect(result.request).toEqual({
      url: "https://interviewly.top/ru/confirm-email",
      headers: { "User-Agent": "ua" },
    });
    expect(result.user).toBeUndefined();
  });

  it("не падает на событии без запроса", () => {
    expect(scrubEvent({ type: undefined, message: "boom" } as ErrorEvent)).toEqual({ type: undefined, message: "boom" });
  });
});

describe("scrubBreadcrumb", () => {
  it("убирает query из ссылок навигации и запросов", () => {
    const breadcrumb: Breadcrumb = {
      category: "navigation",
      data: { from: "/ru/a?token=1", to: "/ru/b?token=2", url: "https://x.y/api?z=1", status: 200 },
    };

    expect(scrubBreadcrumb(breadcrumb).data).toEqual({ from: "/ru/a", to: "/ru/b", url: "https://x.y/api", status: 200 });
  });
});

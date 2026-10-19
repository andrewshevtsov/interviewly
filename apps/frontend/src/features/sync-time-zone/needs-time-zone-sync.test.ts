import { describe, expect, it } from "vitest";

import { needsTimeZoneSync } from "./needs-time-zone-sync";

describe("needsTimeZoneSync", () => {
  it("отправляет пояс браузера, если в профиле пусто", () => {
    expect(needsTimeZoneSync(null, "Asia/Dubai")).toBe(true);
  });

  it("не перезаписывает сохранённый пояс", () => {
    expect(needsTimeZoneSync("Europe/Moscow", "Asia/Dubai")).toBe(false);
  });

  it("ничего не делает, если браузер не назвал пояс", () => {
    expect(needsTimeZoneSync(null, undefined)).toBe(false);
    expect(needsTimeZoneSync(null, "")).toBe(false);
  });
});

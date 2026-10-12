import { describe, expect, it } from "vitest";

import { formatDateTime, formatDateTimeNumeric } from "./format-date-time";

describe("formatDateTime", () => {
  const iso = "2026-10-12T11:00:00.000Z";

  it("пишет месяц словом на языке интерфейса", () => {
    expect(formatDateTime(iso, "ru")).toContain("октября");
    expect(formatDateTime(iso, "en")).toContain("October");
  });

  it("содержит время в формате часы:минуты", () => {
    expect(formatDateTime(iso, "ru")).toMatch(/\d{2}:\d{2}/);
  });
});

describe("formatDateTimeNumeric", () => {
  const iso = "2026-10-14T13:26:00.000Z";

  it("пишет дату цифрами день.месяц.год и время через запятую", () => {
    expect(formatDateTimeNumeric(iso, "ru")).toMatch(/^\d{2}\.\d{2}\.2026, \d{2}:\d{2}$/);
  });

  it("для английского тоже день-месяц-год, а не американский порядок", () => {
    expect(formatDateTimeNumeric(iso, "en")).toMatch(/^\d{2}\/\d{2}\/2026, \d{2}:\d{2}$/);
  });
});

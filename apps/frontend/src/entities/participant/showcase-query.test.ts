import { describe, expect, it } from "vitest";

import { buildShowcaseParams, SHOWCASE_PAGE_SIZE } from "./showcase-query";

const NO_FILTERS = { levels: [], stack: [], query: "" };

describe("buildShowcaseParams", () => {
  it("без фильтров отдаёт только размер страницы", () => {
    expect(buildShowcaseParams(NO_FILTERS).toString()).toBe(`limit=${SHOWCASE_PAGE_SIZE}`);
  });

  it("повторяет level и stack отдельными параметрами", () => {
    const params = buildShowcaseParams({ levels: ["junior", "middle"], stack: ["React", "Go"], query: "" });

    expect(params.getAll("level")).toEqual(["junior", "middle"]);
    expect(params.getAll("stack")).toEqual(["React", "Go"]);
  });

  it("обрезает пробелы в поиске и не отправляет пустой поиск", () => {
    expect(buildShowcaseParams({ ...NO_FILTERS, query: "  ivan  " }).get("q")).toBe("ivan");
    expect(buildShowcaseParams({ ...NO_FILTERS, query: "   " }).has("q")).toBe(false);
  });

  it("добавляет курсор только для следующих страниц", () => {
    expect(buildShowcaseParams(NO_FILTERS).has("cursor")).toBe(false);
    expect(buildShowcaseParams(NO_FILTERS, "abc").get("cursor")).toBe("abc");
  });

  it("кодирует спецсимволы стека (например, CI/CD)", () => {
    expect(buildShowcaseParams({ ...NO_FILTERS, stack: ["CI/CD"] }).toString()).toContain("stack=CI%2FCD");
  });
});

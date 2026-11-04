import { describe, expect, it } from "vitest";
import { canAddAnotherLanguage, getUnusedTaskLanguages } from "./create-task-flow";

describe("create task language flow", () => {
  it("предлагает Next, пока после текущего остаётся ещё один язык", () => {
    expect(canAddAnotherLanguage([])).toBe(true);
    expect(canAddAnotherLanguage(["JAVASCRIPT"])).toBe(true);
  });

  it("скрывает Next перед последним неиспользованным языком", () => {
    expect(canAddAnotherLanguage(["JAVASCRIPT", "PYTHON"])).toBe(false);
  });

  it("не предлагает уже сохранённые языки повторно", () => {
    expect(getUnusedTaskLanguages(["JAVASCRIPT"])).toEqual(["PYTHON", "TYPESCRIPT"]);
  });
});

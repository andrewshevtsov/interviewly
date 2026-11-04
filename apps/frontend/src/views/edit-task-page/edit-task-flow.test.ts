import { describe, expect, it } from "vitest";

import type { ProgrammingTaskEditItem } from "@/entities/programming-task";
import {
  createDrafts,
  createEmptyVariantDraft,
  getLanguageSlotState,
  parseTestCaseDrafts,
  reconcileDraftsWithServer,
  reconcileSelectedVariantId,
  type EditableVariant,
  type VariantDraft,
} from "./edit-task-flow";

/**
 * Собирает минимальный языковой вариант для тестов, переопределяя только
 * нужные поля.
 * @param {Partial<EditableVariant>} overrides - Поля, отличающиеся от дефолтных.
 * @returns {EditableVariant} Вариант, готовый для списка `variants`.
 */
function buildVariant(overrides: Partial<EditableVariant> = {}): EditableVariant {
  return {
    id: "variant-id",
    language: "JAVASCRIPT",
    starterCode: "function solve() {}",
    harnessCode: "solve(input);",
    referenceSolution: "function solve() { return 1; }",
    status: "VERIFIED",
    verifiedAt: "2026-10-28T12:00:00.000Z",
    lastVerificationError: null,
    testCases: [{ id: "case-1", name: "Case 1", input: [1], expectedOutput: 1 }],
    ...overrides,
  };
}

/**
 * Собирает минимальную задачу для тестов, переопределяя только нужные поля.
 * @param {Partial<ProgrammingTaskEditItem>} overrides - Поля, отличающиеся от дефолтных.
 * @returns {ProgrammingTaskEditItem} Задача, готовая для `createDrafts`.
 */
function buildTask(overrides: Partial<ProgrammingTaskEditItem> = {}): ProgrammingTaskEditItem {
  return {
    id: "task-id",
    slug: "sum",
    title: "Sum",
    description: "Return sum.",
    difficulty: "EASY",
    version: 1,
    variants: [buildVariant()],
    ...overrides,
  };
}

describe("createEmptyVariantDraft", () => {
  it("возвращает пустой код и один пустой тест-кейс", () => {
    expect(createEmptyVariantDraft()).toEqual({
      starterCode: "",
      harnessCode: "",
      referenceSolution: "",
      testCases: [{ key: "new-0", input: "", expectedOutput: "" }],
    });
  });
});

describe("createDrafts", () => {
  it("превращает входные данные тест-кейсов в JSON-строки, ключуя черновик по id варианта", () => {
    const variant = buildVariant({
      id: "variant-1",
      testCases: [{ id: "case-1", name: "Case 1", input: [1, 2], expectedOutput: { sum: 3 } }],
    });
    const task = buildTask({ variants: [variant] });

    expect(createDrafts(task)).toEqual({
      "variant-1": {
        starterCode: variant.starterCode,
        harnessCode: variant.harnessCode,
        referenceSolution: variant.referenceSolution,
        testCases: [{ key: "case-1", input: "[1,2]", expectedOutput: "{\"sum\":3}" }],
      },
    });
  });

  it("для нескольких вариантов строит отдельный черновик на каждый id", () => {
    const task = buildTask({ variants: [buildVariant({ id: "variant-1" }), buildVariant({ id: "variant-2" })] });

    expect(Object.keys(createDrafts(task))).toEqual(["variant-1", "variant-2"]);
  });
});

describe("reconcileDraftsWithServer", () => {
  it("заменяет черновик на серверный, если вариант не помечен как dirty", () => {
    const variant = buildVariant({ id: "variant-1" });
    const task = buildTask({ variants: [variant] });
    const currentDrafts: Record<string, VariantDraft> = { "variant-1": { starterCode: "stale", harnessCode: "", referenceSolution: "", testCases: [] } };

    const result = reconcileDraftsWithServer({
      task,
      currentDrafts,
      dirtyVariantIds: new Set(),
    });

    expect(result["variant-1"]?.starterCode).toBe(variant.starterCode);
  });

  it("сохраняет несохранённый черновик dirty-варианта вместо серверного", () => {
    const task = buildTask({ variants: [buildVariant({ id: "variant-1" })] });
    const dirtyDraft: VariantDraft = {
      starterCode: "edited by admin",
      harnessCode: "",
      referenceSolution: "",
      testCases: [],
    };

    const result = reconcileDraftsWithServer({
      task,
      currentDrafts: { "variant-1": dirtyDraft },
      dirtyVariantIds: new Set(["variant-1"]),
    });

    expect(result["variant-1"]).toBe(dirtyDraft);
  });

  it("не падает, если dirty-вариант отсутствует среди текущих черновиков", () => {
    const variant = buildVariant({ id: "variant-1" });
    const task = buildTask({ variants: [variant] });

    const result = reconcileDraftsWithServer({
      task,
      currentDrafts: {},
      dirtyVariantIds: new Set(["variant-1"]),
    });

    expect(result["variant-1"]?.starterCode).toBe(variant.starterCode);
  });
});

describe("reconcileSelectedVariantId", () => {
  it("сохраняет пустой выбор - режим добавления нового языка", () => {
    expect(
      reconcileSelectedVariantId({
        currentSelectedVariantId: "",
        variants: [buildVariant({ id: "variant-1" })],
      }),
    ).toBe("");
  });

  it("сохраняет выбор, если выбранный вариант всё ещё существует", () => {
    expect(
      reconcileSelectedVariantId({
        currentSelectedVariantId: "variant-1",
        variants: [buildVariant({ id: "variant-1" }), buildVariant({ id: "variant-2" })],
      }),
    ).toBe("variant-1");
  });

  it("переключается на первый вариант, если выбранный исчез", () => {
    expect(
      reconcileSelectedVariantId({
        currentSelectedVariantId: "deleted-variant",
        variants: [buildVariant({ id: "variant-1" })],
      }),
    ).toBe("variant-1");
  });

  it("возвращает пустую строку, если вариантов не осталось вовсе", () => {
    expect(
      reconcileSelectedVariantId({ currentSelectedVariantId: "deleted-variant", variants: [] }),
    ).toBe("");
  });
});

describe("getLanguageSlotState", () => {
  it("для проверенного варианта подсвечивает язык зелёным и не блокирует выбор", () => {
    expect(
      getLanguageSlotState({
        variant: buildVariant({ status: "VERIFIED" }),
        pendingNewVariantId: null,
        newLanguage: "",
        language: "JAVASCRIPT",
      }),
    ).toEqual({
      isPendingFailedLanguage: false,
      isSelectionBlocked: false,
      statusClass: "text-success",
    });
  });

  it("для не прошедшего проверку существующего варианта подсвечивает язык красным", () => {
    expect(
      getLanguageSlotState({
        variant: buildVariant({ status: "FAILED" }),
        pendingNewVariantId: null,
        newLanguage: "",
        language: "JAVASCRIPT",
      }),
    ).toMatchObject({ isSelectionBlocked: false, statusClass: "text-destructive" });
  });

  it("без варианта и без добавления языка показывает нейтральный статус", () => {
    expect(
      getLanguageSlotState({
        variant: undefined,
        pendingNewVariantId: null,
        newLanguage: "",
        language: "PYTHON",
      }),
    ).toEqual({
      isPendingFailedLanguage: false,
      isSelectionBlocked: false,
      statusClass: "text-muted-foreground",
    });
  });

  it("не прошедший проверку добавляемый язык остаётся доступным и подсвечен красным", () => {
    expect(
      getLanguageSlotState({
        variant: undefined,
        pendingNewVariantId: "pending-variant-id",
        newLanguage: "PYTHON",
        language: "PYTHON",
      }),
    ).toEqual({
      isPendingFailedLanguage: true,
      isSelectionBlocked: false,
      statusClass: "text-destructive",
    });
  });

  it("остальные языки блокируются, пока не решена судьба добавляемого", () => {
    expect(
      getLanguageSlotState({
        variant: undefined,
        pendingNewVariantId: "pending-variant-id",
        newLanguage: "PYTHON",
        language: "TYPESCRIPT",
      }),
    ).toMatchObject({ isPendingFailedLanguage: false, isSelectionBlocked: true });
  });
});

describe("parseTestCaseDrafts", () => {
  it("парсит JSON входа и ожидаемого результата, нумеруя тесты с единицы", () => {
    expect(
      parseTestCaseDrafts(
        [
          { key: "a", input: "[1,2,3]", expectedOutput: "6" },
          { key: "b", input: "{\"n\":1}", expectedOutput: "null" },
        ],
        "Тест-кейс",
      ),
    ).toEqual([
      { name: "Тест-кейс 1", input: [1, 2, 3], expectedOutput: 6 },
      { name: "Тест-кейс 2", input: { n: 1 }, expectedOutput: null },
    ]);
  });

  it("бросает исключение, если входные данные - невалидный JSON", () => {
    expect(() =>
      parseTestCaseDrafts([{ key: "a", input: "not json", expectedOutput: "1" }], "Тест-кейс"),
    ).toThrow();
  });

  it("бросает исключение, если ожидаемый результат - невалидный JSON", () => {
    expect(() =>
      parseTestCaseDrafts([{ key: "a", input: "1", expectedOutput: "not json" }], "Тест-кейс"),
    ).toThrow();
  });
});

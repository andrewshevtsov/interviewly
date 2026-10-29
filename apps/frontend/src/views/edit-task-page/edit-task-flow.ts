import type { ProgrammingTaskEditItem, ProgrammingTaskLanguage } from "@/entities/programming-task";

const TEST_CASE_INDEX_OFFSET = 1;

/** Поля редактируемого тест-кейса. */
export interface TestCaseDraft {
  /** Стабильный ключ строки формы. */
  key: string;
  /** JSON входных данных в текстовом виде. */
  input: string;
  /** JSON ожидаемого результата в текстовом виде. */
  expectedOutput: string;
}

/** Поля одного языкового варианта. */
export interface VariantDraft {
  /** Код кандидата. */
  starterCode: string;
  /** Системная обвязка. */
  harnessCode: string;
  /** Эталонное решение. */
  referenceSolution: string;
  /** Скрытые тесты. */
  testCases: TestCaseDraft[];
}

/** Распарсенный тест-кейс для API. */
export interface ParsedTestCase {
  /** Имя теста. */
  name: string;
  /** Входное JSON-значение. */
  input: unknown;
  /** Ожидаемое JSON-значение. */
  expectedOutput: unknown;
}

/** Языковой вариант, загруженный с backend для редактирования. */
export type EditableVariant = ProgrammingTaskEditItem["variants"][number];

/** Подсветка и блокировка одного языка в выпадающем списке "Стек". */
export interface LanguageSlotState {
  /** Этот язык сейчас повторно проверяется после провала добавления. */
  isPendingFailedLanguage: boolean;
  /** Выбор другого языка недоступен, пока не решится судьба добавляемого. */
  isSelectionBlocked: boolean;
  /** Класс цвета статуса рядом с языком. */
  statusClass: "text-success" | "text-destructive" | "text-muted-foreground";
}

/**
 * Создаёт пустой черновик нового языкового варианта.
 * @returns {VariantDraft} Черновик с одним пустым тест-кейсом.
 */
export function createEmptyVariantDraft(): VariantDraft {
  return {
    starterCode: "",
    harnessCode: "",
    referenceSolution: "",
    testCases: [{ key: "new-0", input: "", expectedOutput: "" }],
  };
}

/**
 * Превращает JSON-значение в редактируемую строку.
 * @param {unknown} value - Значение из API.
 * @returns {string} JSON для поля ввода.
 */
export function formatJson(value: unknown): string {
  return JSON.stringify(value) ?? "";
}

/**
 * Создаёт локальные черновики всех языковых вариантов.
 * @param {ProgrammingTaskEditItem} task - Полные данные задачи.
 * @returns {Record<string, VariantDraft>} Черновики по идентификаторам вариантов.
 */
export function createDrafts(task: ProgrammingTaskEditItem): Record<string, VariantDraft> {
  return Object.fromEntries(
    task.variants.map((variant) => [
      variant.id,
      {
        starterCode: variant.starterCode,
        harnessCode: variant.harnessCode,
        referenceSolution: variant.referenceSolution,
        testCases: variant.testCases.map((testCase) => ({
          key: testCase.id,
          input: formatJson(testCase.input),
          expectedOutput: formatJson(testCase.expectedOutput),
        })),
      },
    ]),
  );
}

/**
 * Пересобирает черновики после получения свежего снимка задачи с backend,
 * сохраняя несохранённые правки вариантов, помеченных как dirty.
 * @param {object} params - Свежая задача, текущие черновики и dirty-идентификаторы.
 * @param {ProgrammingTaskEditItem} params.task - Свежий снимок задачи с backend.
 * @param {Record<string, VariantDraft>} params.currentDrafts - Черновики перед синхронизацией.
 * @param {ReadonlySet<string>} params.dirtyVariantIds - Варианты с несохранёнными правками.
 * @returns {Record<string, VariantDraft>} Черновики, готовые для setState.
 */
export function reconcileDraftsWithServer(params: {
  /** Свежий снимок задачи с backend. */
  task: ProgrammingTaskEditItem;
  /** Черновики перед синхронизацией. */
  currentDrafts: Record<string, VariantDraft>;
  /** Варианты с несохранёнными правками. */
  dirtyVariantIds: ReadonlySet<string>;
}): Record<string, VariantDraft> {
  const { task, currentDrafts, dirtyVariantIds } = params;
  const serverDrafts = createDrafts(task);

  for (const variantId of dirtyVariantIds) {
    if (currentDrafts[variantId]) {
      serverDrafts[variantId] = currentDrafts[variantId];
    }
  }

  return serverDrafts;
}

/**
 * Решает, какой вариант должен остаться выбранным после обновления списка
 * вариантов с backend.
 * @param {object} params - Текущий выбор и свежий список вариантов.
 * @param {string} params.currentSelectedVariantId - Выбранный до обновления вариант.
 * @param {readonly EditableVariant[]} params.variants - Свежий список вариантов с backend.
 * @returns {string} Идентификатор варианта или пустая строка для режима добавления.
 */
export function reconcileSelectedVariantId(params: {
  /** Выбранный до обновления вариант. */
  currentSelectedVariantId: string;
  /** Свежий список вариантов с backend. */
  variants: readonly EditableVariant[];
}): string {
  const { currentSelectedVariantId, variants } = params;

  return currentSelectedVariantId === "" ||
    variants.some((variant) => variant.id === currentSelectedVariantId)
    ? currentSelectedVariantId
    : variants[0]?.id ?? "";
}

/**
 * Вычисляет подсветку и блокировку одного языка в выпадающем списке "Стек"
 * на шаге реализации.
 * @param {object} params - Вариант языка (если есть) и состояние добавления нового языка.
 * @param {EditableVariant | undefined} params.variant - Существующий вариант этого языка, если есть.
 * @param {string | null} params.pendingNewVariantId - Не прошедший проверку добавляемый вариант.
 * @param {ProgrammingTaskLanguage | ""} params.newLanguage - Язык, выбранный для добавления.
 * @param {ProgrammingTaskLanguage} params.language - Язык текущего пункта списка.
 * @returns {LanguageSlotState} Готовые для рендера признаки и класс цвета.
 */
export function getLanguageSlotState(params: {
  /** Существующий вариант этого языка, если есть. */
  variant: EditableVariant | undefined;
  /** Не прошедший проверку добавляемый вариант. */
  pendingNewVariantId: string | null;
  /** Язык, выбранный для добавления. */
  newLanguage: ProgrammingTaskLanguage | "";
  /** Язык текущего пункта списка. */
  language: ProgrammingTaskLanguage;
}): LanguageSlotState {
  const { variant, pendingNewVariantId, newLanguage, language } = params;
  const isPendingFailedLanguage = pendingNewVariantId !== null && newLanguage === language;
  const isSelectionBlocked = pendingNewVariantId !== null && !isPendingFailedLanguage;
  const statusClass =
    variant?.status === "VERIFIED"
      ? "text-success"
      : variant?.status === "FAILED" || isPendingFailedLanguage
        ? "text-destructive"
        : "text-muted-foreground";

  return { isPendingFailedLanguage, isSelectionBlocked, statusClass };
}

/**
 * Парсит JSON текстовых тест-кейсов черновика в данные для API.
 * @param {readonly TestCaseDraft[]} testCases - Тест-кейсы черновика в виде текста.
 * @param {string} testCaseNamePrefix - Общая часть имени теста ("Тест-кейс" и т.п.).
 * @returns {ParsedTestCase[]} Распарсенные тест-кейсы.
 * @throws {SyntaxError} Если хотя бы одно поле содержит некорректный JSON.
 */
export function parseTestCaseDrafts(
  testCases: readonly TestCaseDraft[],
  testCaseNamePrefix: string,
): ParsedTestCase[] {
  return testCases.map((testCase, index) => ({
    name: `${testCaseNamePrefix} ${index + TEST_CASE_INDEX_OFFSET}`,
    input: JSON.parse(testCase.input) as unknown,
    expectedOutput: JSON.parse(testCase.expectedOutput) as unknown,
  }));
}

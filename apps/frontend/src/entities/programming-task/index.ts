import { httpClient } from "@/shared/api/http-client";

/** Уровень сложности задачи из банка. */
export type ProgrammingTaskDifficulty = "EASY" | "MEDIUM" | "HARD";

/** Язык, для которого у задачи есть стартовый код. */
export type ProgrammingTaskLanguage = "PYTHON" | "JAVASCRIPT" | "TYPESCRIPT";

/** Языки, для которых приложение поддерживает варианты задач. */
export const TASK_LANGUAGES: ProgrammingTaskLanguage[] = ["PYTHON", "JAVASCRIPT", "TYPESCRIPT"];

const VERIFICATION_TIMEOUT_MS = 120_000;
const VERIFICATION_POLL_INTERVAL_MS = 750;

/** Статус проверки языкового варианта. */
export type ProgrammingTaskVariantStatus = "DRAFT" | "VERIFYING" | "VERIFIED" | "FAILED";

/** Данные первой языковой реализации новой задачи. */
export interface CreateProgrammingTaskInput {
  /** Название задачи. */
  title: string;
  /** Условие задачи. */
  description: string;
  /** Уровень сложности. */
  difficulty: ProgrammingTaskDifficulty;
  /** Язык первой реализации. */
  language: ProgrammingTaskLanguage;
  /** Код, который получит кандидат. */
  starterCode: string;
  /** Системная обвязка запуска решения. */
  harnessCode: string;
  /** Эталонное решение для проверки тестов. */
  referenceSolution: string;
  /** Скрытые тест-кейсы языкового варианта. */
  testCases: Array<{
    /** Отображаемое имя теста. */
    name: string;
    /** JSON-совместимые входные данные. */
    input: unknown;
    /** JSON-совместимый ожидаемый результат. */
    expectedOutput: unknown;
  }>;
}

/** Общие поля задачи, сохраняемые без запуска верификации. */
export interface UpdateProgrammingTaskDetailsInput {
  /** Версия задачи (optimistic locking), загруженная перед редактированием. */
  expectedVersion: number;
  /** Название задачи. */
  title: string;
  /** Условие задачи. */
  description: string;
  /** Уровень сложности. */
  difficulty: ProgrammingTaskDifficulty;
}

/** Исполняемые поля одного языкового варианта без общих данных задачи. */
export type ProgrammingTaskVariantInput = Omit<
  CreateProgrammingTaskInput,
  "title" | "description" | "difficulty"
>;

/** Поля повторной проверки варианта: язык неизменяем и в запрос не входит. */
export type ReverifyProgrammingTaskVariantInput = Omit<ProgrammingTaskVariantInput, "language">;

/** Результат постановки языкового варианта в очередь проверки. */
export interface CreateProgrammingTaskResponse {
  /** Идентификатор общей задачи. */
  id: string;
  /** Сгенерированный slug задачи. */
  slug: string;
  /** Идентификатор языкового варианта. */
  variantId: string;
  /** Текущее состояние фоновой проверки. */
  status: "VERIFYING" | "VERIFIED" | "FAILED";
  /** Техническая причина провала проверки. */
  verificationError: string | null;
}

/** Краткие данные задачи для выбора в форме сессии. */
export interface ProgrammingTaskListItem {
  /** Уникальный идентификатор задачи. */
  id: string;

  /** Стабильное символьное имя. */
  slug: string;

  /** Название задачи. */
  title: string;

  /** Условие задачи. */
  description: string;

  /** Уровень сложности. */
  difficulty: ProgrammingTaskDifficulty;
}

/** Задача со всеми языками, для которых доступно решение. */
export interface ProgrammingTaskBankItem extends ProgrammingTaskListItem {
  /** Доступные языки программирования. */
  languages: ProgrammingTaskLanguage[];
}

/** Полные данные задачи, доступные администратору для редактирования. */
export interface ProgrammingTaskEditItem extends ProgrammingTaskListItem {
  /** Версия общих данных для optimistic locking. */
  version: number;
  /** Все языковые варианты, включая ещё не прошедшие проверку. */
  variants: Array<{
    /** Идентификатор варианта. */
    id: string;
    /** Язык реализации. */
    language: ProgrammingTaskLanguage;
    /** Код, выдаваемый кандидату. */
    starterCode: string;
    /** Системная обвязка. */
    harnessCode: string;
    /** Эталонное решение. */
    referenceSolution: string;
    /** Текущий статус проверки. */
    status: ProgrammingTaskVariantStatus;
    /** Время последней успешной проверки. */
    verifiedAt: string | null;
    /** Причина последней неуспешной проверки. */
    lastVerificationError: string | null;
    /** Скрытые тесты варианта. */
    testCases: Array<{
      /** Идентификатор теста. */
      id: string;
      /** Имя теста. */
      name: string;
      /** JSON-вход. */
      input: unknown;
      /** Ожидаемый JSON-результат. */
      expectedOutput: unknown;
    }>;
  }>;
}

/** Ответ backend со стандартным Harness выбранного языка. */
interface HarnessTemplateResponse {
  /** Полный код системной обвязки. */
  harnessCode: string;
}

/** Канонические общие поля задачи после сохранения на backend. */
type UpdateProgrammingTaskDetailsResponse = ProgrammingTaskListItem & {
  /** Новая версия общих данных для optimistic locking. */
  version: number;
};

/** API банка задач. */
export const programmingTaskApi = {
  /**
   * Ожидает завершения фоновой проверки отдельного языкового варианта.
   * Каждый запрос статуса короткий и не удерживает соединение с Code Runner.
   * @param {string} taskId - Идентификатор общей задачи.
   * @param {string} variantId - Идентификатор проверяемого варианта.
   * @param {number} timeoutMs - Максимальное время ожидания финального статуса.
   * @returns {Promise<CreateProgrammingTaskResponse>} Финальный результат проверки.
   */
  async waitForVerification(
    taskId: string,
    variantId: string,
    timeoutMs = VERIFICATION_TIMEOUT_MS,
  ): Promise<CreateProgrammingTaskResponse> {
    const deadline = Date.now() + timeoutMs;
    let lastKnownError: string | null = null;

    while (Date.now() < deadline) {
      const task = await this.getForEditing(taskId);
      const variant = task.variants.find((item) => item.id === variantId);
      if (!variant) {
        throw new Error("Programming task variant was not found");
      }
      if (variant.status === "VERIFIED" || variant.status === "FAILED") {
        return {
          id: task.id,
          slug: task.slug,
          variantId,
          status: variant.status,
          verificationError: variant.lastVerificationError,
        };
      }
      // Вариант ещё VERIFYING, но backend мог уже записать причину задержки
      // (например, сервис запуска кода временно занят сессиями).
      lastKnownError = variant.lastVerificationError;

      await new Promise((resolve) => setTimeout(resolve, VERIFICATION_POLL_INTERVAL_MS));
    }

    throw new Error(lastKnownError ?? "Programming task verification timed out");
  },

  /**
   * Полностью удаляет задачу, её варианты и скрытые тесты.
   * @param {string} id - Идентификатор задачи.
   * @returns {Promise<void>} Завершается после удаления.
   */
  async delete(id: string): Promise<void> {
    await httpClient.delete(`/programming-tasks/${id}`);
  },

  /**
   * Сохраняет общие поля задачи без проверки языкового варианта.
   * @param {string} id - Идентификатор задачи.
   * @param {UpdateProgrammingTaskDetailsInput} input - Общие поля задачи.
   * @returns {Promise<ProgrammingTaskListItem>} Обновлённая задача.
   */
  updateDetails(
    id: string,
    input: UpdateProgrammingTaskDetailsInput,
  ): Promise<UpdateProgrammingTaskDetailsResponse> {
    return httpClient
      .patch<UpdateProgrammingTaskDetailsResponse>(`/programming-tasks/${id}`, input)
      .then((response) => response.data);
  },

  /**
   * Загружает задачу со всеми вариантами и скрытыми тестами для администратора.
   * @param {string} id - Идентификатор задачи.
   * @returns {Promise<ProgrammingTaskEditItem>} Полные данные задачи.
   */
  getForEditing(id: string): Promise<ProgrammingTaskEditItem> {
    return httpClient
      .get<ProgrammingTaskEditItem>(`/programming-tasks/${id}/edit`)
      .then((response) => response.data);
  },

  /**
   * Создаёт задачу и ставит проверку эталонного решения в очередь.
   * @param {CreateProgrammingTaskInput} input - Поля задачи и первой реализации.
   * @returns {Promise<CreateProgrammingTaskResponse>} Результат создания и проверки.
   */
  create(input: CreateProgrammingTaskInput): Promise<CreateProgrammingTaskResponse> {
    return httpClient
      .post<CreateProgrammingTaskResponse>("/programming-tasks", input)
      .then((response) => response.data);
  },

  /**
   * Добавляет реализацию ещё одного языка и ставит её проверку в очередь.
   * @param {string} taskId - Идентификатор общей задачи.
   * @param {ProgrammingTaskVariantInput} input - Поля нового языкового варианта.
   * @returns {Promise<CreateProgrammingTaskResponse>} Поставленный в очередь вариант.
   */
  addVariant(
    taskId: string,
    input: ProgrammingTaskVariantInput,
  ): Promise<CreateProgrammingTaskResponse> {
    return httpClient
      .post<CreateProgrammingTaskResponse>(`/programming-tasks/${taskId}/variants`, input)
      .then((response) => response.data);
  },

  /**
   * Обновляет ранее не прошедший проверку вариант без создания дубля.
   * @param {string} taskId - Идентификатор задачи.
   * @param {string} variantId - Идентификатор языкового варианта.
   * @param {ReverifyProgrammingTaskVariantInput} input - Исправленные поля реализации.
   * @returns {Promise<CreateProgrammingTaskResponse>} Результат повторной проверки.
   */
  reverify(
    taskId: string,
    variantId: string,
    input: ReverifyProgrammingTaskVariantInput,
  ): Promise<CreateProgrammingTaskResponse> {
    return httpClient
      .put<CreateProgrammingTaskResponse>(
        `/programming-tasks/${taskId}/variants/${variantId}`,
        input,
      )
      .then((response) => response.data);
  },

  /**
   * Загружает стандартный Harness выбранного языка для администратора.
   * @param {ProgrammingTaskLanguage} language - Язык реализации.
   * @returns {Promise<string>} Harness, который можно отредактировать в форме.
   */
  getHarnessTemplate(language: ProgrammingTaskLanguage): Promise<string> {
    return httpClient
      .get<HarnessTemplateResponse>(`/programming-tasks/harness-templates/${language}`)
      .then((response) => response.data.harnessCode);
  },

  /**
   * Загружает активные задачи со стартовым кодом для языка.
   * @param {ProgrammingTaskLanguage} language - Язык решения.
   * @returns {Promise<ProgrammingTaskListItem[]>} Доступные задачи.
   */
  list(language: ProgrammingTaskLanguage): Promise<ProgrammingTaskListItem[]> {
    return httpClient
      .get<ProgrammingTaskListItem[]>("/programming-tasks", { params: { language } })
      .then((response) => response.data);
  },

  /**
   * Загружает банк задач и объединяет языковые варианты одной задачи.
   * @returns {Promise<ProgrammingTaskBankItem[]>} Задачи со списком доступных языков.
   */
  async listBank(): Promise<ProgrammingTaskBankItem[]> {
    const languages: ProgrammingTaskLanguage[] = ["PYTHON", "JAVASCRIPT", "TYPESCRIPT"];
    const responses = await Promise.all(
      languages.map(async (language) => ({ language, items: await this.list(language) })),
    );
    const tasks = new Map<string, ProgrammingTaskBankItem>();

    responses.forEach(({ language, items }) => {
      items.forEach((item) => {
        const existingTask = tasks.get(item.id);

        if (existingTask) {
          existingTask.languages.push(language);
        } else {
          tasks.set(item.id, { ...item, languages: [language] });
        }
      });
    });

    return Array.from(tasks.values());
  },
};

import { httpClient } from "@/shared/api/http-client";

/** Уровень сложности задачи из банка. */
export type ProgrammingTaskDifficulty = "EASY" | "MEDIUM" | "HARD";

/** Язык, для которого у задачи есть стартовый код. */
export type ProgrammingTaskLanguage = "PYTHON" | "JAVASCRIPT" | "TYPESCRIPT";

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

/** API банка задач. */
export const programmingTaskApi = {
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
};

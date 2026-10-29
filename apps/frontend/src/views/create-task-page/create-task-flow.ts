import type { ProgrammingTaskLanguage } from "@/entities/programming-task";

const MIN_LANGUAGES_FOR_NEXT = 2;

/** Языки, для которых можно создать варианты задачи. */
export const TASK_LANGUAGES: ProgrammingTaskLanguage[] = ["PYTHON", "JAVASCRIPT", "TYPESCRIPT"];

/**
 * Возвращает языки, для которых вариант ещё не был успешно проверен.
 * @param {ProgrammingTaskLanguage[]} usedLanguages - Уже сохранённые языки.
 * @returns {ProgrammingTaskLanguage[]} Оставшиеся языки в порядке формы.
 */
export function getUnusedTaskLanguages(
  usedLanguages: ProgrammingTaskLanguage[],
): ProgrammingTaskLanguage[] {
  return TASK_LANGUAGES.filter((language) => !usedLanguages.includes(language));
}

/**
 * Определяет, останется ли ещё один язык после сохранения текущего варианта.
 * @param {ProgrammingTaskLanguage[]} usedLanguages - Уже сохранённые языки.
 * @returns {boolean} Нужно ли показывать кнопку перехода к следующему языку.
 */
export function canAddAnotherLanguage(usedLanguages: ProgrammingTaskLanguage[]): boolean {
  return getUnusedTaskLanguages(usedLanguages).length >= MIN_LANGUAGES_FOR_NEXT;
}

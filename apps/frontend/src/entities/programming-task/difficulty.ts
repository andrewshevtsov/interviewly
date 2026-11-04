import type { ProgrammingTaskDifficulty } from "./index";

/** Общие i18n-ключи уровней сложности во всех сценариях банка задач. */
export const PROGRAMMING_TASK_DIFFICULTY_KEYS: Record<
  ProgrammingTaskDifficulty,
  "difficultyEasy" | "difficultyMedium" | "difficultyHard"
> = {
  EASY: "difficultyEasy",
  MEDIUM: "difficultyMedium",
  HARD: "difficultyHard",
};

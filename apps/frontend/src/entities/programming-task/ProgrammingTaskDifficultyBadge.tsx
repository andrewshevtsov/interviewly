import type { ComponentProps } from "react";

import { useTranslations } from "@/shared/i18n-context";
import { cn } from "@/shared/lib/cn";
import { Badge } from "@/shared/ui/badge";
import { PROGRAMMING_TASK_DIFFICULTY_KEYS } from "./difficulty";
import type { ProgrammingTaskDifficulty } from "./index";

const DIFFICULTY_CLASSES: Record<ProgrammingTaskDifficulty, string> = {
  EASY: "border-success/30 bg-success/10 text-success",
  MEDIUM: "border-warning/30 bg-warning/10 text-warning",
  HARD: "border-destructive/30 bg-destructive/10 text-destructive",
};

/** Свойства единого бейджа сложности задачи. */
interface ProgrammingTaskDifficultyBadgeProps extends Omit<
  ComponentProps<typeof Badge>,
  "children"
> {
  /** Уровень, определяющий цвет бейджа. */
  difficulty: ProgrammingTaskDifficulty;
}

/**
 * Отображает сложность одинаково в банке задач и формах выбора задачи.
 * @param {ProgrammingTaskDifficultyBadgeProps} props - Сложность и свойства бейджа.
 * @returns {import("react").ReactNode} Локализованный бейдж сложности.
 */
export function ProgrammingTaskDifficultyBadge(props: ProgrammingTaskDifficultyBadgeProps) {
  const { difficulty, className, ...badgeProps } = props;
  const t = useTranslations("common");

  return (
    <Badge className={cn("border", DIFFICULTY_CLASSES[difficulty], className)} {...badgeProps}>
      {t(PROGRAMMING_TASK_DIFFICULTY_KEYS[difficulty])}
    </Badge>
  );
}

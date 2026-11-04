"use client";

// Слой views: каталог задач для подготовки к интервью.
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronDown, Pencil } from "lucide-react";

import {
  programmingTaskApi,
  type ProgrammingTaskDifficulty,
  type ProgrammingTaskLanguage,
} from "@/entities/programming-task";
import { ProgrammingTaskDifficultyBadge } from "@/entities/programming-task/ProgrammingTaskDifficultyBadge";
import { PROGRAMMING_TASK_DIFFICULTY_KEYS } from "@/entities/programming-task/difficulty";
import { useCurrentUser } from "@/entities/user";
import { useTranslations } from "@/shared/i18n-context";
import { cn } from "@/shared/lib/cn";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { LocalizedLink } from "@/shared/ui/localized-link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

type LanguageFilter = ProgrammingTaskLanguage | "ALL";
type DifficultyFilter = ProgrammingTaskDifficulty | "ALL";

const LANGUAGE_KEYS = {
  PYTHON: "python",
  JAVASCRIPT: "javascript",
  TYPESCRIPT: "typescript",
} as const;

/** Пункт выпадающего фильтра. */
interface FilterOption<Value extends string> {
  /** Значение фильтра. */
  value: Value;

  /** Видимая подпись. */
  label: string;
}

/** Свойства выпадающего фильтра. */
interface FilterDropdownProps<Value extends string> {
  /** Доступное имя контрола. */
  label: string;

  /** Выбранное значение. */
  value: Value;

  /** Варианты выбора. */
  options: FilterOption<Value>[];

  /** Обработчик выбора. */
  onChange: (value: Value) => void;
}

/**
 * Стилизованный фильтр на примитивах дизайн-системы.
 * @param {FilterDropdownProps<Value>} props - Подпись, пункты и текущее значение.
 * @returns {import("react").ReactNode} Кнопка с выпадающим меню.
 */
function FilterDropdown<Value extends string>(props: FilterDropdownProps<Value>) {
  const { label, value, options, onChange } = props;
  const selectedOption = options.find((option) => option.value === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          aria-label={label}
          className="h-11 w-full justify-between bg-background px-3 font-normal"
        >
          <span className="truncate">{selectedOption?.label}</span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-[var(--radix-dropdown-menu-trigger-width)]"
        aria-label={label}
      >
        {options.map((option) => {
          const isSelected = option.value === value;

          return (
            <DropdownMenuItem
              key={option.value}
              className={cn("cursor-pointer", isSelected && "text-primary")}
              onSelect={() => onChange(option.value)}
            >
              <span className="flex-1">{option.label}</span>
              {isSelected && <Check className="size-4" aria-hidden />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Полный экран банка задач с фильтрами и раскрывающимися условиями.
 * @returns {import("react").ReactNode} Страница банка задач.
 */
export function TaskBankPage() {
  const t = useTranslations("taskBank");
  const commonT = useTranslations("common");
  const profileT = useTranslations("profile");
  const [language, setLanguage] = useState<LanguageFilter>("ALL");
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("ALL");
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const currentUserQuery = useCurrentUser();
  const tasksQuery = useQuery({
    queryKey: ["programming-task-bank"],
    // eslint-disable-next-line jsdoc/require-jsdoc
    queryFn: () => programmingTaskApi.listBank(),
  });

  const filteredTasks = useMemo(() => {
    return (tasksQuery.data ?? []).filter((task) => {
      const matchesLanguage = language === "ALL" || task.languages.includes(language);
      const matchesDifficulty = difficulty === "ALL" || task.difficulty === difficulty;

      return matchesLanguage && matchesDifficulty;
    });
  }, [difficulty, language, tasksQuery.data]);
  const languageOptions: FilterOption<LanguageFilter>[] = [
    { value: "ALL", label: t("allLanguages") },
    ...Object.entries(LANGUAGE_KEYS).map(([value, key]) => ({
      value: value as ProgrammingTaskLanguage,
      label: t(key),
    })),
  ];
  const difficultyOptions: FilterOption<DifficultyFilter>[] = [
    { value: "ALL", label: t("allDifficulties") },
    ...Object.entries(PROGRAMMING_TASK_DIFFICULTY_KEYS).map(([value, key]) => ({
      value: value as ProgrammingTaskDifficulty,
      label: commonT(key),
    })),
  ];

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12 md:py-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        {currentUserQuery.data?.isAdmin && (
          <Button asChild variant="secondary" size="lg">
            <LocalizedLink href="/tasks/new">{t("createTask")}</LocalizedLink>
          </Button>
        )}
      </div>
      <p className="mt-2 text-muted-foreground">{t("description")}</p>

      <div className="mt-8 grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{profileT("stack")}</Label>
          <FilterDropdown
            label={profileT("stack")}
            value={language}
            options={languageOptions}
            onChange={setLanguage}
          />
        </div>

        <div className="space-y-2">
          <Label>{t("difficulty")}</Label>
          <FilterDropdown
            label={t("difficulty")}
            value={difficulty}
            options={difficultyOptions}
            onChange={setDifficulty}
          />
        </div>
      </div>

      {tasksQuery.isPending && <p className="mt-10 text-muted-foreground">{t("loading")}</p>}
      {tasksQuery.isError && <p className="mt-10 text-destructive">{t("loadError")}</p>}

      {tasksQuery.isSuccess && (
        <section className="mt-8" aria-live="polite">
          <p className="mb-4 text-sm text-muted-foreground">
            {filteredTasks.length} {t("taskCount")}
          </p>

          {filteredTasks.length === 0 && (
            <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
              {t("empty")}
            </p>
          )}
          {filteredTasks.length > 0 && (
            <div className="grid gap-3">
              {filteredTasks.map((task) => {
                const isExpanded = expandedTaskId === task.id;

                return (
                  <article
                    key={task.id}
                    className="overflow-hidden rounded-xl border bg-card transition-colors hover:border-primary/50"
                  >
                    <button
                      type="button"
                      className="flex w-full items-start justify-between gap-5 p-5 text-left"
                      aria-expanded={isExpanded}
                      aria-controls={`task-${task.id}`}
                      onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                    >
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-3">
                          <span className="text-lg font-semibold">{task.title}</span>
                          <ProgrammingTaskDifficultyBadge difficulty={task.difficulty} />
                        </span>
                        <span className="mt-3 flex flex-wrap gap-2">
                          {task.languages.map((taskLanguage) => (
                            <Badge
                              key={taskLanguage}
                              variant="muted"
                              className="rounded-md text-[10px] uppercase tracking-wide"
                            >
                              {t(LANGUAGE_KEYS[taskLanguage])}
                            </Badge>
                          ))}
                        </span>
                      </span>

                      <span className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
                        <span className="hidden sm:inline">
                          {t(isExpanded ? "hideDescription" : "showDescription")}
                        </span>
                        <ChevronDown
                          className={cn("h-5 w-5 transition-transform", isExpanded && "rotate-180")}
                        />
                      </span>
                    </button>

                    {isExpanded && (
                      <div
                        id={`task-${task.id}`}
                        className="border-t px-5 py-5 text-sm leading-7 text-muted-foreground"
                      >
                        <p className="whitespace-pre-wrap">{task.description}</p>
                        {currentUserQuery.data?.isAdmin && (
                          <div className="mt-4 flex justify-end">
                            <Button asChild variant="outline" size="sm">
                              <LocalizedLink href={`/tasks/${task.id}/edit`} className="gap-2">
                                <Pencil className="size-3.5" aria-hidden />
                                {t("editTask")}
                              </LocalizedLink>
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}
    </main>
  );
}

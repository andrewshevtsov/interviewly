"use client";

// Слой features: форма создания сессии — язык, задача из банка или своё условие
// и приватность. Отправляет реальный POST /sessions.
import { useEffect, useState, type ReactNode, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, ChevronDown } from "lucide-react";

import { getLocalizedHref } from "@/shared/i18n";
import { useLocale, useTranslations } from "@/shared/i18n-context";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Checkbox } from "@/shared/ui/checkbox";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import {
  sessionApi,
  type ApiSession,
  type EditorLanguage,
  type NewSessionDraft,
} from "@/entities/session";
import { programmingTaskApi } from "@/entities/programming-task";
import { ProgrammingTaskDifficultyBadge } from "@/entities/programming-task/ProgrammingTaskDifficultyBadge";

// Совпадают с ограничениями CreateSessionDto на бэкенде.
const MIN_PASSWORD_LENGTH = 4;
const MAX_TITLE_LENGTH = 120;
const MAX_TASK_LENGTH = 4000;

/** Один пункт выпадающего выбора. */
interface FormDropdownOption {
  /** Значение, сохраняемое в состоянии формы. */
  value: string;

  /** Подпись пункта для пользователя. */
  label: ReactNode;
}

/** Настройки выпадающего поля формы. */
interface FormDropdownProps {
  /** DOM id кнопки-триггера. */
  id: string;

  /** Текущее выбранное значение. */
  value: string;

  /** Текст до выбора значения. */
  placeholder: string;

  /** Доступные пункты меню. */
  options: FormDropdownOption[];

  /** Запрещает открывать меню. */
  disabled?: boolean;

  /** Доступное имя контрола. */
  ariaLabel: string;

  /** Является ли выбор обязательным. */
  required?: boolean;

  /** Вызывается при выборе пункта. */
  onChange: (value: string) => void;
}

/**
 * Выпадающий выбор на существующих Radix-примитивах дизайн-системы.
 * @param {FormDropdownProps} props - Значение, пункты и обработчик выбора.
 * @returns {import('react').ReactNode} Кнопка-триггер и выпадающее меню.
 */
function FormDropdown(props: FormDropdownProps) {
  const {
    id,
    value,
    placeholder,
    options,
    disabled = false,
    ariaLabel,
    required = false,
    onChange,
  } = props;
  const selected = options.find((option) => option.value === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          id={id}
          variant="outline"
          disabled={disabled}
          aria-label={ariaLabel}
          aria-required={required || undefined}
          className="w-full justify-between bg-background px-3 font-normal"
        >
          <span
            className={`flex min-w-0 flex-1 items-center gap-2 text-left ${
              selected ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            {selected?.label ?? placeholder}
          </span>
          <ChevronDown className="size-4 text-muted-foreground" aria-hidden />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="w-[var(--radix-dropdown-menu-trigger-width)]"
        aria-label={ariaLabel}
      >
        {options.map((option) => {
          const isSelected = option.value === value;

          return (
            <DropdownMenuItem
              key={option.value}
              className={isSelected ? "text-primary" : undefined}
              onSelect={() => onChange(option.value)}
            >
              <span className="flex min-w-0 flex-1 items-center gap-2">{option.label}</span>
              <span className="ml-auto flex size-4 shrink-0 items-center justify-center">
                {isSelected && <Check className="size-4" aria-hidden />}
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Пропсы {@link CreateSessionForm}.
 */
export interface CreateSessionFormProps {
  /**
   * Начальные значения черновика для заполнения формы.
   */
  draft: NewSessionDraft;
}

/**
 * Форма создания сессии: название, язык, задача и приватность с паролем.
 * Запуск создаёт сессию на бэкенде и открывает её комнату.
 * @param {CreateSessionFormProps} props - Пропсы формы.
 * @returns {import('react').ReactNode} Форма создания сессии.
 */
export function CreateSessionForm(props: CreateSessionFormProps) {
  const { draft } = props;
  const router = useRouter();
  const locale = useLocale();
  const [isPrivate, setIsPrivate] = useState(draft.isPrivate);
  const [password, setPassword] = useState(draft.accessCode);
  const [editorLanguage, setEditorLanguage] = useState<EditorLanguage | "">("");
  const [programmingTaskId, setProgrammingTaskId] = useState("");
  const [isCustomTask, setIsCustomTask] = useState(false);
  const t = useTranslations("newSession");

  /**
   * Загружает задачи для текущего языка редактора.
   * @returns {Promise<import('@/entities/programming-task').ProgrammingTaskListItem[]>} Доступные задачи.
   */
  function loadProgrammingTasks() {
    if (!editorLanguage) {
      return Promise.resolve([]);
    }

    return programmingTaskApi.list(editorLanguage);
  }

  const tasksQuery = useQuery({
    queryKey: ["programming-tasks", editorLanguage],
    queryFn: loadProgrammingTasks,
    enabled: editorLanguage !== "",
  });

  useEffect(() => {
    if (
      programmingTaskId &&
      tasksQuery.data &&
      !tasksQuery.data.some((task) => task.id === programmingTaskId)
    ) {
      setProgrammingTaskId("");
    }
  }, [programmingTaskId, tasksQuery.data]);

  /**
   * Открывает комнату только что созданной сессии.
   * @param {ApiSession} session - Созданная сессия.
   * @returns {void}
   */
  function openCreatedSession(session: ApiSession): void {
    router.push(getLocalizedHref(`/sessions/${session.id}`, locale));
  }

  const createMutation = useMutation({
    mutationFn: sessionApi.create,
    onSuccess: openCreatedSession,
  });
  const isPasswordTooShort = isPrivate && password.length < MIN_PASSWORD_LENGTH;
  const isLanguageMissing = editorLanguage === "";
  const isBankTaskMissing = !isCustomTask && !programmingTaskId;

  /**
   * Переключает режим своей задачи и убирает неактуальный выбор из банка.
   * @param {boolean} checked Выбран ли режим своей задачи.
   * @returns {void}
   */
  function handleCustomTaskChange(checked: boolean): void {
    setIsCustomTask(checked);
    if (checked) {
      setProgrammingTaskId("");
    }
  }

  /**
   * Создаёт сессию: закрытую паролем, если отмечена приватность, иначе открытую для заявок.
   * @param {SubmitEvent<HTMLFormElement>} event - Событие отправки формы.
   * @returns {void}
   */
  function handleSubmit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (isPasswordTooShort || isLanguageMissing || isBankTaskMissing) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") ?? "");
    const task = String(formData.get("task") ?? "");
    const access = isPrivate
      ? { access: "PASSWORD" as const, password }
      : { access: "OPEN" as const };
    const selectedTask = isCustomTask ? { task } : { programmingTaskId };
    createMutation.mutate({ title, editorLanguage, ...selectedTask, ...access });
  }

  const languageOptions: FormDropdownOption[] = [
    { value: "PYTHON", label: t("languagePython") },
    { value: "JAVASCRIPT", label: t("languageJavaScript") },
    { value: "TYPESCRIPT", label: t("languageTypeScript") },
  ];
  const taskOptions: FormDropdownOption[] =
    tasksQuery.data?.map((taskOption) => ({
      value: taskOption.id,
      label: (
        <>
          <span className="truncate">{taskOption.title}</span>
          <ProgrammingTaskDifficultyBadge
            difficulty={taskOption.difficulty}
            className="ml-auto shrink-0"
          />
        </>
      ),
    })) ?? [];

  return (
    <Card className="p-8">
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="session-title">{t("sessionTitleLabel")}</Label>
          <Input
            id="session-title"
            name="title"
            defaultValue={draft.title}
            placeholder={t("sessionTitlePlaceholder")}
            maxLength={MAX_TITLE_LENGTH}
          />
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="editor-language">{t("languageLabel")}</Label>
            <FormDropdown
              id="editor-language"
              value={editorLanguage}
              placeholder={t("languageSelectPlaceholder")}
              options={languageOptions}
              ariaLabel={t("languageLabel")}
              required
              onChange={(value) => setEditorLanguage(value as EditorLanguage)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="programming-task">{t("bankTaskLabel")}</Label>
            <FormDropdown
              id="programming-task"
              value={programmingTaskId}
              disabled={
                isCustomTask || isLanguageMissing || tasksQuery.isPending || tasksQuery.isError
              }
              placeholder={
                !isLanguageMissing && tasksQuery.isPending
                  ? t("tasksLoading")
                  : t("taskSelectPlaceholder")
              }
              options={taskOptions}
              ariaLabel={t("bankTaskLabel")}
              required={!isCustomTask}
              onChange={setProgrammingTaskId}
            />
            {tasksQuery.isError && (
              <p className="text-sm text-destructive">{t("tasksLoadError")}</p>
            )}
          </div>

          <Card className="bg-muted/30 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold">{t("customTask")}</p>
                <p className="text-sm text-muted-foreground">{t("customTaskHint")}</p>
              </div>
              <Checkbox
                checked={isCustomTask}
                onChange={(event) => handleCustomTaskChange(event.target.checked)}
                aria-label={t("customTask")}
              />
            </div>

            {isCustomTask && (
              <div className="mt-4 space-y-2">
                <Label htmlFor="session-task">{t("taskLabel")}</Label>
                <Textarea
                  id="session-task"
                  name="task"
                  rows={4}
                  placeholder={draft.task || t("taskPlaceholder")}
                  maxLength={MAX_TASK_LENGTH}
                  required
                />
                <p className="text-xs text-muted-foreground">{t("taskHint")}</p>
              </div>
            )}
          </Card>
        </div>

        <Card className="bg-muted/30 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold">{t("privateSession")}</p>
              <p className="text-sm text-muted-foreground">{t("privateSessionHint")}</p>
            </div>
            <Checkbox
              checked={isPrivate}
              onChange={(event) => setIsPrivate(event.target.checked)}
              aria-label={t("privateSession")}
            />
          </div>

          {isPrivate && (
            <>
              <Input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-label={t("privateSession")}
                className="mt-4 font-mono"
              />
              {isPasswordTooShort && (
                <p className="mt-2 text-sm text-destructive">{t("passwordTooShort")}</p>
              )}
            </>
          )}
        </Card>

        <p className="text-sm text-muted-foreground">{t("telegramNotice")}</p>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          isLoading={createMutation.isPending}
          disabled={isPasswordTooShort || isLanguageMissing || isBankTaskMissing}
        >
          {createMutation.isPending ? t("launchingSession") : t("launchSession")}
        </Button>

        {createMutation.isError && <p className="text-sm text-destructive">{t("createError")}</p>}
      </form>
    </Card>
  );
}

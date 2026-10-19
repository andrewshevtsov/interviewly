"use client";

import { useMutation } from "@tanstack/react-query";

import { useTranslations } from "@/shared/i18n-context";
import { Button } from "@/shared/ui/button";
import { executeCode, type QueuedExecution, type RunnableLanguage } from "./run-code-api";

/** Пропсы кнопки запуска текущего кода. */
export interface RunCodeButtonProps {
  /** Сессия, участие в которой проверяется перед запуском. */
  sessionId: string;

  /** Язык выполняемого кода. */
  language: RunnableLanguage;

  /** Возвращает актуальный текст редактора непосредственно в момент запуска. */
  getCode: () => string;

  /** Сообщает родителю, что backend принял запуск в очередь. */
  onQueued?: (execution: QueuedExecution) => void;

  /** Кнопка недоступна, пока совместный редактор не подключён. */
  disabled?: boolean;
}

/**
 * Передаёт актуальный код backend, который ставит запуск в очередь.
 * @param {RunCodeButtonProps} props - Язык, источник кода и доступность запуска.
 * @returns {import("react").ReactNode} Кнопка запуска и ошибка запроса.
 */
export function RunCodeButton(props: RunCodeButtonProps) {
  const { sessionId, language, getCode, onQueued, disabled = false } = props;
  const t = useTranslations("session");

  /**
   * Отправляет актуальный текст редактора в очередь через backend.
   * @returns {ReturnType<typeof executeCode>} Подтверждение постановки в очередь.
   */
  function runCode() {
    return executeCode({ sessionId, language, code: getCode() });
  }

  const runMutation = useMutation({
    mutationFn: runCode,
    onSuccess: onQueued,
  });

  /** Открывает консоль и запускает код. */
  function handleRun(): void {
    runMutation.mutate();
  }

  return (
    <div className="flex items-center gap-3">
      {runMutation.isError && <span className="text-xs text-destructive">{t("runCodeError")}</span>}
      <Button
        type="button"
        size="sm"
        disabled={disabled}
        isLoading={runMutation.isPending}
        onClick={handleRun}
      >
        {runMutation.isPending ? t("running") : t("runCode")}
      </Button>
    </div>
  );
}

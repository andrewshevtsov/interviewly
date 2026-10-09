"use client";

import { useMutation } from "@tanstack/react-query";

import { useTranslations } from "@/shared/i18n-context";
import { Button } from "@/shared/ui/button";
import {
  executeCode,
  type ExecutionResult,
  type RunnableLanguage,
} from "./run-code-api";

/** Пропсы кнопки запуска текущего кода. */
export interface RunCodeButtonProps {
  /** Сессия, участие в которой проверяется перед запуском. */
  sessionId: string;

  /** Язык выполняемого кода. */
  language: RunnableLanguage;

  /** Возвращает актуальный текст редактора непосредственно в момент запуска. */
  getCode: () => string;

  /** Кнопка недоступна, пока совместный редактор не подключён. */
  disabled?: boolean;

  /** Вызывается сразу перед отправкой запроса. */
  onRunStart: () => void;

  /** Получает успешный результат выполнения. */
  onRunSuccess: (result: ExecutionResult) => void;

  /** Сообщает об ошибке запроса. */
  onRunError: () => void;
}

/**
 * Запускает актуальный код редактора через отдельный coderunner-сервис.
 * @param {RunCodeButtonProps} props - Язык, источник кода и доступность запуска.
 * @returns {import("react").ReactNode} Кнопка запуска и ошибка запроса.
 */
export function RunCodeButton(props: RunCodeButtonProps) {
  const {
    sessionId,
    language,
    getCode,
    disabled = false,
    onRunStart,
    onRunSuccess,
    onRunError,
  } = props;
  const t = useTranslations("session");

  /**
   * Отправляет актуальный текст редактора в coderunner.
   * @returns {ReturnType<typeof executeCode>} Результат выполнения программы.
   */
  function runCode() {
    return executeCode({ sessionId, language, code: getCode() });
  }

  const runMutation = useMutation({
    mutationFn: runCode,
    onSuccess: onRunSuccess,
    onError: onRunError,
  });

  /** Открывает консоль и запускает код. */
  function handleRun(): void {
    onRunStart();
    runMutation.mutate();
  }

  return (
    <Button
      type="button"
      size="sm"
      disabled={disabled}
      isLoading={runMutation.isPending}
      onClick={handleRun}
    >
      {runMutation.isPending ? t("running") : t("runCode")}
    </Button>
  );
}

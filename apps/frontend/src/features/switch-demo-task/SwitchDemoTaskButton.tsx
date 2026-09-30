"use client";

// Слой features: интервьюер показывает в комнате следующую демо-задачу
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useTranslations } from "@/shared/i18n-context";
import { Button } from "@/shared/ui/button";
import { sessionApi, showDemoTask, type DemoTask } from "@/entities/session";

/**
 * Пропсы {@link SwitchDemoTaskButton}
 */
export interface SwitchDemoTaskButtonProps {
  /**
   * Сессия, в которой меняется задача
   */
  sessionId: string;
}

/**
 * Кнопка «новая задача»: условие и код сразу меняются у всех участников комнаты
 * @param {SwitchDemoTaskButtonProps} props - Пропсы кнопки
 * @returns {import('react').ReactNode} Кнопка и сообщение об ошибке
 */
export function SwitchDemoTaskButton(props: SwitchDemoTaskButtonProps) {
  const { sessionId } = props;
  const queryClient = useQueryClient();
  const t = useTranslations("session");

  /**
   * Просит бэкенд показать следующую задачу
   * @returns {Promise<DemoTask>} Новая задача
   */
  function nextTask() {
    return sessionApi.nextDemoTask(sessionId);
  }

  /**
   * Показывает новую задачу у интервьюера, не дожидаясь события из сокета
   * @param {DemoTask} task - Новая задача
   * @returns {void}
   */
  function showTask(task: DemoTask): void {
    showDemoTask(queryClient, sessionId, task);
  }

  const nextMutation = useMutation({ mutationFn: nextTask, onSuccess: showTask });

  return (
    <span className="flex items-center gap-2">
      {nextMutation.isError && <span className="text-destructive">{t("demoTaskError")}</span>}
      <Button
        size="sm"
        variant="outline"
        className="uppercase tracking-wide"
        isLoading={nextMutation.isPending}
        onClick={() => nextMutation.mutate()}
      >
        {t("nextDemoTask")}
      </Button>
    </span>
  );
}

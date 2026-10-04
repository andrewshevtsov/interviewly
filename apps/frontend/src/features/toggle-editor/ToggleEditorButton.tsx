"use client";

// Слой features: интервьюер открывает редактор кода (переход к лайв-кодингу) или закрывает его
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useTranslations } from "@/shared/i18n-context";
import { Button } from "@/shared/ui/button";
import { applyEditorOpen, sessionApi } from "@/entities/session";

/**
 * Пропсы {@link ToggleEditorButton}
 */
export interface ToggleEditorButtonProps {
  /**
   * id сессии
   */
  sessionId: string;

  /**
   * Редактор открыт/закрыт
   */
  editorOpen: boolean;
}

/**
 * Кнопка «открыть/закрыть редактор»: режим комнаты меняется сразу у всех участников
 * @param {ToggleEditorButtonProps} props - Пропсы кнопки
 * @returns {import('react').ReactNode} Кнопка и сообщение об ошибке
 */
export function ToggleEditorButton(props: ToggleEditorButtonProps) {
  const { sessionId, editorOpen } = props;
  const queryClient = useQueryClient();
  const t = useTranslations("session");

  /**
   * Просит бэкенд переключить редактор
   * @returns {Promise<boolean>} Новое состояние редактора
   */
  function toggle() {
    return sessionApi.setEditorOpen(sessionId, !editorOpen);
  }

  /**
   * Переключает режим у интервьюера, не дожидаясь события из сокета
   * @param {boolean} open - Новое состояние редактора
   * @returns {Promise<void>} Завершается, когда кэш обновлён
   */
  function applyResult(open: boolean) {
    return applyEditorOpen(queryClient, sessionId, open);
  }

  const toggleMutation = useMutation({ mutationFn: toggle, onSuccess: applyResult });

  return (
    <span className="flex items-center gap-2">
      {toggleMutation.isError && <span className="text-sm text-destructive">{t("toggleEditorError")}</span>}
      <Button
        type="button"
        variant={editorOpen ? "outline" : "default"}
        isLoading={toggleMutation.isPending}
        onClick={() => toggleMutation.mutate()}
      >
        {editorOpen ? t("closeEditor") : t("openEditor")}
      </Button>
    </span>
  );
}

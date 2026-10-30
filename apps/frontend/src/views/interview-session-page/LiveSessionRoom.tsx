"use client";

// Слой views: живая комната - получает LiveKit-токен и подключается к SFU. Всё внутри
// <LiveKitRoom> видит комнату через контекст; уход со страницы отключает от неё
import { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LiveKitRoom, RoomAudioRenderer } from "@livekit/components-react";
import { ConnectionError, DisconnectReason } from "livekit-client";

import { SessionCodeEditor } from "@/widgets/session-code-editor";
import { SessionHeader } from "@/widgets/session-header";
import { SessionVideoPanels } from "@/widgets/session-video-panels";
import { sessionApi, useEditorOpenSync } from "@/entities/session";
import { useTranslations } from "@/shared/i18n-context";
import { cn } from "@/shared/lib/cn";
import { FLIP_DURATION_MS } from "@/shared/lib/use-flip";
import { SessionEndedNotice } from "./SessionEndedNotice";

const EDITOR_LANGUAGES = {
  PYTHON: "python",
  JAVASCRIPT: "javascript",
  TYPESCRIPT: "typescript",
} as const;

/**
 * Пропсы {@link LiveSessionRoom}.
 */
export interface LiveSessionRoomProps {
  /**
   * Сессия для подключения; входящий уже должен быть её участником
   */
  sessionId: string;

  /**
   * Владеет ли входящий сессией (видит заявки)
   */
  isOwner: boolean;

  /**
   * UUID текущего пользователя
   */
  currentUserId: string;

  /**
   * Имя текущего пользователя для журнала запусков кода
   */
  currentUserName: string;

  /**
   * AI-подсказки запрашивает только кандидат
   */
  isCandidate: boolean;

  /**
   * Интервью идёт: сессия в статусе ACTIVE
   */
  isActive: boolean;

  /**
   * Лайвкодинг режим
   */
  editorOpen: boolean;
}

/**
 * Пропсы {@link RoomWorkspace}.
 */
interface RoomWorkspaceProps extends LiveSessionRoomProps {
  /**
   * Не удалось включить камеру или микрофон (нет устройства или разрешения)
   */
  mediaUnavailable: boolean;
}

/**
 * Содержимое комнаты
 * @param {RoomWorkspaceProps} props - Сессия, роль участника, режим комнаты и состояние медиа
 * @returns {import('react').ReactNode} Шапка, видео и редактор кода
 */
function RoomWorkspace(props: RoomWorkspaceProps) {
  const {
    sessionId,
    isOwner,
    currentUserId,
    currentUserName,
    isCandidate,
    isActive,
    editorOpen,
    mediaUnavailable,
  } = props;
  const t = useTranslations("session");
  useEditorOpenSync(sessionId);

  /**
   * Загружает настройки текущей сессии.
   * @returns {ReturnType<typeof sessionApi.get>} Сессия без списка участников.
   */
  function getSession() {
    return sessionApi.get(sessionId);
  }

  const sessionQuery = useQuery({
    queryKey: ["sessions", sessionId],
    queryFn: getSession,
  });
  const editorLanguage = sessionQuery.data
    ? EDITOR_LANGUAGES[sessionQuery.data.editorLanguage]
    : "typescript";

  return (
    <>
      <SessionHeader
        sessionId={sessionId}
        isOwner={isOwner}
        isInterviewer={!isCandidate}
        editorOpen={editorOpen}
      />
      {mediaUnavailable && (
        <p className="border-b border-border px-6 py-2 text-sm text-muted-foreground">
          {t("mediaUnavailable")}
        </p>
      )}

      <div className="relative flex flex-1 overflow-hidden">
        <SessionVideoPanels
          sessionId={sessionId}
          isOwner={isOwner}
          currentUserId={currentUserId}
          isCandidate={isCandidate}
          isActive={isActive}
          editorOpen={editorOpen}
        />
        <div
          inert={!editorOpen}
          style={{ transitionDuration: `${FLIP_DURATION_MS}ms` }}
          className={cn(
            "absolute inset-y-0 left-0 right-0 flex p-4 transition-transform ease-in-out md:left-80",
            "motion-reduce:transition-none",
            editorOpen ? "translate-x-0" : "translate-x-full",
          )}
        >
          <SessionCodeEditor
            sessionId={sessionId}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            language={editorLanguage}
          />
        </div>
      </div>

      <RoomAudioRenderer />
    </>
  );
}

/**
 * Получает LiveKit-токен участника и подключается к комнате сессии с включёнными камерой
 * и микрофоном
 * @param {LiveSessionRoomProps} props - Сессия и владеет ли ею входящий
 * @returns {import('react').ReactNode} Живая комната или сообщение о статусе
 */
export function LiveSessionRoom(props: LiveSessionRoomProps) {
  const { sessionId } = props;
  const [connectionFailed, setConnectionFailed] = useState(false);
  const [mediaUnavailable, setMediaUnavailable] = useState(false);
  const [roomDeleted, setRoomDeleted] = useState(false);
  const queryClient = useQueryClient();
  const t = useTranslations("session");

  /**
   * LiveKitRoom сообщает сюда и об ошибках подключения, и об ошибках захвата камеры/микрофона;
   * сессию обрывают только первые - без камеры пользователь остаётся в комнате.
   * Колбэк стабилен: LiveKitRoom переподключается при смене `onError`, это обрывает
   * идущую попытку и приводит к ложной ошибке "Client initiated disconnect".
   * @param {Error} error - Ошибка LiveKit (подключение или захват медиа).
   * @returns {void}
   */
  const handleRoomError = useCallback((error: Error): void => {
    if (error instanceof ConnectionError) {
      setConnectionFailed(true);
    } else {
      setMediaUnavailable(true);
    }
  }, []);

  /**
   * Владелец завершил сессию и закрыл комнату: вместо отключённой комнаты показываем
   * "интервью завершено" и перечитываем состояние, чтобы шлюз сразу увёл на экран фидбека.
   * Стабилен по той же причине, что и {@link handleRoomError}.
   * @param {DisconnectReason} [reason] - Причина отключения от комнаты.
   * @returns {void}
   */
  const handleDisconnected = useCallback(
    (reason?: DisconnectReason): void => {
      if (reason === DisconnectReason.ROOM_DELETED) {
        setRoomDeleted(true);
        void queryClient.invalidateQueries({ queryKey: ["sessions", sessionId, "me"] });
      }
    },
    [queryClient, sessionId],
  );

  /**
   * Выпускает LiveKit-токен для этой сессии
   * @returns {ReturnType<typeof sessionApi.getLivekitToken>} URL сервера, комната и токен
   */
  function getToken() {
    return sessionApi.getLivekitToken(sessionId);
  }

  // Токен живёт 2 часа, а его выдача выкидывает кандидата из других комнат
  const tokenQuery = useQuery({
    queryKey: ["sessions", sessionId, "livekit-token"],
    queryFn: getToken,
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  if (roomDeleted) {
    return <SessionEndedNotice />;
  }

  if (tokenQuery.isError || connectionFailed) {
    return <p className="p-6 text-center text-muted-foreground">{t("connectionError")}</p>;
  }

  if (tokenQuery.isPending) {
    return <p className="p-6 text-center text-muted-foreground">{t("connecting")}</p>;
  }

  return (
    <LiveKitRoom
      serverUrl={tokenQuery.data.serverUrl}
      token={tokenQuery.data.token}
      connect
      video
      audio
      onError={handleRoomError}
      onDisconnected={handleDisconnected}
      className="flex h-screen flex-col"
    >
      <RoomWorkspace {...props} mediaUnavailable={mediaUnavailable} />
    </LiveKitRoom>
  );
}

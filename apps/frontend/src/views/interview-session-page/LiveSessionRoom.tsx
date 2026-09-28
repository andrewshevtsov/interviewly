"use client";

// Слой views: живая комната - получает LiveKit-токен и подключается к SFU. Всё внутри
// <LiveKitRoom> видит комнату через контекст; уход со страницы отключает от неё
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LiveKitRoom, RoomAudioRenderer, useParticipants } from "@livekit/components-react";
import { ConnectionError, DisconnectReason } from "livekit-client";

import { SessionCodeEditor } from "@/widgets/session-code-editor";
import { SessionHeader } from "@/widgets/session-header";
import { SessionVideoPanels } from "@/widgets/session-video-panels";
import { sessionApi } from "@/entities/session";
import { useTranslations } from "@/shared/i18n-context";
import { SessionEndedNotice } from "./SessionEndedNotice";

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
 * Содержимое комнаты; живёт внутри <LiveKitRoom>, чтобы считать подключённых участников
 * @param {RoomWorkspaceProps} props - Сессия, владеет ли ею входящий и состояние медиа
 * @returns {import('react').ReactNode} Шапка, боковая панель с видео и редактор кода
 */
function RoomWorkspace(props: RoomWorkspaceProps) {
  const { sessionId, isOwner, currentUserId, mediaUnavailable } = props;
  const participants = useParticipants();
  const t = useTranslations("session");

  return (
    <>
      <SessionHeader sessionId={sessionId} isOwner={isOwner} />
      {mediaUnavailable && (
        <p className="border-b border-border px-6 py-2 text-sm text-muted-foreground">{t("mediaUnavailable")}</p>
      )}

      <div className="flex flex-1 overflow-hidden">
        <SessionVideoPanels sessionId={sessionId} isOwner={isOwner} currentUserId={currentUserId} />
        <div className="flex flex-1 p-4">
          <SessionCodeEditor participantsCount={participants.length} />
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
   * @param {Error} error
   * @returns {void}
   */
  function handleRoomError(error: Error): void {
    if (error instanceof ConnectionError) {
      setConnectionFailed(true);
    } else {
      setMediaUnavailable(true);
    }
  }

  /**
   * Владелец завершил сессию и закрыл комнату: вместо отключённой комнаты показываем
   * "интервью завершено" и перечитываем состояние, чтобы шлюз сразу увёл на экран фидбека.
   * @param {DisconnectReason} [reason] - Причина отключения от комнаты.
   * @returns {void}
   */
  function handleDisconnected(reason?: DisconnectReason): void {
    if (reason === DisconnectReason.ROOM_DELETED) {
      setRoomDeleted(true);
      void queryClient.invalidateQueries({ queryKey: ["sessions", sessionId, "me"] });
    }
  }

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

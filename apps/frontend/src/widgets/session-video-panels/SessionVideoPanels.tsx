"use client";

// Слой widgets: видеопотоки участников "Открытой сессии" (LiveKit), кнопки микрофона и камеры,
// кнопка AI-подсказки и заявки на вход (у владельца). Рендерится внутри <LiveKitRoom>.
import { useState } from "react";
import {
  isTrackReference,
  TrackToggle,
  useTracks,
  VideoTrack,
  type TrackReferenceOrPlaceholder,
} from "@livekit/components-react";
import { Track } from "livekit-client";

import { useTranslations } from "@/shared/i18n-context";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { hintsRemaining } from "@/features/join-session";
import { AccessRequestsPanel } from "@/features/manage-access-requests";
import { TransferOwnershipPanel } from "@/features/transfer-ownership";
import { toParticipantRole, type ApiSessionRole, type SessionParticipantRole } from "@/entities/session";
import { MAX_AI_HINTS_PER_SESSION } from "@/shared/config/constants";

const HINT_INCREMENT = 1;
// Интервью - это интервьюер и кандидат; пока в комнате меньше, показываем "ждём участника".
const EXPECTED_PARTICIPANTS = 2;

const VIDEO_LABEL_KEYS: Record<SessionParticipantRole, "interviewerVideo" | "candidateVideo"> = {
  interviewer: "interviewerVideo",
  candidate: "candidateVideo",
};

const ROLE_LABEL_KEYS: Record<SessionParticipantRole, "interviewer" | "candidate"> = {
  interviewer: "interviewer",
  candidate: "candidate",
};

const API_ROLES: readonly unknown[] = ["INTERVIEWER", "CANDIDATE"] satisfies ApiSessionRole[];

/**
 * Проверяет, что значение - одна из ролей участника на бэкенде.
 * @param {unknown} value - Проверяемое значение.
 * @returns {boolean} `true`, если `value` - {@link ApiSessionRole}.
 */
function isApiSessionRole(value: unknown): value is ApiSessionRole {
  return API_ROLES.includes(value);
}

/**
 * Читает роль участника из метаданных, которые бэкенд кладёт в LiveKit-токен
 * (`{ "role": "INTERVIEWER" | "CANDIDATE", ... }`).
 * @param {string | undefined} metadata - Сырые метаданные участника.
 * @returns {SessionParticipantRole | null} Роль для интерфейса или `null`, если в метаданных её нет.
 */
function readRole(metadata: string | undefined): SessionParticipantRole | null {
  try {
    const role: unknown = JSON.parse(metadata ?? "{}").role;

    return isApiSessionRole(role) ? toParticipantRole(role) : null;
  } catch {
    return null;
  }
}

/**
 * Пропсы {@link VideoPanel}.
 */
interface VideoPanelProps {
  /**
   * Трек камеры участника или заглушка, пока камера выключена.
   */
  trackRef: TrackReferenceOrPlaceholder;
}

/**
 * Камера одного участника с подписью имени и роли; пока камера выключена - текстовая заглушка.
 * @param {VideoPanelProps} props - Трек камеры участника.
 * @returns {import('react').ReactNode} Панель с видео.
 */
function VideoPanel(props: VideoPanelProps) {
  const { trackRef } = props;
  const { participant } = trackRef;
  const role = readRole(participant.metadata);
  const t = useTranslations("session");
  const hasVideo = isTrackReference(trackRef) && !trackRef.publication.isMuted;

  return (
    <Card
      className={
        "relative flex h-40 items-center justify-center overflow-hidden bg-muted/40 text-xs tracking-wide " +
        "text-muted-foreground"
      }
    >
      {hasVideo && <VideoTrack trackRef={trackRef} className="h-full w-full object-cover" />}
      {!hasVideo && role && t(VIDEO_LABEL_KEYS[role])}
      <span className="absolute bottom-2 left-2 rounded-md bg-background/80 px-2 py-1 text-xs text-foreground">
        {participant.name || participant.identity}
        {participant.isLocal && ` (${t("you")})`}
        {role && ` · ${t(ROLE_LABEL_KEYS[role])}`}
      </span>
    </Card>
  );
}

/**
 * Пропсы {@link SessionVideoPanels}
 */
export interface SessionVideoPanelsProps {
  /**
   * Сессия, показанная в комнате
   */
  sessionId: string;

  /**
   * Владеет ли сессией
   */
  isOwner: boolean;

  /**
   * UUID текущего пользователя
   */
  currentUserId: string;
}

/**
 * Боковая панель экрана "Открытая сессия": по панели на участника, переключатели микрофона
 * и камеры, кнопка "Подсказка ИИ", а у владельца - заявки на вход и передача владения.
 * @param {SessionVideoPanelsProps} props - Пропсы боковой панели.
 * @returns {import('react').ReactNode} Боковая панель с видео.
 */
export function SessionVideoPanels(props: SessionVideoPanelsProps) {
  const { sessionId, isOwner, currentUserId } = props;
  const cameraTracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }]);
  const [usedHints, setUsedHints] = useState(0);
  const remaining = hintsRemaining(usedHints);
  const t = useTranslations("session");

  return (
    <aside className="flex w-full flex-col gap-4 overflow-y-auto border-r border-border p-4 md:w-80">
      {cameraTracks.map((trackRef) => (
        <VideoPanel key={trackRef.participant.identity} trackRef={trackRef} />
      ))}

      {cameraTracks.length < EXPECTED_PARTICIPANTS && (
        <p className="text-sm text-muted-foreground">{t("waitingForParticipants")}</p>
      )}

      <div className="flex gap-2">
        <TrackToggle source={Track.Source.Microphone} className="flex-1 rounded-md border border-border p-2" />
        <TrackToggle source={Track.Source.Camera} className="flex-1 rounded-md border border-border p-2" />
      </div>

      <Button
        type="button"
        variant="outline"
        className="uppercase tracking-wide"
        disabled={remaining === 0}
        onClick={() =>
          setUsedHints((count) => Math.min(MAX_AI_HINTS_PER_SESSION, count + HINT_INCREMENT))
        }
      >
        {t("aiHint")} ({remaining}/{MAX_AI_HINTS_PER_SESSION})
      </Button>

      {isOwner && (
        <>
          <AccessRequestsPanel sessionId={sessionId} />
          <TransferOwnershipPanel sessionId={sessionId} currentUserId={currentUserId} />
        </>
      )}
    </aside>
  );
}

"use client";

// Слой widgets: видеопотоки участников "Открытой сессии" (LiveKit), кнопки микрофона и камеры,
// AI-подсказки и заявки на вход.
import { useRef } from "react";
import {
  isTrackReference,
  TrackToggle,
  useTracks,
  VideoTrack,
  type TrackReferenceOrPlaceholder,
} from "@livekit/components-react";
import { Track } from "livekit-client";

import { useTranslations } from "@/shared/i18n-context";
import { Card } from "@/shared/ui/card";
import { AccessRequestsPanel } from "@/features/manage-access-requests";
import { TransferOwnershipPanel } from "@/features/transfer-ownership";
import { AiHintsPanel } from "@/features/request-ai-hint";
import { cn } from "@/shared/lib/cn";
import { useFlip } from "@/shared/lib/use-flip";
import { toParticipantRole, type ApiSessionRole, type SessionParticipantRole } from "@/entities/session";

const EXPECTED_PARTICIPANTS = 2;
const SINGLE_PARTICIPANT = 1;

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
 * Раскладка видео
 */
type VideoLayout = "stage" | "sidebar";

const VIDEO_PANEL_SIZES: Record<VideoLayout, string> = {
  stage: "aspect-video w-full",
  sidebar: "h-40 w-full",
};

/**
 * Пропсы {@link VideoPanel}.
 */
interface VideoPanelProps {
  /**
   * Трек камеры участника или заглушка, пока камера выключена.
   */
  trackRef: TrackReferenceOrPlaceholder;

  /**
   * Раскладка, задающая размер панели.
   */
  layout: VideoLayout;
}

/**
 * Камера одного участника с подписью имени и роли; пока камера выключена - текстовая заглушка.
 * @param {VideoPanelProps} props - Трек камеры участника и раскладка.
 * @returns {import('react').ReactNode} Панель с видео.
 */
function VideoPanel(props: VideoPanelProps) {
  const { trackRef, layout } = props;
  const { participant } = trackRef;
  const role = readRole(participant.metadata);
  const t = useTranslations("session");
  const hasVideo = isTrackReference(trackRef) && !trackRef.publication.isMuted;

  return (
    <Card
      data-flip-id={`video-${participant.identity}`}
      data-flip-scale
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-muted/40 text-xs tracking-wide",
        "text-muted-foreground",
        VIDEO_PANEL_SIZES[layout],
      )}
    >
      {hasVideo && <VideoTrack trackRef={trackRef} className="h-full w-full object-cover" />}
      {!hasVideo && role && <span data-flip-counter>{t(VIDEO_LABEL_KEYS[role])}</span>}
      <span
        data-flip-counter
        className="absolute bottom-2 left-2 origin-bottom-left rounded-md bg-background/80 px-2 py-1 text-xs text-foreground"
      >
        {participant.name || participant.identity}
        {participant.isLocal && ` (${t("you")})`}
        {role && ` · ${t(ROLE_LABEL_KEYS[role])}`}
      </span>
    </Card>
  );
}

/**
 * Пропсы {@link ParticipantVideos}.
 */
interface ParticipantVideosProps {
  /**
   * Раскладка видео.
   */
  layout: VideoLayout;
}

/**
 * Камеры всех участников и текст "ждём участника"
 * @param {ParticipantVideosProps} props - Раскладка видео.
 * @returns {import('react').ReactNode} Панели с видео.
 */
function ParticipantVideos(props: ParticipantVideosProps) {
  const { layout } = props;
  const cameraTracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }]);
  const t = useTranslations("session");
  const isStage = layout === "stage";

  return (
    <>
      <div
        className={cn(
          "w-full gap-4",
          isStage ? "grid" : "flex flex-col",
          isStage && (cameraTracks.length > SINGLE_PARTICIPANT ? "max-w-6xl md:grid-cols-2" : "max-w-3xl"),
        )}
      >
        {cameraTracks.map((trackRef) => (
          <VideoPanel key={trackRef.participant.identity} trackRef={trackRef} layout={layout} />
        ))}
      </div>
      {cameraTracks.length < EXPECTED_PARTICIPANTS && (
        <p data-flip-id="waiting" className="text-sm text-muted-foreground">{t("waitingForParticipants")}</p>
      )}
    </>
  );
}

/**
 * Переключатели микрофона и камеры.
 * @returns {import('react').ReactNode} Кнопки медиа.
 */
function MediaControls() {
  return (
    <div className="flex w-full gap-2">
      <TrackToggle source={Track.Source.Microphone} className="flex-1 rounded-md border border-border p-2" />
      <TrackToggle source={Track.Source.Camera} className="flex-1 rounded-md border border-border p-2" />
    </div>
  );
}

/**
 * Пропсы {@link OwnerPanels}.
 */
interface OwnerPanelsProps {
  /**
   * Сессия, показанная в комнате.
   */
  sessionId: string;

  /**
   * UUID текущего пользователя.
   */
  currentUserId: string;
}

/**
 * Панели владельца: заявки на вход и передача владения.
 * @param {OwnerPanelsProps} props - Сессия и текущий пользователь.
 * @returns {import('react').ReactNode} Панели владельца.
 */
function OwnerPanels(props: OwnerPanelsProps) {
  const { sessionId, currentUserId } = props;

  return (
    <>
      <AccessRequestsPanel sessionId={sessionId} />
      <TransferOwnershipPanel sessionId={sessionId} currentUserId={currentUserId} />
    </>
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

  /**
   * Текущий пользователь кандидат
   */
  isCandidate: boolean;

  /**
   * Интервью идёт: сессия в статусе ACTIVE
   */
  isActive: boolean;

  /**
   * Редактор открыт
   */
  editorOpen: boolean;
}

/**
 * Видео участников, переключатели микрофона и камеры, у владельца - заявки на вход и передача прав
 * @param {SessionVideoPanelsProps} props - Пропсы панели.
 * @returns {import('react').ReactNode} Панель с видео.
 */
export function SessionVideoPanels(props: SessionVideoPanelsProps) {
  const { sessionId, isOwner, currentUserId, isCandidate, isActive, editorOpen } = props;
  const containerRef = useRef<HTMLElement>(null);
  useFlip(containerRef, editorOpen);

  return (
    <section
      ref={containerRef}
      className={cn(
        "relative z-10 flex w-full overflow-y-auto",
        editorOpen ? "border-r border-border p-4 md:w-80" : "p-6",
      )}
    >
      <div className={cn("flex w-full flex-col gap-4", !editorOpen && "m-auto items-center")}>
        <ParticipantVideos layout={editorOpen ? "sidebar" : "stage"} />

        <div data-flip-id="media" className={cn("w-full", !editorOpen && "max-w-sm")}>
          <MediaControls />
        </div>

        {editorOpen && (
          <div data-flip-id="ai-hints">
            <AiHintsPanel sessionId={sessionId} isCandidate={isCandidate} isActive={isActive} />
          </div>
        )}

        {isOwner && (
          <div data-flip-id="owner" className={cn("flex w-full flex-col gap-4", !editorOpen && "max-w-3xl")}>
            <OwnerPanels sessionId={sessionId} currentUserId={currentUserId} />
          </div>
        )}
      </div>
    </section>
  );
}

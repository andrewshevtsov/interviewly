"use client";

// Слой widgets: видеопотоки участников "Открытой сессии" и кнопка AI-подсказки.
import { useState } from "react";

import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { hintsRemaining } from "@/features/join-session";
import type { SessionParticipant, SessionParticipantRole } from "@/entities/session";
import { MAX_AI_HINTS_PER_SESSION } from "@/shared/config/constants";

const HINT_INCREMENT = 1;

const ROLE_LABELS: Record<SessionParticipantRole, string> = {
  candidate: "Кандидат",
  interviewer: "Интервьюер",
};

/**
 * Props for {@link VideoPanel}.
 */
interface VideoPanelProps {
  /**
   * Participant shown in this panel.
   */
  participant: SessionParticipant;
}

/**
 * Placeholder video panel with a name/role tag.
 * @param {VideoPanelProps} props - The participant shown in the panel.
 * @returns {import('react').ReactNode} The video panel.
 */
function VideoPanel(props: VideoPanelProps) {
  const { participant } = props;

  return (
    <Card className="relative flex h-40 items-center justify-center bg-muted/40 text-xs tracking-wide text-muted-foreground">
      Видеопоток
      <span className="absolute bottom-2 left-2 rounded-md bg-background/80 px-2 py-1 text-xs text-foreground">
        {participant.name} ({ROLE_LABELS[participant.role]})
      </span>
    </Card>
  );
}

/**
 * Props for {@link SessionVideoPanels}.
 */
export interface SessionVideoPanelsProps {
  /**
   * Participants to show, e.g. the interviewer and the current user.
   */
  participants: SessionParticipant[];
}

/**
 * Video panels sidebar for the "Открытая сессия" screen: one panel per participant and the
 * "Подсказка ИИ" button.
 * @param {SessionVideoPanelsProps} props - Props for the sidebar.
 * @returns {import('react').ReactNode} The video panels sidebar.
 */
export function SessionVideoPanels(props: SessionVideoPanelsProps) {
  const { participants } = props;
  const [usedHints, setUsedHints] = useState(0);
  const remaining = hintsRemaining(usedHints);

  return (
    <aside className="flex w-full flex-col gap-4 border-r border-border p-4 md:w-80">
      {participants.map((participant) => (
        <VideoPanel key={participant.name} participant={participant} />
      ))}

      <Button
        type="button"
        variant="outline"
        className="uppercase tracking-wide"
        disabled={remaining === 0}
        onClick={() =>
          setUsedHints((count) => Math.min(MAX_AI_HINTS_PER_SESSION, count + HINT_INCREMENT))
        }
      >
        Подсказка ИИ ({remaining}/{MAX_AI_HINTS_PER_SESSION})
      </Button>
    </aside>
  );
}

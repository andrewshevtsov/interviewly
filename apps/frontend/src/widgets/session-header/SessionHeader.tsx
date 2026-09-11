"use client";

// Слой widgets: верхняя панель "Открытой сессии" - бренд, номер сессии, таймер записи.
import { useEffect, useState } from "react";
import Link from "next/link";

import { Button } from "@/shared/ui/button";

const TIMER_TICK_MS = 1000;
const SECONDS_PER_TICK = 1;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const TIME_UNIT_DIGITS = 2;

/**
 * Formats a duration in seconds as "HH:MM:SS".
 * @param {number} totalSeconds - Elapsed time in seconds.
 * @returns {string} The formatted duration.
 */
function formatElapsed(totalSeconds: number): string {
  const secondsPerHour = SECONDS_PER_MINUTE * MINUTES_PER_HOUR;
  const hours = Math.floor(totalSeconds / secondsPerHour);
  const minutes = Math.floor((totalSeconds % secondsPerHour) / SECONDS_PER_MINUTE);
  const seconds = totalSeconds % SECONDS_PER_MINUTE;

  return [hours, minutes, seconds]
    .map((unit) => unit.toString().padStart(TIME_UNIT_DIGITS, "0"))
    .join(":");
}

/**
 * Props for {@link SessionHeader}.
 */
export interface SessionHeaderProps {
  /**
   * ID of the session being displayed, used to link to its feedback screen.
   */
  sessionId: string;

  /**
   * Short display code for the session, e.g. "4092" (shown as "#4092").
   */
  sessionNumber: string;

  /**
   * Access code required to join the session.
   */
  accessCode: string;
}

/**
 * Top bar for the "Открытая сессия" screen: brand mark, session number/code, a live recording
 * timer and the "Завершить" action.
 * @param {SessionHeaderProps} props - Props for the header.
 * @returns {import('react').ReactNode} The session header.
 */
export function SessionHeader(props: SessionHeaderProps) {
  const { sessionId, sessionNumber, accessCode } = props;
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(
      () => setElapsedSeconds((seconds) => seconds + SECONDS_PER_TICK),
      TIMER_TICK_MS,
    );

    return () => clearInterval(timer);
  }, []);

  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-3">
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            I
          </span>
          Interviewly
        </Link>
        <span className="text-sm text-muted-foreground">
          Сессия #{sessionNumber} · <span className="font-mono">{accessCode}</span>
        </span>
      </div>

      <div className="flex items-center gap-4">
        <span className="flex items-center gap-2 font-mono text-sm text-destructive">
          <span className="h-2 w-2 animate-pulse rounded-full bg-destructive" />
          Запись {formatElapsed(elapsedSeconds)}
        </span>
        <Button
          asChild
          variant="outline"
          className="border-destructive/40 text-destructive hover:bg-destructive/10"
        >
          <Link href={`/sessions/${sessionId}/feedback`}>Завершить</Link>
        </Button>
      </div>
    </header>
  );
}

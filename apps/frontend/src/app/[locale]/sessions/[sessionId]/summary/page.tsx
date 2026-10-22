import { notFound } from "next/navigation";

import { SessionSummaryPage } from "@/views/session-summary-page";
import { isValidSessionId } from "@/entities/session";
import { DEMO_SESSION_PLACEHOLDER } from "@/app/demo-session-details";

/**
 * Пропсы локализованного роута экрана прошедшего интервью.
 */
export interface SessionSummaryRouteProps {
  /**
   * Динамические параметры роута Next.js, разрешаются асинхронно.
   */
  params: Promise<{
    /**
     * ID сессии, полученный из сегмента URL.
     */
    sessionId: string;
    /** Локаль, полученная из родительского сегмента URL. */
    locale: string;
  }>;
}

/**
 * Роут "/sessions/[sessionId]/summary" - прошедшее интервью: данные бэкенда запрашиваются на
 * клиенте. Секции, которых на бэке ещё нет заблюрены
 * @param {SessionSummaryRouteProps} props - пропсы роута Next.js с динамическими параметрами
 * @returns {Promise<import('react').ReactNode>} Экран прошедшего интервью
 */
export default async function Page(props: SessionSummaryRouteProps) {
  const { sessionId } = await props.params;
  if (!isValidSessionId(sessionId)) {
    notFound();
  }

  return <SessionSummaryPage sessionId={sessionId} placeholder={DEMO_SESSION_PLACEHOLDER} />;
}

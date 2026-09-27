import { notFound } from "next/navigation";

import { SessionSummaryPage } from "@/views/session-summary-page";
import { DEMO_PAST_SESSIONS } from "@/app/demo-session-details";

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
 * Роут "/sessions/[sessionId]/summary" - вся информация о прошедшем интервью. Само интервью -
 * мок-данные, показанные с точки зрения текущего пользователя; с бэка запрашивается только блок отзыва.
 * @param {SessionSummaryRouteProps} props - пропсы роута Next.js с динамическими параметрами.
 * @returns {Promise<import('react').ReactNode>} Экран прошедшего интервью.
 */
export default async function Page(props: SessionSummaryRouteProps) {
  const { sessionId } = await props.params;
  const session = DEMO_PAST_SESSIONS.find((entry) => entry.id === sessionId);

  if (!session) {
    notFound();
  }

  return <SessionSummaryPage session={session} />;
}

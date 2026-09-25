import { InterviewSessionPage } from "@/views/interview-session-page";

/**
 * Пропсы локализованного динамического роута сессии.
 */
export interface SessionPageProps {
  /**
   * Динамические параметры роута Next.js, разрешаются асинхронно.
   */
  params: Promise<{
    /**
     * ID сессии из сегмента URL.
     */
    sessionId: string;
    /** Локаль из родительского сегмента URL. */
    locale: string;
  }>;
}

/**
 * Локализованный роут, который рендерит страницу сессии интервью.
 * @param {SessionPageProps} props - Пропсы роута Next.js с динамическими параметрами.
 * @returns {Promise<import('react').ReactNode>} Страница сессии интервью.
 */
export default async function Page(props: SessionPageProps) {
  const params = await props.params;

  return <InterviewSessionPage sessionId={params.sessionId} />;
}

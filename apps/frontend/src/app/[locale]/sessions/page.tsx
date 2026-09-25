import { SessionsListPage } from "@/views/sessions-list-page";
import { DEMO_SESSION_PLACEHOLDER } from "@/app/demo-session-details";

/**
 * Роут "/sessions" - рендерит экран "История" с завершёнными интервью пользователя
 * @returns {import('react').ReactNode} Страница истории интервью
 */
export default function Page() {
  return <SessionsListPage placeholder={DEMO_SESSION_PLACEHOLDER} />;
}

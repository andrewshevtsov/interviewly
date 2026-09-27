import { SessionsListPage } from "@/views/sessions-list-page";
import { DEMO_PAST_SESSIONS } from "@/app/demo-session-details";

/**
 * Роут "/sessions" - рендерит экран "История"; каждый пользователь видит свои мок-интервью.
 * @returns {import('react').ReactNode} Страница истории интервью.
 */
export default function Page() {
  return <SessionsListPage sessions={DEMO_PAST_SESSIONS} />;
}

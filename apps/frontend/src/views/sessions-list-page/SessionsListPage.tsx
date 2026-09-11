// Слой views: список сессий со ссылками на детальную страницу каждой.
// Разрешено импортировать widgets, features, entities, shared.
import type { InterviewSession } from "@/entities/session";
import { getServerTranslations } from "@/shared/i18n-server";
import { LocalizedLink } from "@/shared/ui/localized-link";

const STATUS_MESSAGE_KEYS: Record<
  InterviewSession["status"],
  "scheduled" | "active" | "completed"
> = {
  scheduled: "scheduled",
  active: "active",
  completed: "completed",
};

/**
 * Props for {@link SessionsListPage}.
 */
export interface SessionsListPageProps {
  /**
   * Sessions to list.
   */
  sessions: InterviewSession[];
}

/**
 * Renders a list of interview sessions, each linking to its detail page.
 * @param {SessionsListPageProps} props - Props for the page.
 * @returns {import('react').ReactNode} The sessions list page.
 */
export async function SessionsListPage(props: SessionsListPageProps) {
  const t = await getServerTranslations("session");

  return (
    <ul>
      {props.sessions.map((session) => (
        <li key={session.id}>
          <LocalizedLink href={`/sessions/${session.id}`}>
            {session.title} ({t(STATUS_MESSAGE_KEYS[session.status])})
          </LocalizedLink>
        </li>
      ))}
    </ul>
  );
}

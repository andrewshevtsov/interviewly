// Слой pages: список сессий со ссылками на детальную страницу каждой.
// Разрешено импортировать widgets, features, entities, shared.
import Link from "next/link";
import type { InterviewSession } from "@/entities/session";

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
export function SessionsListPage(props: SessionsListPageProps) {
  return (
    <ul>
      {props.sessions.map((session) => (
        <li key={session.id}>
          <Link href={`/sessions/${session.id}`}>{`${session.title} (${session.status})`}</Link>
        </li>
      ))}
    </ul>
  );
}

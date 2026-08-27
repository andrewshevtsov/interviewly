// Слой views: собирает виджеты в конкретную страницу приложения.
// Разрешено импортировать widgets, features, entities, shared.
import Link from "next/link";
import { SessionToolbar } from "@/widgets/session-toolbar";
import type { User } from "@/entities/user";
import { prepareInterviewSessionPage } from "./index";

/**
 * Props for {@link InterviewSessionPage}.
 */
export interface InterviewSessionPageProps {
  /**
   * ID of the interview session being displayed.
   */
  sessionId: string;

  /**
   * Currently logged-in user.
   */
  user: User;
}

/**
 * Renders the interview session page: toolbar plus join status for the given session.
 * @param {InterviewSessionPageProps} props - Props for the page.
 * @returns {import('react').ReactNode} The interview session page.
 */
export function InterviewSessionPage(props: InterviewSessionPageProps) {
  const { user } = props;
  const state = prepareInterviewSessionPage(props.sessionId, user);

  return (
    <main>
      <Link href={"/sessions"}>← Back to sessions</Link>
      <h1>Interview session</h1>
      <SessionToolbar usedHints={0} currentUser={user} />
      <p>{state.canJoin ? "You can join this session." : "This session cannot be joined."}</p>
    </main>
  );
}

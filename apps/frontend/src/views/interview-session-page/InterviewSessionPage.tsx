// Слой views: собирает виджеты в конкретную страницу приложения.
// Разрешено импортировать widgets, features, entities, shared.
import { SessionToolbar } from "@/widgets/session-toolbar";
import type { User } from "@/entities/user";
import { getServerTranslations } from "@/shared/i18n-server";
import { LocalizedLink } from "@/shared/ui/localized-link";
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
export async function InterviewSessionPage(props: InterviewSessionPageProps) {
  const { user } = props;
  const state = prepareInterviewSessionPage(props.sessionId, user);
  const t = await getServerTranslations("session");

  return (
    <main>
      <LocalizedLink href="/sessions">← {t("backToSessions")}</LocalizedLink>
      <h1>{t("title")}</h1>
      <SessionToolbar usedHints={0} currentUser={user} />
      <p>{state.canJoin ? t("canJoin") : t("cannotJoin")}</p>
    </main>
  );
}

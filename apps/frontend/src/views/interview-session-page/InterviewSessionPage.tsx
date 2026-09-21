// Слой views: страница "Открытая сессия" - живой воркспейс интервью.
// Разрешено импортировать widgets, features, entities, shared.
import { SessionCodeEditor } from "@/widgets/session-code-editor";
import { SessionHeader } from "@/widgets/session-header";
import { SessionVideoPanels } from "@/widgets/session-video-panels";
import type { SessionParticipant } from "@/entities/session";
import type { User } from "@/entities/user";
import { getServerTranslations } from "@/shared/i18n-server";
import { prepareInterviewSessionPage } from "./index";

const SESSION_NUMBER = "4092";
const ACCESS_CODE = "SECURE-77-X9";
const INTERVIEWER_NAME = "Мария";

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
 * Renders the "Открытая сессия" screen: header with a live recording timer, video panels with
 * an AI-hint button and a shared code editor.
 * @param {InterviewSessionPageProps} props - Props for the page.
 * @returns {import('react').ReactNode} The interview session page.
 */
export async function InterviewSessionPage(props: InterviewSessionPageProps) {
  const state = prepareInterviewSessionPage(props.sessionId);

  if (!state.canJoin) {
    const t = await getServerTranslations("interview");

    return (
      <main className="flex min-h-screen items-center justify-center px-6 text-center">
        <p className="text-muted-foreground">{t("cannotOpenSession")}</p>
      </main>
    );
  }

  const t = await getServerTranslations("session");
  const participants: SessionParticipant[] = [
    { name: INTERVIEWER_NAME, role: "interviewer" },
    { name: t("you"), role: "candidate" },
  ];

  return (
    <div className="flex h-screen flex-col">
      <SessionHeader
        sessionId={props.sessionId}
        sessionNumber={SESSION_NUMBER}
        accessCode={ACCESS_CODE}
      />

      <div className="flex flex-1 overflow-hidden">
        <SessionVideoPanels participants={participants} />
        <div className="flex flex-1 p-4">
          <SessionCodeEditor participantsCount={participants.length} />
        </div>
      </div>
    </div>
  );
}

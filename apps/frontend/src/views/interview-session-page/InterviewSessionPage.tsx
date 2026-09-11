// Слой views: страница "Открытая сессия" - живой воркспейс интервью.
// Разрешено импортировать widgets, features, entities, shared.
import { SessionCodeEditor } from "@/widgets/session-code-editor";
import { SessionHeader } from "@/widgets/session-header";
import { SessionVideoPanels } from "@/widgets/session-video-panels";
import type { SessionParticipant } from "@/entities/session";
import type { User } from "@/entities/user";
import { prepareInterviewSessionPage } from "./index";

const SESSION_NUMBER = "4092";
const ACCESS_CODE = "SECURE-77-X9";

const PARTICIPANTS: SessionParticipant[] = [
  { name: "Мария", role: "interviewer" },
  { name: "Вы", role: "candidate" },
];

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
export function InterviewSessionPage(props: InterviewSessionPageProps) {
  const state = prepareInterviewSessionPage(props.sessionId);

  if (!state.canJoin) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 text-center">
        <p className="text-muted-foreground">Эту сессию нельзя открыть — проверьте ссылку.</p>
      </main>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <SessionHeader
        sessionId={props.sessionId}
        sessionNumber={SESSION_NUMBER}
        accessCode={ACCESS_CODE}
      />

      <div className="flex flex-1 overflow-hidden">
        <SessionVideoPanels participants={PARTICIPANTS} />
        <div className="flex flex-1 p-4">
          <SessionCodeEditor participantsCount={PARTICIPANTS.length} />
        </div>
      </div>
    </div>
  );
}

// Слой entities: описывает бизнес-сущность "сессия интервью".
// Разрешено импортировать из shared.
import { formatLevel } from "@/shared/lib/format-level";
import { SESSION_ID_LENGTH } from "@/shared/config/constants";

/**
 * A single interview session.
 */
export interface InterviewSession {
  /**
   * Unique session identifier.
   */
  id: string;

  /**
   * Human-readable session title.
   */
  title: string;

  /**
   * Current lifecycle state of the session.
   */
  status: "scheduled" | "active" | "completed";
}

/**
 * The signed-in user's part in a past session, shown on the "История" screen.
 */
export type SessionParticipantRole = "candidate" | "interviewer";

/**
 * A completed interview session entry, shown on the "История интервью" screen.
 */
export interface SessionHistoryEntry {
  /**
   * Unique session identifier.
   */
  id: string;

  /**
   * Short display code, e.g. "4092" (shown as "#4092").
   */
  number: string;

  /**
   * The signed-in user's role in this session.
   */
  role: SessionParticipantRole;

  /**
   * Human-readable session title, e.g. "Алгоритмы: связные списки".
   */
  title: string;

  /**
   * Display name of the other participant.
   */
  partnerName: string;

  /**
   * Session date, formatted for display (e.g. "18 августа 2026").
   */
  date: string;

  /**
   * Session length, formatted for display (e.g. "48 мин").
   */
  duration: string;

  /**
   * Number of AI hints used during the session.
   */
  hintsUsed: number;

  /**
   * Number of AI hints available for the session.
   */
  hintsTotal: number;

  /**
   * Score awarded for the session.
   */
  score: number;

  /**
   * Maximum possible score.
   */
  scoreMax: number;
}

/**
 * Подсказка, которую AI дал во время сессии.
 */
export interface SessionHint {
  /**
   * Время от начала сессии, когда была запрошена подсказка, например "12:40".
   */
  at: string;

  /**
   * Текст подсказки.
   */
  text: string;
}

/**
 * Один момент хронологии сессии.
 */
export interface SessionTimelineEvent {
  /**
   * Время от начала сессии, например "05:30".
   */
  at: string;

  /**
   * Что произошло.
   */
  text: string;
}

/**
 * Всё, что показывается о прошедшем интервью на его экране: запись истории плюс
 * задача, итоговый код, подсказки, хронология и AI-резюме.
 */
export interface SessionDetails extends SessionHistoryEntry {
  /**
   * Название задачи, которую решали на интервью.
   */
  taskTitle: string;

  /**
   * Условие задачи.
   */
  taskDescription: string;

  /**
   * Темы, затронутые на интервью.
   */
  topics: string[];

  /**
   * Отображаемое название языка итогового кода, например "Python".
   */
  codeLanguage: string;

  /**
   * Код на момент завершения интервью.
   */
  finalCode: string;

  /**
   * Подсказки, запрошенные во время интервью, по порядку.
   */
  hints: SessionHint[];

  /**
   * Ключевые моменты интервью, по порядку.
   */
  timeline: SessionTimelineEvent[];

  /**
   * Сколько раз запускали код.
   */
  codeRuns: number;

  /**
   * Сколько раз текущий пользователь терял и восстанавливал соединение.
   */
  reconnects: number;

  /**
   * Что получилось хорошо, по итогам AI.
   */
  strengths: string[];

  /**
   * Что улучшить, по итогам AI.
   */
  growthAreas: string[];
}

/**
 * Человек, участвовавший в прошедшем интервью, и его роль в нём.
 */
export interface PastSessionParticipant {
  /**
   * Email аккаунта - то, что идентифицирует участника среди пользователей.
   */
  email: string;

  /**
   * Отображаемое имя.
   */
  name: string;

  /**
   * Роль, которую участник играл в интервью.
   */
  role: SessionParticipantRole;

  /**
   * Сколько раз этот участник терял и восстанавливал соединение.
   */
  reconnects: number;
}

/**
 * Прошедшее интервью как оно есть, одинаковое для всех: в отличие от {@link SessionDetails},
 * здесь ничего не зависит от того, кто смотрит - роль, партнёр и переподключения смотрящего
 * вычисляются из `participants` функцией {@link getSessionDetailsFor}.
 */
export interface PastSession extends Omit<SessionDetails, "role" | "partnerName" | "reconnects"> {
  /**
   * Все, кто участвовал в интервью.
   */
  participants: PastSessionParticipant[];
}

/**
 * Описывает прошедшее интервью с точки зрения участника: его роль, его партнёр
 * и его собственные переподключения.
 * @param {PastSession} session - прошедшее интервью.
 * @param {string} viewerEmail - email аккаунта текущего пользователя.
 * @returns {SessionDetails | null} Интервью с точки зрения смотрящего, либо `null`, если он не участвовал.
 */
export function getSessionDetailsFor(session: PastSession, viewerEmail: string): SessionDetails | null {
  const viewer = session.participants.find((participant) => participant.email === viewerEmail);
  const partner = session.participants.find((participant) => participant.email !== viewerEmail);

  if (!viewer || !partner) {
    return null;
  }

  return { ...session, role: viewer.role, partnerName: partner.name, reconnects: viewer.reconnects };
}

/**
 * Возвращает прошедшие интервью, в которых участвовал пользователь, в порядке `sessions`.
 * @param {PastSession[]} sessions - все прошедшие интервью, сначала новые.
 * @param {string} viewerEmail - email аккаунта текущего пользователя.
 * @returns {SessionDetails[]} Собственные интервью пользователя, каждое с его точки зрения.
 */
export function getSessionHistoryFor(sessions: PastSession[], viewerEmail: string): SessionDetails[] {
  return sessions.flatMap((session) => getSessionDetailsFor(session, viewerEmail) ?? []);
}

/**
 * A participant shown on the "Открытая сессия" screen.
 */
export interface SessionParticipant {
  /**
   * Display name.
   */
  name: string;

  /**
   * The participant's role in this session.
   */
  role: SessionParticipantRole;
}

/**
 * Code editor language offered when creating a session.
 */
export type EditorLanguage = "python" | "javascript";

/**
 * Draft values for the "Новая сессия" creation form.
 */
export interface NewSessionDraft {
  /**
   * Session title.
   */
  title: string;

  /**
   * Code editor language for the session.
   */
  editorLanguage: EditorLanguage;

  /**
   * Whether the session requires the access code below to join.
   */
  isPrivate: boolean;

  /**
   * Access code required to join when `isPrivate` is set.
   */
  accessCode: string;

  /**
   * Shareable invite link for the session.
   */
  inviteLink: string;
}

/**
 * Checks whether a string is a valid session identifier.
 * @param {string} id - Candidate session identifier.
 * @returns {boolean} `true` if `id` has the expected session ID length.
 */
export function isValidSessionId(id: string): boolean {
  return id.length === SESSION_ID_LENGTH;
}

/**
 * Formats a session's experience level for display.
 * @param {string} level - Raw experience level, e.g. "junior", "middle", "senior".
 * @returns {string} Human-readable representation of the level.
 */
export function describeSessionLevel(level: string): string {
  return formatLevel(level);
}

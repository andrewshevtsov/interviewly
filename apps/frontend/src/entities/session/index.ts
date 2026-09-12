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

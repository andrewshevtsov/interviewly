// Слой entities: сущность "отзыв о собеседовании" - peer review между участниками сессии.
// Разрешено импортировать из shared.

/**
 * A feedback record as returned by the backend.
 */
export interface Feedback {
  /**
   * Feedback identifier.
   */
  id: string;

  /**
   * Session the feedback was left about.
   */
  sessionId: string;

  /**
   * Author of the feedback - visible only to them.
   */
  authorId: string;

  /**
   * Session participant the feedback is about.
   */
  targetUserId: string;

  /**
   * Score from 0 to 10.
   */
  score: number;

  /**
   * Free-form comment, if left.
   */
  comment: string | null;
}

/**
 * Fields required to leave feedback about a session participant.
 */
export interface CreateFeedbackInput {
  /**
   * The participant this feedback is about.
   */
  targetUserId: string;

  /**
   * Score from 0 to 10.
   */
  score: number;

  /**
   * Free-form comment.
   */
  comment?: string;
}

/**
 * A session participant the signed-in user is allowed to leave feedback about
 * (everyone in the session except themselves).
 */
export interface EligibleFeedbackTarget {
  /**
   * The participant's user id.
   */
  userId: string;

  /**
   * Display name.
   */
  name: string;
}

/**
 * Тип интервью, на которое оставлен отзыв, как он хранится в сессии.
 */
export type FeedbackSessionType = "BUSINESS" | "MOCK";

/**
 * Одна запись истории отзывов пользователя: что написал, о ком и по какой сессии.
 */
export interface FeedbackHistoryEntry {
  /**
   * Идентификатор отзыва.
   */
  id: string;

  /**
   * Сессия, о которой оставлен отзыв.
   */
  sessionId: string;

  /**
   * Участник, о котором отзыв.
   */
  targetUser: EligibleFeedbackTarget;

  /**
   * Тип интервью, которым была сессия.
   */
  sessionType: FeedbackSessionType;

  /**
   * ISO-дата проведения сессии (окончание, иначе начало, иначе план) -
   * `null`, если у сессии вообще нет дат.
   */
  sessionDate: string | null;

  /**
   * Оценка от 0 до 10.
   */
  score: number;

  /**
   * Свободный комментарий, если оставлен.
   */
  comment: string | null;

  /**
   * ISO-дата написания отзыва.
   */
  createdAt: string;
}

export { feedbackApi } from "./feedback-api";

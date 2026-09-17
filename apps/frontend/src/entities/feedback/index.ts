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

export { feedbackApi } from "./feedback-api";

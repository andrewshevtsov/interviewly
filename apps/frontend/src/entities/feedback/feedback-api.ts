// Слой entities: запросы к /sessions/:sessionId/feedback и /feedback.
// Импортирует только entities (свой слайс) и shared.
import { httpClient } from "@/shared/api/http-client";
import type { CreateFeedbackInput, EligibleFeedbackTarget, Feedback, FeedbackHistoryEntry } from "./index";

export const feedbackApi = {
  /**
   * Leaves feedback about a session participant, on behalf of the signed-in user.
   * @param {string} sessionId - Session the feedback is about.
   * @param {CreateFeedbackInput} input - The feedback fields.
   * @returns {Promise<Feedback>} The created feedback.
   */
  create(sessionId: string, input: CreateFeedbackInput): Promise<Feedback> {
    return httpClient
      .post<Feedback>(`/sessions/${sessionId}/feedback`, input)
      .then((res) => res.data);
  },

  /**
   * Lists the session's other participants - who the signed-in user is allowed
   * to leave feedback about.
   * @param {string} sessionId - The session to list participants for.
   * @returns {Promise<EligibleFeedbackTarget[]>} The other participants.
   */
  listEligibleTargets(sessionId: string): Promise<EligibleFeedbackTarget[]> {
    return httpClient
      .get<EligibleFeedbackTarget[]>(`/sessions/${sessionId}/feedback/participants`)
      .then((res) => res.data);
  },

  /**
   * Возвращает отзывы, оставленные текущим пользователем, сначала новые.
   * @returns {Promise<FeedbackHistoryEntry[]>} История отзывов пользователя.
   */
  myFeedbackHistory(): Promise<FeedbackHistoryEntry[]> {
    return httpClient.get<FeedbackHistoryEntry[]>("/feedback/me").then((res) => res.data);
  },
};

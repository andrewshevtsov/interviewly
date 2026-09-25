// Слой entities: запросы к /sessions - создание комнаты, заявки на вход и LiveKit-токен
// Импортирует только entities (свой слайс) и shared
import { httpClient } from "@/shared/api/http-client";
import type {
  AccessRequest,
  ApiSession,
  ApiSessionParticipant,
  CreateSessionInput,
  LivekitConnection,
  MySessionState,
} from "./index";

/**
 * Тело ответа `GET /sessions/:id/participants`.
 */
interface ParticipantsResponse {
  /**
   * Все, кого впустили в сессию.
   */
  participants: ApiSessionParticipant[];
}

export const sessionApi = {
  /**
   * Создаёт сессию; текущий пользователь становится её владельцем
   * @param {CreateSessionInput} input - Тип доступа и необязательный пароль
   * @returns {Promise<ApiSession>} Созданная сессия
   */
  create(input: CreateSessionInput): Promise<ApiSession> {
    return httpClient.post<ApiSession>("/sessions", input).then((res) => res.data);
  },

  /**
   * Загружает состояние текущего пользователя в сессии: роль и последнюю заявку
   * @param {string} sessionId - UUID сессии
   * @returns {Promise<MySessionState>} состояние пользователя
   */
  getMyState(sessionId: string): Promise<MySessionState> {
    return httpClient.get<MySessionState>(`/sessions/${sessionId}/me`).then((res) => res.data);
  },

  /**
   * Просит владельца впустить текущего пользователя
   * @param {string} sessionId - UUID сессии
   * @param {string} [password] - Пароль комнаты для закрытых сессий
   * @returns {Promise<void>} Завершается, когда заявка сохранена
   */
  requestAccess(sessionId: string, password?: string): Promise<void> {
    return httpClient.post(`/sessions/${sessionId}/access-requests`, { password }).then(() => undefined);
  },

  /**
   * Список заявок на вход в сессию (только для владельца)
   * @param {string} sessionId - UUID сессии
   * @returns {Promise<AccessRequest[]>} Все заявки, сначала новые
   */
  listAccessRequests(sessionId: string): Promise<AccessRequest[]> {
    return httpClient.get<AccessRequest[]>(`/sessions/${sessionId}/access-requests`).then((res) => res.data);
  },

  /**
   * Впускает автора заявки в сессию (только владелец)
   * @param {string} sessionId - UUID сессии
   * @param {string} requestId - UUID заявки
   * @returns {Promise<void>} Завершается, когда заявка одобрена
   */
  approveAccessRequest(sessionId: string, requestId: string): Promise<void> {
    return httpClient.post(`/sessions/${sessionId}/access-requests/${requestId}/approve`).then(() => undefined);
  },

  /**
   * Отклоняет заявку (только владелец)
   * @param {string} sessionId - UUID сессии
   * @param {string} requestId - UUID заявки
   * @returns {Promise<void>} Завершается, когда заявка отклонена
   */
  rejectAccessRequest(sessionId: string, requestId: string): Promise<void> {
    return httpClient.post(`/sessions/${sessionId}/access-requests/${requestId}/reject`).then(() => undefined);
  },

  /**
   * Список всех, кого впустили в сессию (только для владельца и участников)
   * @param {string} sessionId - UUID сессии
   * @returns {Promise<ApiSessionParticipant[]>} Участники, сначала давние
   */
  listParticipants(sessionId: string): Promise<ApiSessionParticipant[]> {
    return httpClient
      .get<ParticipantsResponse>(`/sessions/${sessionId}/participants`)
      .then((res) => res.data.participants);
  },

  /**
   * Передаёт сессию другому интервьюеру (только владелец); роли не меняются
   * @param {string} sessionId - UUID сессии
   * @param {string} userId - UUID интервьюера, который станет владельцем
   * @returns {Promise<void>} Завершается, когда владение передано
   */
  transferOwnership(sessionId: string, userId: string): Promise<void> {
    return httpClient.post(`/sessions/${sessionId}/transfer-ownership`, { userId }).then(() => undefined);
  },

  /**
   * Завершает интервью для всех и закрывает LiveKit-комнату (только владелец)
   * @param {string} sessionId - UUID сессии
   * @returns {Promise<void>} Завершается, когда сессия переведена в COMPLETED
   */
  end(sessionId: string): Promise<void> {
    return httpClient.post(`/sessions/${sessionId}/end`).then(() => undefined);
  },

  /**
   * Выпускает LiveKit-токен для текущего участника
   * @param {string} sessionId - UUID сессии
   * @returns {Promise<LivekitConnection>} URL сервера, имя комнаты и токен участника
   */
  getLivekitToken(sessionId: string): Promise<LivekitConnection> {
    return httpClient.post<LivekitConnection>(`/sessions/${sessionId}/livekit-token`).then((res) => res.data);
  },
};

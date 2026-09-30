// Слой entities: запросы к /sessions - создание комнаты, заявки на вход и LiveKit-токен
// Импортирует только entities (свой слайс) и shared
import { httpClient } from "@/shared/api/http-client";
import type {
  AccessRequest,
  ApiSession,
  ApiSessionHistoryItem,
  ApiSessionHint,
  ApiSessionParticipant,
  CreateSessionInput,
  DemoTask,
  DemoTaskState,
  HintRequestContext,
  LivekitConnection,
  MySessionState,
  SessionHints,
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
   * Загружает карточку сессии (без участников)
   * @param {string} sessionId - UUID сессии
   * @returns {Promise<ApiSession>} Сессия
   */
  get(sessionId: string): Promise<ApiSession> {
    return httpClient.get<ApiSession>(`/sessions/${sessionId}`).then((res) => res.data);
  },

  /**
   * Завершённые сессии текущего пользователя, сначала последние
   * @returns {Promise<ApiSessionHistoryItem[]>} История интервью
   */
  history(): Promise<ApiSessionHistoryItem[]> {
    return httpClient.get<ApiSessionHistoryItem[]>("/sessions/history").then((res) => res.data);
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

  /**
   * AI-подсказки сессии и остаток лимита
   * @param {string} sessionId - UUID сессии
   * @returns {Promise<SessionHints>} Подсказки по порядку, лимит и остаток
   */
  listHints(sessionId: string): Promise<SessionHints> {
    return httpClient.get<SessionHints>(`/sessions/${sessionId}/hints`).then((res) => res.data);
  },

  /**
   * Запрашивает AI-подсказку (кандидат)
   * @param {string} sessionId - UUID сессии
   * @param {HintRequestContext} [context] - Текущий код кандидата для модели
   * @returns {Promise<ApiSessionHint>} Новая подсказка
   */
  requestHint(sessionId: string, context: HintRequestContext = {}): Promise<ApiSessionHint> {
    return httpClient.post<ApiSessionHint>(`/sessions/${sessionId}/hints`, context).then((res) => res.data);
  },

  /**
   * Текущая демо-задача комнаты и включён ли демо-режим
   * @param {string} sessionId - UUID сессии
   * @returns {Promise<DemoTaskState>} Состояние демо-задачи
   */
  getDemoTask(sessionId: string): Promise<DemoTaskState> {
    return httpClient.get<DemoTaskState>(`/sessions/${sessionId}/demo-task`).then((res) => res.data);
  },

  /**
   * Показывает в комнате следующую демо-задачу (интервьюер)
   * @param {string} sessionId - UUID сессии
   * @returns {Promise<DemoTask>} Новая задача
   */
  nextDemoTask(sessionId: string): Promise<DemoTask> {
    return httpClient.post<DemoTask>(`/sessions/${sessionId}/demo-task/next`).then((res) => res.data);
  },
};

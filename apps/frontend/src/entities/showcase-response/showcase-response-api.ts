// Слой entities: запросы к откликам витрины. Импортирует только entities (свой слайс) и shared
import { httpClient } from "@/shared/api/http-client";

import type {
  ChatMessage,
  IncomingResponse,
  OutgoingResponse,
  RejectInput,
  RespondInput,
  ResponseResult,
  UnreadMessages,
} from "./index";

/**
 * Ключи кеша TanStack Query для откликов. По ним обновляются нужные списки.
 */
export const showcaseResponseKeys = {
  incoming: ["showcase", "responses", "incoming"],
  outgoing: ["showcase", "responses", "outgoing"],
  cards: ["showcase", "cards"],
  unread: ["showcase", "responses", "unread-messages"],
  newEvents: ["showcase", "responses", "new-events"],

  /**
   * Ключ кеша чата по отклику.
   * @param {string} responseId - Идентификатор отклика.
   * @returns {readonly string[]} Ключ запроса сообщений.
   */
  messages: (responseId: string) => ["showcase", "responses", responseId, "messages"] as const,
} as const;

/**
 * Ответ `GET /showcase/responses/new-events`: сколько событий по откликам я ещё не видел.
 */
export interface NewEventsCount {
  /**
   * Количество событий во входящих.
   */
  incoming: number;

  /**
   * Количество событий в исходящих.
   */
  outgoing: number;
}

export const showcaseResponseApi = {
  /**
   * Откликается на карточку: роль и время встречи.
   * @param {string} cardId - Идентификатор карточки (профиля) владельца.
   * @param {RespondInput} input - Моя роль и предлагаемое время.
   * @returns {Promise<ResponseResult>} Созданный отклик в ожидании.
   */
  respond(cardId: string, input: RespondInput): Promise<ResponseResult> {
    return httpClient.post<ResponseResult>(`/showcase/cards/${cardId}/responses`, input).then((res) => res.data);
  },

  /**
   * Отклики на мою карточку.
   * @returns {Promise<IncomingResponse[]>} Последние отклики, новые выше.
   */
  incoming(): Promise<IncomingResponse[]> {
    return httpClient.get<IncomingResponse[]>("/showcase/responses/incoming").then((res) => res.data);
  },

  /**
   * Мои отклики на другие карточки.
   * @returns {Promise<OutgoingResponse[]>} Последние отклики, новые выше.
   */
  outgoing(): Promise<OutgoingResponse[]> {
    return httpClient.get<OutgoingResponse[]>("/showcase/responses/outgoing").then((res) => res.data);
  },

  /**
   * Принимает отклик: создаётся сессия на предложенное время.
   * @param {string} responseId - Идентификатор отклика.
   * @returns {Promise<ResponseResult>} Принятый отклик с `sessionId`.
   */
  accept(responseId: string): Promise<ResponseResult> {
    return httpClient.post<ResponseResult>(`/showcase/responses/${responseId}/accept`).then((res) => res.data);
  },

  /**
   * Отклоняет отклик с причиной (только владелец карточки).
   * @param {string} responseId - Идентификатор отклика.
   * @param {RejectInput} input - Причина и признак "дело во времени".
   * @returns {Promise<ResponseResult>} Отклонённый отклик.
   */
  reject(responseId: string, input: RejectInput): Promise<ResponseResult> {
    return httpClient.post<ResponseResult>(`/showcase/responses/${responseId}/reject`, input).then((res) => res.data);
  },

  /**
   * Отзывает свой отклик, пока он в ожидании.
   * @param {string} responseId - Идентификатор отклика.
   * @returns {Promise<ResponseResult>} Отозванный отклик.
   */
  cancel(responseId: string): Promise<ResponseResult> {
    return httpClient.post<ResponseResult>(`/showcase/responses/${responseId}/cancel`).then((res) => res.data);
  },

  /**
   * Отменяет назначенную встречу (любой из двух участников, пока встеча не началась).
   * @param {string} sessionId - Сессия, созданная при принятии отклика.
   * @returns {Promise<void>} Завершается после отмены.
   */
  async cancelMeeting(sessionId: string): Promise<void> {
    await httpClient.post(`/sessions/${sessionId}/cancel`, {});
  },

  /**
   * Сообщения чата по отклику.
   * @param {string} responseId - Идентификатор отклика.
   * @returns {Promise<ChatMessage[]>} Последние сообщения по порядку отправки.
   */
  async messages(responseId: string): Promise<ChatMessage[]> {
    const res = await httpClient.get<ChatMessage[]>(`/showcase/responses/${responseId}/messages`);

    return res.data;
  },

  /**
   * Пишет в чат по отклику.
   * @param {string} responseId - Идентификатор отклика.
   * @param {string} text - Текст сообщения.
   * @returns {Promise<ChatMessage>} Отправленное сообщение.
   */
  async sendMessage(responseId: string, text: string): Promise<ChatMessage> {
    const res = await httpClient.post<ChatMessage>(`/showcase/responses/${responseId}/messages`, { text });

    return res.data;
  },

  /**
   * Непрочитанные сообщения по моим откликам.
   * @returns {Promise<UnreadMessages[]>} Счётчики по откликам.
   */
  async unreadMessages(): Promise<UnreadMessages[]> {
    const res = await httpClient.get<UnreadMessages[]>("/showcase/responses/unread-messages");

    return res.data;
  },

  /**
   * Отмечает чат по отклику прочитанным.
   * @param {string} responseId - Идентификатор отклика.
   * @returns {Promise<void>} Завершается, когда отметка сохранена.
   */
  async markChatRead(responseId: string): Promise<void> {
    await httpClient.post(`/showcase/responses/${responseId}/messages/read`);
  },

  /**
   * Количество новых событий по откликам.
   * @returns {Promise<NewEventsCount>} Счётчики по входящим и исходящим.
   */
  async newEvents(): Promise<NewEventsCount> {
    const res = await httpClient.get<NewEventsCount>("/showcase/responses/new-events");

    return res.data;
  },
};

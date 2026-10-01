// Слой shared: единственное socket.io-соединение с backend. Токен берётся из auth-store при
// каждом (пере)подключении, поэтому после тихого refresh сокет подхватывает свежий
import { io, type Socket } from "socket.io-client";

import { useAuthStore } from "@/shared/model/auth-store";

import { refreshAccessToken } from "./http-client";

// Совпадают с SESSION_SOCKET_MESSAGES на бэкенде
const JOIN_MESSAGE = "session:join";
const LEAVE_MESSAGE = "session:leave";

let socket: Socket | null = null;

// Подписчики каждой комнаты: выходим из комнаты только после отписки последнего
const roomSubscribers = new Map<string, Set<symbol>>();

/**
 * Отдаёт socket.io актуальный access-токен при каждом (пере)подключении
 * @param {(data: object) => void} callback - Принимает данные авторизации
 * @returns {void}
 */
function provideToken(callback: (data: object) => void): void {
  callback({ token: useAuthStore.getState().accessToken });
}

/**
 * Возвращает общий сокет, создавая и подключая его при первом вызове. Если сервер отверг
 * подключение (токен истёк), один раз обновляет токен и подключается снова.
 * @returns {Socket} Подключаемый socket.io-клиент
 */
export function getRealtimeSocket(): Socket {
  if (socket) {
    return socket;
  }

  const instance = io(process.env.NEXT_PUBLIC_API_URL, {
    transports: ["websocket"],
    withCredentials: true,
    auth: provideToken,
  });

  let refreshedAfterError = false;
  instance.on("connect", () => {
    refreshedAfterError = false;
    // После переподключения сервер забыл комнаты сокета - входим заново
    for (const sessionId of roomSubscribers.keys()) {
      instance.emit(JOIN_MESSAGE, { sessionId });
    }
  });
  // Отказ middleware сервера socket.io сам не повторяет - переподключаемся вручную
  instance.on("connect_error", () => {
    if (instance.active || refreshedAfterError) {
      return;
    }
    refreshedAfterError = true;
    refreshAccessToken()
      .then(() => instance.connect())
      .catch(() => undefined);
  });

  socket = instance;

  return instance;
}

/**
 * Подписывает на событие комнаты сессии. Сокет входит в комнату при первой подписке и выходит
 * после последней отписки, а после переподключения возвращается в неё сам.
 * @param {string} sessionId - UUID сессии
 * @param {string} event - Имя события
 * @param {(payload: T) => void} handler - Обработчик события
 * @param {() => void} [onReconnect] - Вызывается после переподключения, чтобы догрузить пропущенное
 * @returns {() => void} Отписка
 */
export function subscribeToSessionEvent<T>(
  sessionId: string,
  event: string,
  handler: (payload: T) => void,
  onReconnect?: () => void,
): () => void {
  const instance = getRealtimeSocket();
  const subscriber = Symbol(event);
  const subscribers = roomSubscribers.get(sessionId) ?? new Set<symbol>();

  if (subscribers.size === 0 && instance.connected) {
    instance.emit(JOIN_MESSAGE, { sessionId });
  }
  subscribers.add(subscriber);
  roomSubscribers.set(sessionId, subscribers);
  instance.on(event, handler);
  if (onReconnect) {
    instance.on("connect", onReconnect);
  }

  return () => {
    instance.off(event, handler);
    if (onReconnect) {
      instance.off("connect", onReconnect);
    }

    subscribers.delete(subscriber);
    if (subscribers.size === 0) {
      roomSubscribers.delete(sessionId);
      instance.emit(LEAVE_MESSAGE, { sessionId });
    }
  };
}

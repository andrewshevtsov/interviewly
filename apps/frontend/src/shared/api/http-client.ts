// Слой shared: axios-инстанс для запросов к backend. `withCredentials` нужен,
// чтобы браузер отправлял httpOnly-куку с refresh-токеном на /auth/refresh.
import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

import { useAuthStore } from "@/shared/model/auth-store";

const HTTP_UNAUTHORIZED = 401;

/**
 * Тело успешного ответа `POST /auth/refresh`.
 */
interface RefreshResponse {
  /**
   * Новый access-токен.
   */
  accessToken: string;
}

/**
 * Конфиг запроса axios с флагом "уже повторён после тихого обновления токена"
 */
interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  /**
   * Выставляется, когда запрос уже повторили после обновления токена
   */
  _retry?: boolean;
}

export const httpClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

httpClient.interceptors.request.use(
  /**
   * Добавляет к исходящим запросам access-токен из памяти, если он есть.
   * @param {InternalAxiosRequestConfig} config - Конфиг исходящего запроса.
   * @returns {InternalAxiosRequestConfig} Конфиг с заголовком `Authorization`.
   */
  (config) => {
    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
);

let refreshPromise: Promise<string> | null = null;

/**
 * Запрашивает новый access-токен по куке с refresh-токеном (браузер отправляет её сам);
 * одновременные 401 ждут один и тот же запрос.
 * @returns {Promise<string>} Новый access-токен.
 */
export function refreshAccessToken(): Promise<string> {
  refreshPromise ??= axios
    .post<RefreshResponse>(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, undefined, { withCredentials: true })
    .then(({ data }) => {
      useAuthStore.getState().setAuthenticated(data.accessToken);

      return data.accessToken;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

httpClient.interceptors.response.use(
  /**
   * Пропускает успешные ответы без изменений.
   * @param {import('axios').AxiosResponse} response - Успешный ответ.
   * @returns {import('axios').AxiosResponse} Тот же ответ.
   */
  (response) => response,
  /**
   * При 401 один раз повторяет запрос после тихого обновления токена; иначе отклоняет.
   * @param {AxiosError} error - Ошибка неудавшегося ответа.
   * @returns {Promise<unknown>} Повторённый запрос или отклонённый промис.
   */
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const isRefreshCall = originalRequest?.url?.includes("/auth/refresh");

    if (
      error.response?.status === HTTP_UNAUTHORIZED &&
      originalRequest &&
      !originalRequest._retry &&
      !isRefreshCall
    ) {
      originalRequest._retry = true;
      try {
        const accessToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        return httpClient(originalRequest);
      } catch {
        useAuthStore.getState().setAnonymous();
      }
    }

    return Promise.reject(error);
  },
);

/**
 * HTTP-статус неудавшегося запроса, если ошибка пришла от бэкенда.
 * @param {unknown} error - Ошибка из вызова `httpClient`.
 * @returns {number | undefined} Статус ответа или `undefined` для сетевых и прочих ошибок.
 */
export function getHttpStatus(error: unknown): number | undefined {
  return axios.isAxiosError(error) ? error.response?.status : undefined;
}

// Слой shared: axios-инстанс для запросов к backend. `withCredentials` нужен,
// чтобы браузер отправлял httpOnly-куку с refresh-токеном на /auth/refresh.
import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

import { clearAccessToken, getAccessToken, setAccessToken } from "./access-token";

const HTTP_UNAUTHORIZED = 401;

/**
 * Body of a successful `POST /auth/refresh` response.
 */
interface RefreshResponse {
  /**
   * Newly issued access token.
   */
  accessToken: string;
}

/**
 * An axios request config, extended with a flag marking it as already retried once
 * after a silent token refresh (to avoid retry loops on a repeated 401).
 */
interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  /**
   * Set once this request has already been retried after a token refresh.
   */
  _retry?: boolean;
}

export const httpClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

httpClient.interceptors.request.use(
  /**
   * Attaches the in-memory access token to outgoing requests, if present.
   * @param {InternalAxiosRequestConfig} config - The outgoing request config.
   * @returns {InternalAxiosRequestConfig} The config with an `Authorization` header attached.
   */
  (config) => {
    const accessToken = getAccessToken();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
);

let refreshPromise: Promise<string> | null = null;

/**
 * Requests a new access token via the refresh-token cookie (sent automatically
 * by the browser), deduplicating concurrent 401s behind one in-flight call.
 * @returns {Promise<string>} The new access token.
 */
export function refreshAccessToken(): Promise<string> {
  refreshPromise ??= axios
    .post<RefreshResponse>(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, undefined, { withCredentials: true })
    .then(({ data }) => {
      setAccessToken(data.accessToken);

      return data.accessToken;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

httpClient.interceptors.response.use(
  /**
   * Passes successful responses through unchanged.
   * @param {import('axios').AxiosResponse} response - The successful response.
   * @returns {import('axios').AxiosResponse} The same response.
   */
  (response) => response,
  /**
   * On a 401, retries the request once after a silent token refresh; otherwise rejects.
   * @param {AxiosError} error - The failed response's error.
   * @returns {Promise<unknown>} The retried request, or a rejected promise.
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
        clearAccessToken();
      }
    }

    return Promise.reject(error);
  },
);

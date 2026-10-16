"use client";

// Слой entities: данные текущего пользователя.
import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { userApi } from "./user-api";
import type { CurrentUser } from "./index";

/**
 * Ключ кеша данных текущего пользователя.
 */
export const CURRENT_USER_QUERY_KEY = ["users", "me"] as const;

/**
 * Загружает текущего пользователя и кеширует результат.
 * @returns {UseQueryResult<CurrentUser>} Состояние запроса TanStack Query.
 */
export function useCurrentUser(): UseQueryResult<CurrentUser> {
  return useQuery({ queryKey: CURRENT_USER_QUERY_KEY, queryFn: userApi.getMe });
}

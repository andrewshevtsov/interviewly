"use client";

import { create } from "zustand";

export type AuthStatus = "initializing" | "authenticated" | "anonymous";

/** Состояние авторизации текущей вкладки браузера. */
interface AuthState {
  /** JWT access-токен, хранящийся только в памяти вкладки. */
  accessToken: string | null;

  /** Текущий этап восстановления или использования пользовательской сессии. */
  status: AuthStatus;

  /** Сохраняет новый access-токен и отмечает сессию как авторизованную. */
  setAuthenticated: (accessToken: string) => void;

  /** Очищает локальные данные авторизации и отмечает сессию как гостевую. */
  setAnonymous: () => void;
}

/**
 * In-memory store авторизации. Access-токен намеренно не сохраняется в localStorage:
 * после перезагрузки он восстанавливается через refresh-токен в httpOnly-cookie.
 */
export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  status: "initializing",

  /**
   * Сохраняет новый access-токен и отмечает сессию как авторизованную.
   * @param {string} accessToken - JWT access-токен пользователя.
   */
  setAuthenticated: (accessToken) => {
    set({ accessToken, status: "authenticated" });
  },

  /** Очищает локальные данные авторизации и отмечает сессию как гостевую. */
  setAnonymous: () => {
    set({ accessToken: null, status: "anonymous" });
  },
}));

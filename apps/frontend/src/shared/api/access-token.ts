// Слой shared: access-токен живёт только в памяти вкладки (не в localStorage),
// чтобы уменьшить поверхность для XSS. Refresh-токен клиенту вообще не виден -
// он в httpOnly-куке, которую ставит backend (см. apps/backend/src/modules/auth).
// После перезагрузки страницы токен восстанавливается через тихий refresh
// в http-client.ts.
let accessToken: string | null = null;
const listeners = new Set<() => void>();

/**
 * Notifies every subscriber that the access token changed.
 * @returns {void}
 */
function notify(): void {
  listeners.forEach((listener) => listener());
}

/**
 * Returns the current in-memory access token for the active tab.
 * @returns {string | null} The current access token in memory, or null if none is set.
 */
export function getAccessToken(): string | null {
  return accessToken;
}

/**
 * Stores the access token in memory for the current tab.
 * @param {string} token - The JWT access token to store.
 * @returns {void}
 */
export function setAccessToken(token: string): void {
  accessToken = token;
  notify();
}

/**
 * Clears the current in-memory access token.
 * @returns {void}
 */
export function clearAccessToken(): void {
  accessToken = null;
  notify();
}

/**
 * Subscribes to access-token changes (login/logout/session expiry). Intended for
 * `useSyncExternalStore` - see `useIsAuthenticated`.
 * @param {() => void} listener - Called whenever the token is set or cleared.
 * @returns {() => void} Unsubscribe function.
 */
export function subscribeToAccessToken(listener: () => void): () => void {
  listeners.add(listener);

  return () => listeners.delete(listener);
}

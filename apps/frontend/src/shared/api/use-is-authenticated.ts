"use client";

// Слой shared: хук для реактивного UI на основе access-токена (например, Navbar).
import { useSyncExternalStore } from "react";

import { getAccessToken, subscribeToAccessToken } from "./access-token";

/**
 * Returns `false` for the server-rendered snapshot, since there's no access token
 * before hydration - avoids a hydration mismatch on the first client render.
 * @returns {boolean} Always `false`.
 */
function getServerSnapshot(): boolean {
  return false;
}

/**
 * Whether the current tab has a signed-in session (an access token in memory).
 * Re-renders the calling component on login, logout and session expiry.
 * @returns {boolean} `true` if signed in.
 */
export function useIsAuthenticated(): boolean {
  return useSyncExternalStore(subscribeToAccessToken, () => getAccessToken() !== null, getServerSnapshot);
}

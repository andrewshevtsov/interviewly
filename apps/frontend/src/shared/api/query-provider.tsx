"use client";

// Слой shared: провайдер TanStack Query - кэш и состояние серверных запросов.
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

/**
 * Props for {@link QueryProvider}.
 */
export interface QueryProviderProps {
  /**
   * Subtree that can use TanStack Query hooks.
   */
  children: ReactNode;
}

/**
 * Wraps the app in a single, per-session `QueryClient`.
 * @param {QueryProviderProps} props - Props for the provider.
 * @returns {import('react').ReactNode} The query provider.
 */
export function QueryProvider(props: QueryProviderProps) {
  const [client] = useState(() => new QueryClient());

  return <QueryClientProvider client={client}>{props.children}</QueryClientProvider>;
}

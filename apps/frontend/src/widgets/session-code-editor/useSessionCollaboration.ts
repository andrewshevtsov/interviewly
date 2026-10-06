"use client";

import { HocuspocusProvider } from "@hocuspocus/provider";
import { useEffect, useState } from "react";
import * as Y from "yjs";

import { useAuthStore } from "@/shared/model/auth-store";

const COLLABORATION_URL = process.env.NEXT_PUBLIC_COLLABORATION_URL ?? "ws://localhost:1234";
const USER_COLORS = ["#4c8dff", "#22c55e", "#f59e0b", "#f472b6", "#a78bfa"] as const;
const USER_LABEL_LENGTH = 8;

export type CollaborationStatus = "connecting" | "connected" | "disconnected" | "error";

/** Совместные объекты одной сессии с редактором кода. */
export interface SessionCollaboration {
  /** Данные присутствия Yjs для курсоров и подключённых участников. */
  awareness: NonNullable<HocuspocusProvider["awareness"]>;

  /** Общий текст кода. */
  sharedText: Y.Text;
}

/** Результат подключения текущего пользователя к совместному документу. */
export interface UseSessionCollaborationResult {
  /** Совместные объекты; `null`, пока токен доступа недоступен. */
  collaboration: SessionCollaboration | null;

  /** Текущее состояние WebSocket-соединения. */
  status: CollaborationStatus;
}

/**
 * Создаёт совместный Yjs-документ сессии и подключает его к WebSocket-сервису.
 * @param {string} sessionId - UUID сессии, используемый как имя Yjs-комнаты.
 * @param {string} currentUserId - UUID пользователя для отображения удалённого курсора.
 * @returns {UseSessionCollaborationResult} Совместный текст, присутствие и состояние соединения.
 */
export function useSessionCollaboration(
  sessionId: string,
  currentUserId: string,
): UseSessionCollaborationResult {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [collaboration, setCollaboration] = useState<SessionCollaboration | null>(null);
  const [status, setStatus] = useState<CollaborationStatus>("connecting");

  useEffect(() => {
    if (!accessToken) {
      setCollaboration(null);
      setStatus("error");

      return;
    }

    const document = new Y.Doc();
    const provider = new HocuspocusProvider({
      url: COLLABORATION_URL,
      name: sessionId,
      document,
      token: accessToken,
      onStatus: (event) => setStatus(event.status),
      onAuthenticationFailed: () => setStatus("error"),
    });
    const sharedText = document.getText("code");
    const color = USER_COLORS[currentUserId.charCodeAt(0) % USER_COLORS.length];
    const awareness = provider.awareness;
    if (!awareness) {
      provider.destroy();
      document.destroy();
      setStatus("error");

      return;
    }

    awareness.setLocalStateField("user", {
      name: currentUserId.slice(0, USER_LABEL_LENGTH),
      color,
      colorLight: `${color}33`,
    });

    setCollaboration({ awareness, sharedText });

    return () => {
      setCollaboration(null);
      provider.destroy();
      document.destroy();
    };
  }, [accessToken, currentUserId, sessionId]);

  return { collaboration, status };
}

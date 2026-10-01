import { Server } from "@hocuspocus/server";
import { config } from "dotenv";
import { resolve } from "node:path";
import * as Y from "yjs";

import { DocumentRepository } from "./document-repository.js";

config({ path: resolve(process.cwd(), "../../.env") });

const DEFAULT_PORT = 1234;
// Частый интервал ограничивает возможную потерю данных, а максимальный гарантирует
// сохранение даже тогда, когда участник печатает без пауз.
const STORE_DEBOUNCE_MS = 2_000;
const STORE_MAX_DEBOUNCE_MS = 10_000;

const port = Number(process.env.COLLABORATION_PORT ?? DEFAULT_PORT);
const backendUrl = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:4000";
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is required for collaboration document persistence",
  );
}

const documentRepository = new DocumentRepository(databaseUrl);

/** Минимальная часть ответа backend, необходимая для допуска к документу. */
interface SessionState {
  role: "INTERVIEWER" | "CANDIDATE" | null;
}

const server = new Server({
  port,
  stopOnSignals: false,
  debounce: STORE_DEBOUNCE_MS,
  maxDebounce: STORE_MAX_DEBOUNCE_MS,
  // При создании серверного Y.Doc восстанавливаем последнее состояние из PostgreSQL;
  // для новой сессии записи ещё нет, поэтому документ остаётся пустым.
  async onLoadDocument({ document, documentName }) {
    const snapshot = await documentRepository.load(documentName);
    if (snapshot) {
      Y.applyUpdate(document, snapshot);
    }

    return document;
  },
  // Hocuspocus объединяет частые изменения и вызывает сохранение с интервалами выше.
  async onStoreDocument({ document, documentName }) {
    await documentRepository.store(
      documentName,
      Y.encodeStateAsUpdate(document),
    );
  },
  // Последний участник отключился: перед удалением Y.Doc из оперативной памяти ещё раз
  // фиксируем итоговое состояние. Повторный идентичный снимок не увеличивает версию.
  async beforeUnloadDocument({ document, documentName }) {
    await documentRepository.store(
      documentName,
      Y.encodeStateAsUpdate(document),
    );
  },
  // Токен подтверждает личность, а backend дополнительно проверяет участие пользователя
  // именно в той сессии, UUID которой используется как имя документа.
  async onAuthenticate({ documentName, token }) {
    const response = await fetch(`${backendUrl}/sessions/${documentName}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      throw new Error("Session access denied");
    }

    const state = (await response.json()) as SessionState;
    if (!state.role) {
      throw new Error("Session access denied");
    }

    return { role: state.role };
  },
});

await server.listen();

let isShuttingDown = false;

/** Сначала сохраняет и выгружает документы Hocuspocus, затем закрывает PostgreSQL. */
async function shutdown(): Promise<void> {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  await server.destroy();
  await documentRepository.close();
}

process.once("SIGINT", () => void shutdown());
process.once("SIGTERM", () => void shutdown());

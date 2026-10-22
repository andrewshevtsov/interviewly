import { Server } from "@hocuspocus/server";
import { config } from "dotenv";
import { resolve } from "node:path";
import type { IncomingMessage } from "node:http";
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
const internalServiceToken = process.env.INTERNAL_SERVICE_TOKEN;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is required for collaboration document persistence",
  );
}
if (!internalServiceToken) {
  throw new Error("INTERNAL_SERVICE_TOKEN is required");
}

const documentRepository = new DocumentRepository(databaseUrl);

/** Минимальная часть ответа backend, необходимая для допуска к документу. */
interface SessionState {
  role: "INTERVIEWER" | "CANDIDATE" | null;
}

type ExecutionStatus =
  "queued" | "running" | "success" | "error" | "queue_timeout" | "rejected";

interface ExecutionPatch {
  id: string;
  userName?: string;
  startedAt?: number;
  status: ExecutionStatus;
  result?: unknown;
}

const STATUS_ORDER: Record<ExecutionStatus, number> = {
  queued: 0,
  running: 1,
  success: 2,
  error: 2,
  queue_timeout: 2,
  rejected: 2,
};

/** Reads a small JSON body from the trusted internal HTTP endpoint. */
async function readJson(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const value = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += value.length;
    if (size > 100_000) {
      throw new Error("Request body is too large");
    }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function isExecutionPatch(
  value: unknown,
  executionId: string,
): value is ExecutionPatch {
  if (typeof value !== "object" || value === null) return false;
  const patch = value as Partial<ExecutionPatch>;
  return (
    patch.id === executionId &&
    typeof patch.status === "string" &&
    patch.status in STATUS_ORDER &&
    (patch.userName === undefined || typeof patch.userName === "string") &&
    (patch.startedAt === undefined || typeof patch.startedAt === "number")
  );
}

const server = new Server({
  port,
  stopOnSignals: false,
  debounce: STORE_DEBOUNCE_MS,
  maxDebounce: STORE_MAX_DEBOUNCE_MS,
  async onRequest({ request, response, instance }) {
    const url = new URL(request.url ?? "/", "http://collaboration.internal");
    const match = url.pathname.match(
      /^\/internal\/sessions\/([0-9a-f-]+)\/executions\/([0-9a-f-]+)$/i,
    );
    if (!match || request.method !== "PUT") {
      return;
    }
    if (request.headers["x-internal-service-token"] !== internalServiceToken) {
      response.statusCode = 401;
      response.end();
      return Promise.reject(null);
    }

    let statusCode = 204;
    try {
      const sessionId = match[1]!;
      const executionId = match[2]!;
      const payload = await readJson(request);
      if (!isExecutionPatch(payload, executionId)) {
        statusCode = 400;
      } else {
        const connection = await instance.openDirectConnection(sessionId, {
          internal: true,
        });
        await connection.transact((document) => {
          const log =
            document.getArray<Record<string, unknown>>("execution-log");
          const entries = log.toArray();
          const index = entries.findIndex((entry) => entry.id === executionId);
          const current = index >= 0 ? entries[index] : undefined;
          const currentStatus = current?.status as ExecutionStatus | undefined;
          const status =
            currentStatus &&
            STATUS_ORDER[currentStatus] > STATUS_ORDER[payload.status]
              ? currentStatus
              : payload.status;
          const next = {
            userName: payload.userName ?? current?.userName ?? "",
            startedAt: payload.startedAt ?? current?.startedAt ?? Date.now(),
            ...current,
            ...payload,
            id: executionId,
            status,
          };
          if (index >= 0) {
            log.delete(index, 1);
            log.insert(index, [next]);
          } else {
            log.insert(0, [next]);
          }
        });
        await connection.disconnect();
      }
    } catch {
      statusCode = 500;
    }
    response.statusCode = statusCode;
    response.end();
    return Promise.reject(null);
  },
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

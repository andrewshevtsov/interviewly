import { Pool } from "pg";

/** PostgreSQL-хранилище последнего бинарного снимка Yjs для каждой сессии. */
export class DocumentRepository {
  private readonly pool: Pool;

  /**
   * Создаёт пул соединений с общей базой Interviewly.
   * @param {string} databaseUrl - Строка подключения к PostgreSQL.
   */
  constructor(databaseUrl: string) {
    this.pool = new Pool({ connectionString: databaseUrl });
  }

  /**
   * Загружает последний снимок либо возвращает null для нового документа.
   * @param {string} sessionId - UUID сессии, одновременно являющийся именем Yjs-документа.
   * @returns {Promise<Uint8Array | null>} Бинарное состояние Yjs или null.
   */
  async load(sessionId: string): Promise<Uint8Array | null> {
    const result = await this.pool.query<{ snapshot: Buffer }>(
      'SELECT "snapshot" FROM "SessionDocument" WHERE "sessionId" = $1',
      [sessionId],
    );

    const snapshot = result.rows[0]?.snapshot;
    return snapshot ? new Uint8Array(snapshot) : null;
  }

  /**
   * Создаёт или обновляет снимок; одинаковое состояние повторно не увеличивает версию.
   * @param {string} sessionId - UUID сессии.
   * @param {Uint8Array} snapshot - Полное бинарное состояние Yjs-документа.
   * @returns {Promise<void>} Завершается после фиксации снимка в PostgreSQL.
   */
  async store(sessionId: string, snapshot: Uint8Array): Promise<void> {
    await this.pool.query(
      `INSERT INTO "SessionDocument" (
         "sessionId", "snapshot", "version", "createdAt", "updatedAt"
       )
       VALUES ($1, $2, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT ("sessionId") DO UPDATE
       SET "snapshot" = EXCLUDED."snapshot",
           "version" = "SessionDocument"."version" + 1,
           "updatedAt" = CURRENT_TIMESTAMP
       WHERE "SessionDocument"."snapshot" IS DISTINCT FROM EXCLUDED."snapshot"`,
      [sessionId, Buffer.from(snapshot)],
    );
  }

  /**
   * Закрывает соединения с PostgreSQL после финального сохранения.
   * @returns {Promise<void>} Завершается после остановки пула соединений.
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}

import type { SessionHint } from '../../../prisma/generated/client.ts';
import type { SessionUserSummary } from '../../sessions/sessions.types.ts';

export type SessionHintWithRequester = SessionHint & { requestedBy: SessionUserSummary };

export class SessionHintEntity implements SessionHint {
  id!: string;
  sessionId!: string;
  requestedById!: string;
  order!: number;
  text!: string;
  createdAt!: Date;
  requestedBy!: SessionUserSummary;

  constructor(partial: SessionHintWithRequester) {
    Object.assign(this, partial);
  }
}

/** Подсказки сессии и сколько ещё можно запросить. */
export class SessionHintsResponse {
  hints!: SessionHintEntity[];
  limit!: number;
  remaining!: number;

  constructor(partial: SessionHintsResponse) {
    Object.assign(this, partial);
  }
}

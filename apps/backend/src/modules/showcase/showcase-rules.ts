import type { SessionStatus } from '../../prisma/generated/enums.ts';
import { SHOWCASE_RESPONSE_COOLDOWN_HOURS } from './showcase.constants.ts';

const HOUR_MS = 60 * 60 * 1000;

/**
 * Когда можно откликнуться на карточку снова после отказа;
 */
export const retryAfterRejection = (response: { reviewedAt: Date | null; timeMismatch: boolean }): Date | null =>
  response.reviewedAt && !response.timeMismatch
    ? new Date(response.reviewedAt.getTime() + SHOWCASE_RESPONSE_COOLDOWN_HOURS * HOUR_MS)
    : null;

const ACTIVE_MEETING_STATUSES: SessionStatus[] = ['SCHEDULED', 'READY', 'ACTIVE'];

/** У принятого отклика есть действующая встреча */
export const hasActiveMeeting = (response: { status: string; session: { status: SessionStatus } | null }): boolean =>
  response.status === 'ACCEPTED' && response.session !== null && ACTIVE_MEETING_STATUSES.includes(response.session.status);

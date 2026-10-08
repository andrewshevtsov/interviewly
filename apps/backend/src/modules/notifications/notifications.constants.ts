export const NOTIFICATIONS_QUEUE = 'notifications';

// Событие -> сообщения конкретным людям; доставка каждому - отдельное задание с повторами
export const EVENT_JOB = {
  responseCreated: 'response-created',
  responseAccepted: 'response-accepted',
  responseRejected: 'response-rejected',
  sessionCancelled: 'session-cancelled',
  sessionReminder: 'session-reminder',
} as const;
export const DELIVER_JOB = 'deliver';

// За сколько часов до встречи бот присылает ссылку на комнату
export const REMINDER_LEAD_HOURS = 2;

export const DELIVER_ATTEMPTS = 5;
export const DELIVER_BACKOFF_MS = 5_000;
// Сколько хранить выполненные задания: за это время одинаковый jobId не создаст дубль сообщения
export const COMPLETED_JOBS_TTL_SECONDS = 24 * 60 * 60;
export const FAILED_JOBS_TTL_SECONDS = 7 * 24 * 60 * 60;

// Если Redis недоступен, основной запрос (принять отклик, отменить встречу) не должен висеть
export const ENQUEUE_TIMEOUT_MS = 3_000;

export const PROCESSOR_CONCURRENCY = 5;

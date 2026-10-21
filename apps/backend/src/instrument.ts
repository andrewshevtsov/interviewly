import * as Sentry from '@sentry/nestjs';
import { scrubEvent } from './infrastructure/sentry/scrub-event.ts';

// Должен импортироваться первым в main.ts. Без SENTRY_DSN (локальная разработка) SDK ничего не отправляет.
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  // По умолчанию SDK собирает cookie, заголовки, тела запросов, user и локальные переменные - отключаем всё
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: false,
    httpBodies: [],
    urlQueryParams: false,
    databaseQueryData: false,
    queues: false,
    stackFrameVariables: false,
  },
  // Вторая линия защиты, если что-то из этого всё же попадёт в событие
  beforeSend: scrubEvent,
});

import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { MetricsService } from './metrics.service.ts';

const UNMATCHED_ROUTE = 'unmatched';

/**
 * Middleware, а не interceptor: interceptor не вызывается, если запрос отклонил guard (401/403),
 * а такие ответы и 404 тоже нужны в метриках.
 */
@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private readonly metrics: MetricsService) {}

  use(request: Request, response: Response, next: NextFunction): void {
    const stopTimer = this.metrics.httpDuration.startTimer();

    response.on('finish', () => {
      // Шаблон маршрута (/sessions/:id), а не реальный URL
      const routePath = (request.route as { path?: string } | undefined)?.path;
      const route = routePath
        ? `${request.baseUrl}${routePath}`
        : UNMATCHED_ROUTE;
      stopTimer({ method: request.method, route, status: response.statusCode });
    });
    next();
  }
}

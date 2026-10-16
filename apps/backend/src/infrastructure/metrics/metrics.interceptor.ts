import {
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, finalize } from 'rxjs';
import { MetricsService } from './metrics.service.ts';

const UNMATCHED_ROUTE = 'unmatched';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const stopTimer = this.metrics.httpDuration.startTimer();

    // finalize срабатывает и на ошибках, статус берём после обработки исключения
    return next.handle().pipe(
      finalize(() => {
        // Шаблон маршрута (/sessions/:id), не реальный URL
        const routePath = (request.route as { path?: string } | undefined)
          ?.path;
        const route = routePath
          ? `${request.baseUrl}${routePath}`
          : UNMATCHED_ROUTE;
        stopTimer({
          method: request.method,
          route,
          status: response.statusCode,
        });
      }),
    );
  }
}

import type { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { EventEmitter } from 'node:events';
import { describe, expect, it, vi } from 'vitest';
import { MetricsMiddleware } from './metrics.middleware.ts';
import { MetricsService } from './metrics.service.ts';

function setup() {
  const metrics = new MetricsService({ get: () => undefined } as unknown as ConfigService);
  return { metrics, middleware: new MetricsMiddleware(metrics) };
}

/** Прогоняет запрос через middleware и завершает ответ с заданным статусом */
function run(middleware: MetricsMiddleware, request: object, statusCode: number): void {
  const response = Object.assign(new EventEmitter(), { statusCode });
  const next = vi.fn();

  middleware.use(request as Request, response as unknown as Response, next);
  response.emit('finish');

  expect(next).toHaveBeenCalledOnce();
}

describe('MetricsMiddleware', () => {
  it('записывает запрос с шаблоном маршрута, а не реальным URL', async () => {
    const { metrics, middleware } = setup();

    run(middleware, { method: 'GET', baseUrl: '', route: { path: '/sessions/:id' }, url: '/sessions/42' }, 200);

    const output = await metrics.getMetrics();
    expect(output).toContain('route="/sessions/:id"');
    expect(output).toContain('status="200"');
    expect(output).not.toContain('/sessions/42');
  });

  it('учитывает ответ guard-а (401) на существующем маршруте', async () => {
    const { metrics, middleware } = setup();

    run(middleware, { method: 'GET', baseUrl: '', route: { path: '/sessions' } }, 401);

    expect(await metrics.getMetrics()).toContain('route="/sessions",status="401"');
  });

  it('помечает запрос без маршрута (404) как unmatched', async () => {
    const { metrics, middleware } = setup();

    run(middleware, { method: 'GET', baseUrl: '' }, 404);

    expect(await metrics.getMetrics()).toContain('route="unmatched",status="404"');
  });
});

import type { CallHandler, ExecutionContext } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { lastValueFrom, of, throwError } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { MetricsInterceptor } from './metrics.interceptor.ts';
import { MetricsService } from './metrics.service.ts';

function createContext(request: object, response: object, type = 'http'): ExecutionContext {
  return {
    getType: () => type,
    switchToHttp: () => ({ getRequest: () => request, getResponse: () => response }),
  } as unknown as ExecutionContext;
}

function setup() {
  const metrics = new MetricsService({ get: () => undefined } as unknown as ConfigService);
  return { metrics, interceptor: new MetricsInterceptor(metrics) };
}

describe('MetricsInterceptor', () => {
  it('записывает запрос с шаблоном маршрута, а не реальным URL', async () => {
    const { metrics, interceptor } = setup();
    const request = { method: 'GET', baseUrl: '', route: { path: '/sessions/:id' }, url: '/sessions/42' };
    const handler: CallHandler = { handle: () => of('ok') };

    await lastValueFrom(interceptor.intercept(createContext(request, { statusCode: 200 }), handler));

    const output = await metrics.getMetrics();
    expect(output).toContain('route="/sessions/:id"');
    expect(output).toContain('status="200"');
    expect(output).not.toContain('/sessions/42');
  });

  it('учитывает запрос, завершившийся ошибкой', async () => {
    const { metrics, interceptor } = setup();
    const request = { method: 'POST', baseUrl: '', route: { path: '/auth/login' } };
    const handler: CallHandler = { handle: () => throwError(() => new Error('boom')) };

    await expect(
      lastValueFrom(interceptor.intercept(createContext(request, { statusCode: 500 }), handler)),
    ).rejects.toThrow('boom');

    expect(await metrics.getMetrics()).toContain('status="500"');
  });

  it('помечает запрос без маршрута как unmatched', async () => {
    const { metrics, interceptor } = setup();
    const request = { method: 'GET', baseUrl: '' };
    const handler: CallHandler = { handle: () => of(null) };

    await lastValueFrom(interceptor.intercept(createContext(request, { statusCode: 404 }), handler));

    expect(await metrics.getMetrics()).toContain('route="unmatched"');
  });

  it('пропускает не-HTTP контексты без записи метрик', async () => {
    const { metrics, interceptor } = setup();
    const handler: CallHandler = { handle: () => of('ws') };

    await lastValueFrom(interceptor.intercept(createContext({}, {}, 'ws'), handler));

    expect(await metrics.getMetrics()).not.toContain('http_request_duration_seconds_count');
  });
});

import type { ConfigService } from '@nestjs/config';
import { describe, expect, it } from 'vitest';
import { MetricsService } from './metrics.service.ts';

describe('MetricsService', () => {
  it('считает продуктовые события по имени', async () => {
    const metrics = new MetricsService({ get: () => undefined } as unknown as ConfigService);

    metrics.countEvent('session_created');
    metrics.countEvent('session_created');
    metrics.countEvent('user_registered');

    const output = await metrics.getMetrics();
    expect(output).toContain('app_events_total{event="session_created"} 2');
    expect(output).toContain('app_events_total{event="user_registered"} 1');
  });
});

import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createServer, type Server } from 'node:http';
import { Histogram, Registry, collectDefaultMetrics } from 'prom-client';

const DEFAULT_METRICS_PORT = 9100;
const METRICS_PATH = '/metrics';

/**
 * Метрики отдаются на отдельном порту, а не через основное приложение: Caddy проксирует
 * весь /api/* в backend, и /metrics на основном порту стал бы публичным.
 */
@Injectable()
export class MetricsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MetricsService.name);
  private readonly registry = new Registry();
  private server?: Server;

  readonly httpDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Длительность HTTP-запросов',
    labelNames: ['method', 'route', 'status'],
    registers: [this.registry],
  });

  constructor(private readonly configService: ConfigService) {
    collectDefaultMetrics({ register: this.registry });
  }

  getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  onModuleInit(): void {
    const port = Number(this.configService.get<string>('METRICS_PORT') ?? DEFAULT_METRICS_PORT);

    this.server = createServer((req, res) => {
      if (req.url !== METRICS_PATH) {
        res.writeHead(404).end();
        return;
      }
      this.getMetrics()
        .then((body) => {
          res.writeHead(200, { 'Content-Type': this.registry.contentType });
          res.end(body);
        })
        .catch((error: unknown) => {
          this.logger.error('Не удалось собрать метрики', error);
          res.writeHead(500).end();
        });
    });
    // Падение сервера метрик не должно ронять основное приложение
    this.server.on('error', (error) => this.logger.error(`Сервер метрик (порт ${port})`, error));
    this.server.listen(port);
  }

  onModuleDestroy(): void {
    this.server?.close();
  }
}

import { Global, type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { MetricsMiddleware } from './metrics.middleware.ts';
import { MetricsService } from './metrics.service.ts';

@Global()
@Module({
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(MetricsMiddleware).forRoutes('*path');
  }
}

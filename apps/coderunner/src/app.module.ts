import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { resolve } from 'node:path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ExecutionModule } from './execution/execution.module';

/** Корневой модуль coderunner с глобальной конфигурацией из переменных окружения. */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Все приложения monorepo используют единый корневой .env.
      envFilePath: resolve(process.cwd(), '../../.env'),
    }),
    ExecutionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

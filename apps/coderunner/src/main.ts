import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

/** Создаёт HTTP-приложение coderunner и включает общие защитные настройки входа. */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // DTO отбрасывают неизвестные поля и останавливают неверный запрос до обращения к Piston.
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  // Compose задаёт PORT, а локальный запуск читает CODERUNNER_PORT из корневого .env.
  await app.listen(process.env.PORT ?? process.env.CODERUNNER_PORT ?? 3003);
}
void bootstrap();

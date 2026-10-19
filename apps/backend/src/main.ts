import 'reflect-metadata';
import cookieParser from 'cookie-parser';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.ts';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  // Credentials нужны, чтобы браузер отправлял httpOnly-куку с refresh-токеном
  // на запросы с фронтенда (см. shared/api/http-client.ts в apps/frontend).
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  });
  // Swagger UI: /api (локально http://localhost:4000/api), OpenAPI JSON: /api-json
  const config = new DocumentBuilder()
    .setTitle('Interviewly API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const port = Number(process.env.BACKEND_PORT);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error('BACKEND_PORT не задан или некорректен (см. .env.example)');
  }
  await app.listen(port);
}

void bootstrap();

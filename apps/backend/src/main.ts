import 'reflect-metadata';
import { config } from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.ts';
import { fileURLToPath } from 'url';

config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)) });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();

import 'reflect-metadata';
import path from 'node:path';
import { config } from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.ts';

config({ path: path.resolve(process.cwd(), '../../.env') });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.BACKEND_PORT);
  await app.listen(port);
  console.log(`Backend listening on port ${port}`);
}
await bootstrap();

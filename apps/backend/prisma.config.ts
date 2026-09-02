import path from 'node:path';
import { config } from 'dotenv';
import { defineConfig, env } from 'prisma/config';

// Prisma CLI запускается из apps/backend, а общий .env лежит в корне
// монорепозитория. Загружаем его явно до чтения DATABASE_URL ниже.
config({ path: path.resolve(process.cwd(), '../../.env') });

export default defineConfig({
  // Передаём всю директорию: Prisma рекурсивно объединит schema.prisma
  // и доменные файлы из prisma/models в одну схему.
  schema: 'prisma',
  migrations: {
    // SQL-миграции хранятся рядом с главным schema.prisma и коммитятся в git.
    path: path.join('prisma', 'migrations'),
  },
  datasource: {
    // Адрес PostgreSQL обязателен: env() сразу завершит команду с понятной
    // ошибкой, если DATABASE_URL отсутствует в корневом .env.
    url: env('DATABASE_URL'),
  },
});

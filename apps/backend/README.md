## Project setup

```bash
$ pnpm install
```

## PostgreSQL and Prisma setup

Команды выполняются из корня монорепозитория. После первого клонирования проекта:

```bash
# Создать локальный файл окружения
cp .env.example .env

# Запустить только PostgreSQL в Docker в фоновом режиме
docker compose up -d postgres

# Применить закоммиченные миграции к локальной базе
pnpm --filter backend exec prisma migrate dev

# Сгенерировать Prisma Client
pnpm --filter backend exec prisma generate

# Заполнить локальную базу тестовыми данными
pnpm --filter backend exec prisma db seed
```

PostgreSQL доступен backend-приложению через `DATABASE_URL` из корневого `.env`. Шаги выше
(`prisma migrate dev`/`generate`/`db seed`) нужны только при запуске backend локально, вне
Docker — тогда Prisma CLI подключается к PostgreSQL по адресу `localhost:5432` (порт
проброшен наружу из контейнера `postgres`).

Если вместо этого вы поднимаете backend через `docker compose up --build` (сервис
`backend` в корневом `docker-compose.yml`), эти шаги выполнять не нужно: контейнер сам
запускает `prisma generate && prisma migrate deploy && prisma db seed` при старте и
подключается к `postgres` по имени сервиса внутри Docker-сети, а не через `localhost`.

Seed предназначен для локальной разработки и создаёт 5 пользователей, 3 сессии и 6
участий в сессиях. Скрипт использует `upsert`, поэтому его можно безопасно запускать
повторно после применения миграций.

Проверить состояние схемы и миграций:

```bash
pnpm --filter @app/backend exec prisma validate
pnpm --filter @app/backend exec prisma migrate status
```

Остановить контейнеры без удаления данных PostgreSQL:

```bash
docker compose down
```

Данные хранятся в Docker volume `postgres_data`. Команда `docker compose down -v` удалит
этот volume вместе с локальными данными базы.

## Compile and run the project

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod

# docker compose in dev mode Backend-Frontend-PostgreSQL
$ docker compose up
```

## Run tests

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```

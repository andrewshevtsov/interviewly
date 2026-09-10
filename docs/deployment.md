# Деплой и инфраструктура

## Docker (локальная разработка)

`docker-compose.yml` в корне репозитория поднимает `apps/frontend`, `apps/backend` и
`postgres`:

```bash
cp .env.example .env
docker compose up --build
# frontend: http://localhost:3000
# backend:  http://localhost:4000
```

Исходники пробрасываются в контейнеры bind-mount'ом (`.:/app`) для hot-reload; `node_modules`
защищены от перезаписи именованными volume'ами (`frontend_node_modules`,
`backend_node_modules`).

### Postgres

Сервис `postgres` (`postgres:17-alpine`) поднимается вместе с остальными:

- Порт проброшен на хост как `${POSTGRES_PORT:-5432}`, но `backend`, запущенный в Docker,
  подключается к `postgres` по имени сервиса внутри сети `interviewly-network` (`DATABASE_URL`
  в `.env` указывает на хост `postgres`, а не `localhost`). Все три сервиса (`postgres`,
  `backend`, `frontend`) должны быть в одной сети `interviewly-network` — иначе backend не
  сможет разрезолвить хост `postgres` (ошибка Prisma `P1001: Can't reach database server`).
- Данные сохраняются в именованном volume `postgres_data` — переживают `docker compose down`
  (но не `docker compose down -v`).
- Есть healthcheck (`pg_isready`); `backend` стартует только после того, как `postgres`
  становится healthy (`depends_on: { condition: service_healthy }`).

### Backend

Сервис `backend` при каждом старте контейнера выполняет
`prisma generate && prisma migrate deploy && prisma db seed`, затем запускает
`nest start --watch`. Ручные шаги (`prisma migrate dev`/`generate`/`db seed`) нужны только
при запуске backend локально вне Docker — см. [docs/onboarding.md](onboarding.md).

### Prisma migrations

В локальной разработке используйте `prisma migrate dev`: команда создаёт и применяет
миграции. В production применяются только уже закоммиченные миграции командой
`prisma migrate deploy`; она не изменяет Prisma-схему и не создаёт новую миграцию.

Применённые `migration.sql` не редактируются. Дополнительные изменения базы, включая
PostgreSQL `CHECK`, индексы и триггеры, оформляются следующей миграцией.

# Деплой и инфраструктура

## Docker (локальная разработка)

`docker-compose.yml` в корне репозитория поднимает frontend, backend, collaboration,
coderunner, Piston, PostgreSQL и LiveKit:

```bash
cp .env.example .env
docker compose up -d --build
# frontend: http://localhost:3000
# backend:  http://localhost:4000
# coderunner: http://localhost:3003
```

Исходники пробрасываются в контейнеры bind-mount'ом (`.:/app`) для hot-reload; `node_modules`
защищены от перезаписи именованными volume'ами (`frontend_node_modules`,
`backend_node_modules`, `collaboration_node_modules`, `coderunner_node_modules`).

### Coderunner и Piston

`coderunner` принимает код напрямую от frontend, передаёт JWT основному backend для
проверки участия пользователя в сессии и только после успешной проверки вызывает Piston
по внутреннему адресу `http://piston:2000`.

При первом старте одноразовый `piston-init` устанавливает зафиксированные runtime Python,
JavaScript и TypeScript. Они сохраняются в `piston_data`, поэтому повторно не скачиваются.
Статус `Exited (0)` у `piston-init` после запуска — ожидаемое успешное состояние.

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

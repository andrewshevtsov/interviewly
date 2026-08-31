# Деплой и инфраструктура

## Docker (локальная разработка)

`docker-compose.yml` в корне репозитория поднимает `apps/frontend` и `postgres`:

```bash
cp .env.example .env
docker compose up --build
# http://localhost:3000
```

Исходники пробрасываются в контейнер bind-mount'ом (`.:/app`) для hot-reload; `node_modules`
защищены от перезаписи именованными volume'ами (`frontend_node_modules`,
`frontend_root_node_modules`).

### Postgres

Сервис `postgres` (`postgres:17-alpine`) поднимается вместе с остальными:

- Порт проброшен на хост как `${POSTGRES_PORT:-5432}` — backend (запущенный локально, вне
  Docker) подключается через `localhost`, используя `DATABASE_URL` из `.env`.
- Данные сохраняются в именованном volume `postgres_data` — переживают `docker compose down`
  (но не `docker compose down -v`).
- Есть healthcheck (`pg_isready`), учитывайте это, если добавите сервисы, которые должны
  ждать готовности БД через `depends_on: { condition: service_healthy }`.
- `backend` пока не контейнеризован — появится отдельным сервисом в `docker-compose.yml`
  позже, вместе с полной Docker-инициализацией NestJS.

### Prisma migrations

В локальной разработке используйте `prisma migrate dev`: команда создаёт и применяет
миграции. В production применяются только уже закоммиченные миграции командой
`prisma migrate deploy`; она не изменяет Prisma-схему и не создаёт новую миграцию.

Применённые `migration.sql` не редактируются. Дополнительные изменения базы, включая
PostgreSQL `CHECK`, индексы и триггеры, оформляются следующей миграцией.

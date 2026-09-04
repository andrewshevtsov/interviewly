# Онбординг

Гайд по настройке окружения. Если нужен просто быстрый старт — см. корневой
[README.md](../README.md), здесь — то же самое, но подробнее и с объяснением "почему".

## Требования

- Node.js `>=22.13.0` (зафиксировано в `engines` корневого `package.json`; для нативного ESM +
  decorators без предупреждений рекомендуется именно Node 22)
- pnpm `11.21.0` — не обязательно ставить вручную: Corepack (идёт в комплекте с Node 20+)
  сам поднимет нужную версию по полю `packageManager` в корневом `package.json`
- Docker + Docker Compose — если нужно поднять сервисы в контейнерах
  вместо локального запуска

## Установка

```bash
git clone <url-репозитория>
cd interviewly
pnpm install
```

`pnpm install` ставит зависимости для всех пакетов workspace (`apps/*`) одной командой.

## Подготовка PostgreSQL и Prisma

После установки зависимостей подготовьте локальную базу перед запуском приложений:

```bash
# 1. Создать локальный файл окружения (выполняется один раз после клонирования)
cp .env.example .env

# 2. Запустить PostgreSQL в Docker в фоновом режиме
docker compose up -d postgres

# 3. Применить закоммиченные миграции к локальной базе
pnpm --filter backend exec prisma migrate dev

# 4. Сгенерировать Prisma Client для backend
pnpm --filter backend exec prisma generate

# 5. Заполнить локальную базу тестовыми данными (необязательно)
pnpm --filter backend exec prisma db seed
```

После этого PostgreSQL продолжает работать в Docker, а frontend и backend запускаются
отдельными командами из следующего раздела. Остановить инфраструктуру можно командой
`docker compose down`; данные PostgreSQL сохранятся в именованном volume `postgres_data`.

Seed предназначен только для локальной разработки. Он создаёт 5 пользователей, 3 сессии
и 6 участий в сессиях через `upsert`, поэтому повторный запуск обновляет те же записи и не
создаёт дубликаты. Запускайте seed после применения миграций и генерации Prisma Client.

## Запуск приложений локально (без Docker)

Каждый пакет запускается независимо через `pnpm --filter`:

```bash
pnpm --filter @app/frontend run dev   # http://localhost:3000
pnpm --filter @app/backend run dev    # http://localhost:4000
```

Подробности про каждое приложение (текущее состояние, переменные окружения, что именно
сейчас запущено) — в `README.md` внутри `apps/frontend` и `apps/backend`.

## Запуск через Docker

`docker-compose.yml` поднимает `frontend`, `backend` и `postgres` (подробности — в
[docs/deployment.md](deployment.md)):

```bash
# Подготовка (выполняется один раз)
cp .env.example .env

# Запуск всех сервисов
docker compose up --build

# Запуск только базы (фон)
docker compose up -d postgres

# Остановка всех сервисов
docker compose down

# Полная очистка (включая volumes)
docker compose down -v
```

**Сервисы и порты:**
- `frontend`: http://localhost:3000 (Next.js с hot-reload)
- `backend`: http://localhost:4001 (NestJS API)
- `postgres`: localhost:5432 (БД, доступна через `DATABASE_URL`)

**Оптимизация:**
- Общий `node_modules` volume (`node_modules`) разделяется между frontend и backend для экономии места
- Bind mount (`.:/app`) позволяет видеть изменения кода в реальном времени
- Автоматическая переустановка зависимостей при изменении `package.json`

## Backend в Docker

**Команда для отладки контейнера:**
```bash
docker exec -it interviewly-backend-1 sh
# Или пересоздать с интерактивным shell:
docker compose run --rm backend sh
```

**Устранение проблем:**

Если возникают конфликты node_modules:
```bash
# Удалить локальные node_modules и пересоздать контейнер
rm -rf node_modules apps/*/node_modules
docker compose down -v
docker compose up --build
```

## Переменные окружения

Шаблон — `.env.example` в корне репозитория. Скопируйте его в `.env`, дефолтные значения
подходят для локальной разработки (не секретны, не идут в прод).

`DATABASE_URL` (и `POSTGRES_USER`/`POSTGRES_PASSWORD`/`POSTGRES_DB`/`POSTGRES_PORT`) нужны
backend'у для подключения к postgres через Prisma.

## Prisma и миграции

Prisma-схема backend разбита по предметным областям:

```text
apps/backend/prisma/
├── schema.prisma       # datasource и генератор Prisma Client
├── models/             # модели и enum
└── migrations/         # применяемая по порядку история SQL-изменений БД
```

Основные команды запускаются из корня монорепозитория через фильтр backend:

```bash
pnpm --filter backend exec prisma validate       # проверить схему
pnpm --filter backend exec prisma migrate status # проверить состояние миграций
pnpm --filter backend exec prisma generate       # обновить Prisma Client
```

После изменения моделей новую dev-миграцию создают командой:

```bash
pnpm --filter backend exec prisma migrate dev --name <короткое-название>
```

Файлы уже применённых миграций не редактируют: Prisma хранит их checksum в базе. Если
нужно изменить существующую структуру, создайте следующую миграцию. Ручные PostgreSQL
`CHECK` и триггеры находятся в SQL миграций, потому что они не выражаются текущей
Prisma-схемой полностью.

## Docker Compose — практические сценарии

**Первый запуск:**
```bash
cp .env.example .env
docker compose up --build
```

**Быстрый перезапуск (без пересборки):**
```bash
docker compose restart
```

**Пересборка только frontend:**
```bash
docker compose up -d --build frontend
```


**Проверка статуса:**
```bash
docker compose ps                    # Список запущенных контейнеров
docker compose top                   # Процессы внутри контейнеров
```

**Остановка:**
```bash
docker compose stop                  # Мягко остановить (сохранить state)
docker compose down                  # Остановить и удалить контейнеры
docker compose down -v               # + удалить volumes (БД будет пересоздана)
```

**Монорепозиторий в Docker:**
- Все приложения (`frontend`, `backend`) используют одну Prisma schema из `apps/backend/prisma/`
- Общий `node_modules` volume экономит место и согласованность версий
- Если изменить `package.json` → Docker автоматически переустановит зависимости при `docker compose up`

## Проверка окружения

```bash
pnpm typecheck     # tsc --noEmit по всем пакетам
pnpm format:check  # проверка форматирования Prettier
```

Соглашения по стилю кода и коммитов — в [docs/style-guide.md](style-guide.md).

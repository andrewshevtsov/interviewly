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

## Запуск приложений локально (без Docker)

Каждый пакет запускается независимо через `pnpm --filter`:

```bash
pnpm --filter @app/frontend run dev   # http://localhost:3000
pnpm --filter @app/backend run dev    # http://localhost:4000
```

Подробности про каждое приложение (текущее состояние, переменные окружения, что именно
сейчас запущено) — в `README.md` внутри `apps/frontend` и `apps/backend`.

## Запуск через Docker

`docker-compose.yml` поднимает `frontend` (подробности — в [docs/deployment.md](deployment.md)):

```bash
cp .env.example .env
docker compose up --build
```

## Переменные окружения

Шаблон — `.env.example` в корне репозитория. Скопируйте его в `.env`, дефолтные значения
подходят для локальной разработки (не секретны, не идут в прод).

## Проверка окружения

```bash
pnpm typecheck     # tsc --noEmit по всем пакетам
pnpm format:check  # проверка форматирования Prettier
```

Соглашения по стилю кода и коммитов — в [docs/style-guide.md](style-guide.md).

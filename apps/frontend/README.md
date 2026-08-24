# @app/frontend

Next.js (App Router) фронтенд (пакет `apps/frontend`, см.
[docs/architecture](../../docs/architecture/README.md)). `src/*` организован по слоям
Feature-Sliced Design.

## Текущее состояние

- `app/` — Next.js App Router (роутинг, `layout.tsx`/`page.tsx`), **в корне пакета, а не в
  `src/`**. Это сделано намеренно: если `src/app` существует, Next.js резолвит `src/` как базовую
  директорию и для App, и для Pages Router — и начинает трактовать `src/pages` (слой FSD, а не
  Next.js) как страницы Pages Router, из-за чего `next build` падает. Разместив `app/` в корне,
  мы этого избегаем; `src/app` при этом остаётся FSD-слоем `app` для будущей композиции
  (провайдеры и т.п.).
- `pages/` — пустая плейсхолдер-папка в корне (см. [pages/README.md](pages/README.md)). Нужна,
  чтобы Next.js резолвил Pages Router в неё (пустую) и не пытался использовать `src/pages`.

## Пример роутинга

Демонстрационные роуты (для тех, кто впервые видит связку Next.js App Router + FSD):

```
app/
├── layout.tsx              # корневой layout: общая навигация (Interviewly → "/")
├── page.tsx                 → @/pages/home-page             ("/")
├── demo-data.ts             # захардкоженные фикстуры user/sessions для примера, не часть FSD
└── sessions/
    ├── layout.tsx           # вложенный layout: секция "Sessions" внутри корневого
    ├── page.tsx              → @/pages/sessions-list-page    ("/sessions")
    └── [sessionId]/
        └── page.tsx          → @/pages/interview-session-page ("/sessions/:sessionId")
```

Идея: файлы в `app/**` — тонкие "роуты", которые только читают URL/параметры и рендерят
компонент из `src/pages/*` (слой FSD). Бизнес-логика и разметка живут в `src/pages`, а не в
`app/`. Переходы между страницами — обычные `<Link href="...">` из `next/link` (см.
`HomePage`, `SessionsListPage`, `InterviewSessionPage`); `app/sessions/layout.tsx` показывает
вложенный layout — он оборачивает и список, и страницу конкретной сессии, не трогая
корневой `app/layout.tsx`.

## Запуск

```bash
pnpm --filter @app/frontend run dev
# http://localhost:3000
```

## Запуск через Docker

```bash
cp ../../.env.example ../../.env   # из корня репозитория: cp .env.example .env
docker compose up --build          # из корня репозитория
# http://localhost:3000
```

Детали устройства compose-файла — в [docs/deployment.md](../../docs/deployment.md).

## Структура: Feature-Sliced Design

```
src/
├── app/       # инициализация приложения, композиция pages (см. также app/ в корне пакета)
├── pages/     # конкретные страницы (собирают widgets/features/entities)
├── widgets/   # крупные блоки UI из нескольких features/entities
├── features/  # пользовательские сценарии
├── entities/  # бизнес-сущности (session, user)
└── shared/    # переиспользуемый код без бизнес-логики (lib/, config/)
```

Правило: слой не может импортировать из того, что лежит **выше** него в этом списке
(например, `entities` не может импортировать из `features`). Валидная цепочка импортов —
`app → pages → widgets → features → entities → shared`, через алиас `@/*`. Это правило
проверяется линтером (`eslint-plugin-boundaries`, правило `boundaries/dependencies`).

## Переменные окружения

- `PORT` — порт Next.js dev/prod-сервера (по умолчанию `3000`).

## Типы и линт

```bash
pnpm --filter @app/frontend run typecheck
pnpm --filter @app/frontend run lint
```

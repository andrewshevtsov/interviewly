# Style guide

Правила оформления кода и коммитов, общие для всего монорепозитория.

## Форматирование

Prettier настроен отдельно в каждом пакете — `apps/frontend/.prettierrc.json` и
`apps/backend/.prettierrc` (+ соответствующие `.prettierignore`), в корне репозитория Prettier
не установлен. Отступы/переносы строк/EOL для файлов корня — через `.editorconfig`.

```bash
pnpm --filter @app/frontend run format        # применить форматирование к frontend
pnpm --filter @app/frontend run format:check  # проверить frontend без изменений (для CI)
pnpm --filter @app/backend run format         # применить форматирование к backend
pnpm --filter @app/backend run format:check   # проверить backend без изменений (для CI)
```

Файлы в корне репозитория (README.md, docker-compose.yml, docs/, конфиги воркспейса и т.п.)
форматируются вручную.

## Модульная система: чистый ESM

Весь репозиторий — `"type": "module"` в каждом `package.json`.

## TypeScript

Общий базовый конфиг — `tsconfig.base.json` в корне, каждый пакет расширяет его своим
`tsconfig.json`. Не дублировать в пакетах то, что уже задано в базовом конфиге.

## Структура фронтенда: Feature-Sliced Design

`apps/frontend/src` организован по слоям FSD (`app → pages → widgets → features → entities →
shared`, сверху вниз — слой не должен импортировать из того, что лежит выше него).

## Коммиты

Формат: `<номер (тип)>: <краткое описание>`.

Типы: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`.

Пример: `IN-999 (fix): убрать дублирующийся health-check в docker-compose`.

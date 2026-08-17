# Style guide

Правила оформления кода и коммитов, общие для всего монорепозитория.

## Форматирование

Форматирование — через **Prettier**, конфиг в `.prettierrc.json` (+ `.prettierignore`).
Отступы/переносы строк/EOL — через `.editorconfig`.

```bash
pnpm format        # применить форматирование ко всему репозиторию
pnpm format:check  # проверить без изменений (для CI)
```

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

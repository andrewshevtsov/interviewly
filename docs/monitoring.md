# Мониторинг

Prometheus + Grafana в docker compose, profile `monitoring`.

```bash
docker compose --profile monitoring up -d
```

- Grafana: http://localhost:3001 (логин/пароль из `GRAFANA_ADMIN_USER` / `GRAFANA_ADMIN_PASSWORD`)
- Prometheus: http://localhost:9090
- Источники: backend (`backend:9100`, отдельный порт `METRICS_PORT`), LiveKit (`:6789`),
  postgres-exporter, redis-exporter, cAdvisor. Порты метрик наружу не публикуются.

## Дашборды

JSON в `infra/grafana/dashboards/` подхватываются автоматически (API, Node.js, Инфраструктура,
LiveKit, Продукт). Правки в UI не сохраняются: меняйте JSON в репозитории.

### Дашборд «Продукт»

- SQL-панели читают Postgres под ролью `grafana_reader` (только чтение, без `passwordHash`, email и
  прочих личных данных). Роль и права создаёт миграция backend, вход и пароль
  (`GRAFANA_DB_PASSWORD` из `.env`) включает скрипт:

  ```bash
  bash infra/postgres/grafana-reader.sh
  ```

  Локально запустите его один раз после миграций; на сервере его вызывает `server.sh`.
- Панель «События приложения» берёт счётчик `app_events_total` из Prometheus (регистрации, сессии,
  заявки, входы в комнату). Счётчик обнуляется при перезапуске backend, для истории есть SQL-панели.
- Новая таблица в дашборде требует нового `GRANT SELECT` в миграции.

## Прод: доступ к Grafana

Grafana доступна на `grafana.<домен>` через Caddy с Basic auth. Пока на сервере нет файла
с учётными данными, `server.sh` Grafana не публикует.

Один раз на сервере (рядом с `Caddyfile`, каталог `interviewly-caddy`):

```bash
echo "<логин> $(docker exec caddy caddy hash-password --plaintext '<пароль>')" > interviewly-caddy/grafana-basic-auth
```

Дальше деплой сам допишет блок Grafana в Caddyfile. Нужна DNS-запись `grafana.<домен>`.
Внутри Grafana остаётся собственный логин (`GRAFANA_ADMIN_PASSWORD` в `.env` на сервере,
при первом деплое заменяется на случайный).

## Ошибки: GlitchTip

Sentry-совместимый сборщик ошибок, один контейнер `glitchtip` (воркер внутри) и отдельная БД
`glitchtip-postgres`. Очередь и кэш на Postgres, Redis не нужен. Данные хранятся 30 дней
(`GLITCHTIP_RETENTION_DAYS`).

```bash
docker compose --profile errors up -d glitchtip glitchtip-postgres
```

- Локально: http://localhost:8000. Прод: `https://glitchtip.<домен>` (Caddy без Basic auth: DSN
  должны принимать события из браузеров, интерфейс защищён учётными записями GlitchTip).
- Секреты `GLITCHTIP_SECRET_KEY` и `GLITCHTIP_DB_PASSWORD` на сервере генерирует `server.sh`.
- Почта пока не настроена (`EMAIL_URL=consolemail://`): письма GlitchTip пишет в лог контейнера
  (`docker compose logs glitchtip`). Приглашения и уведомления об ошибках по почте не приходят.

### Первый запуск

1. Сразу после запуска откройте GlitchTip и зарегистрируйтесь: первый пользователь становится
   владельцем. Регистрация закрыта для остальных (`ENABLE_USER_REGISTRATION=False`), но до первой
   регистрации форма открыта всем, поэтому не откладывайте этот шаг после деплоя на прод.
2. Создайте организацию и проекты (backend, frontend, collaboration, coderunner).
3. DSN каждого проекта нужен приложениям (задачи по подключению SDK).

### Подключение backend к GlitchTip

- Переменная `SENTRY_DSN` в `.env` (DSN проекта `backend`: *Projects → backend → Settings*). Пустое значение
  отключает отправку, так работает локальная разработка. В Docker внутри сети используйте адрес
  `http://<ключ>@glitchtip:8000/<id проекта>`, на сервере публичный `https://<ключ>@glitchtip.<домен>/<id>`.
- В GlitchTip уходят только необработанные ошибки и 5xx. Ответы 4xx (400, 401, 404 и т. п.) не отправляются.
- Тела запросов, cookie, заголовки, query string, user и значения локальных переменных отключены в
  `src/instrument.ts` и дополнительно вычищаются в `scrubEvent`. В событие попадает только стек с
  кодом вокруг вызова (исходный текст, не значения).

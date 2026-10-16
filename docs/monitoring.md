# Мониторинг

Prometheus + Grafana в docker compose, profile `monitoring`.

```bash
docker compose --profile monitoring up -d
```

- Grafana: http://localhost:3001 (логин/пароль из `GRAFANA_ADMIN_USER` / `GRAFANA_ADMIN_PASSWORD`)
- Prometheus: http://localhost:9090
- Источники: backend (`backend:9100`, отдельный порт `METRICS_PORT`), LiveKit (`:6789`),
  postgres-exporter, redis-exporter, cAdvisor. Порты метрик наружу не публикуются.

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

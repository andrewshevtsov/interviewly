# Деплой и инфраструктура

## Docker (локальная разработка)

`docker-compose.yml` в корне репозитория поднимает `apps/frontend`:

```bash
cp .env.example .env
docker compose up --build
# http://localhost:3000
```

Исходники пробрасываются в контейнер bind-mount'ом (`.:/app`) для hot-reload; `node_modules`
защищены от перезаписи именованными volume'ами (`frontend_node_modules`,
`frontend_root_node_modules`).

#!/usr/bin/env bash
# Включает вход для роли grafana_reader и задаёт пароль GRAFANA_DB_PASSWORD из .env.
# Сама роль и права создаются миграцией backend; пока её нет, скрипт ждёт до 60 секунд.
# Повторный запуск безопасен. Запуск из любой папки: bash infra/postgres/grafana-reader.sh
# DOCKER - команда docker (на сервере может быть "sudo -n docker").
set -euo pipefail
cd "$(dirname "$0")/../.."

DOCKER="${DOCKER:-docker}"
env_value() { grep -m1 "^$1=" .env | cut -d= -f2- || true; }

password="$(env_value GRAFANA_DB_PASSWORD)"
user="$(env_value POSTGRES_USER)"
db="$(env_value POSTGRES_DB)"
: "${password:?Задайте GRAFANA_DB_PASSWORD в .env}"

psql_run() {
  $DOCKER compose exec -T postgres psql -U "${user:-interviewly}" -d "${db:-interviewly}" -v ON_ERROR_STOP=1 "$@"
}

for _ in $(seq 12); do
  if [ "$(psql_run -tA -c "SELECT 1 FROM pg_roles WHERE rolname = 'grafana_reader'")" = "1" ]; then
    psql_run -v pw="${password}" <<'SQL'
ALTER ROLE grafana_reader LOGIN PASSWORD :'pw';
SQL
    echo "grafana_reader: вход включён"
    exit 0
  fi
  sleep 5
done

echo "grafana_reader: роли нет (миграции backend ещё не применены), пропускаю"

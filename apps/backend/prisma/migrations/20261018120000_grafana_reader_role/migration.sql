-- Роль только для чтения для Grafana (дашборд «Продукт»). Вход и пароль включает
-- infra/postgres/grafana-reader.sh. Доступ минимальный: без passwordHash, task, email и т.п.
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'grafana_reader') THEN
    CREATE ROLE grafana_reader NOLOGIN;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO grafana_reader;

GRANT SELECT ("id", "type", "access", "status", "scheduledAt", "startedAt", "endedAt", "createdAt")
  ON "Session" TO grafana_reader;
GRANT SELECT ON "SessionParticipant" TO grafana_reader;
GRANT SELECT ON "SessionAccessRequest" TO grafana_reader;
GRANT SELECT ("id", "createdAt") ON "User" TO grafana_reader;

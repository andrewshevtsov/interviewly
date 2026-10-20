#!/usr/bin/env bash
# Запускается на сервере по SSH из GitHub Actions. Ставит недостающие пакеты,
# забирает репозиторий и поднимает сервисы. Повторный запуск ничего не ломает.
set -euo pipefail

: "${REPO:?}"
: "${GIT_TOKEN:?}"
: "${DEPLOY_PATH:?}"
: "${PUBLIC_HOST:?}"
: "${GIT_REF:?}"

SERVICE="${SERVICE:-}"
IMAGE="${IMAGE:-}"
GHCR_USER="${GHCR_USER:-}"
# Каталог с Caddyfile и Origin CA (вне клона приложения).
CADDY_DIR="${CADDY_DIR:-$(dirname "${DEPLOY_PATH}")/interviewly-caddy}"

export DEBIAN_FRONTEND=noninteractive

compose() {
  docker_cmd compose -f docker-compose.yml -f docker-compose.prod.yml "$@"
}

require_sudo() {
  if sudo -n true 2>/dev/null; then
    return 0
  fi
  echo "Пользователю ${USER} нужен passwordless sudo, чтобы доустановить пакеты."
  echo "На сервере от root: echo '${USER} ALL=(ALL) NOPASSWD:ALL' | tee /etc/sudoers.d/${USER} && chmod 440 /etc/sudoers.d/${USER}"
  exit 1
}

# IPv4 доменом не считаем: иначе Caddyfile и .env перепишутся на IP вместо домена.
is_domain_host() {
  [[ "${PUBLIC_HOST}" == *.* && "${PUBLIC_HOST}" != *:* && ! "${PUBLIC_HOST}" =~ ^[0-9.]+$ ]]
}

# wss:// через TLS-прокси (Caddy), без :7880/:1234 — иначе mixed content на https.
set_env_key() {
  local file="$1" key="$2" value="$3"
  if grep -q "^${key}=" "${file}" 2>/dev/null; then
    sed -i "s|^${key}=.*|${key}=${value}|" "${file}"
  else
    printf '%s=%s\n' "${key}" "${value}" >> "${file}"
  fi
}

ensure_prod_public_urls() {
  local env_file="$1"
  if ! is_domain_host; then
    return 0
  fi
  set_env_key "${env_file}" FRONTEND_URL "https://${PUBLIC_HOST}"
  set_env_key "${env_file}" NEXT_PUBLIC_API_URL "https://${PUBLIC_HOST}/api"
  set_env_key "${env_file}" LIVEKIT_URL "wss://livekit.${PUBLIC_HOST}"
  set_env_key "${env_file}" NEXT_PUBLIC_COLLABORATION_URL "wss://collaboration.${PUBLIC_HOST}"
  set_env_key "${env_file}" GRAFANA_ROOT_URL "https://grafana.${PUBLIC_HOST}"
  set_env_key "${env_file}" GLITCHTIP_DOMAIN "https://glitchtip.${PUBLIC_HOST}"
  set_env_key "${env_file}" FRONTEND_SCRIPT start
  if grep -q '^DEV_TUNNEL_ORIGIN=' "${env_file}"; then
    sed -i "s|^DEV_TUNNEL_ORIGIN=.*|DEV_TUNNEL_ORIGIN=${PUBLIC_HOST},www.${PUBLIC_HOST}|" "${env_file}"
  else
    printf 'DEV_TUNNEL_ORIGIN=%s,www.%s\n' "${PUBLIC_HOST}" "${PUBLIC_HOST}" >> "${env_file}"
  fi
}

# Пароль-заглушку из .env.example (или отсутствующий ключ) на сервере не оставляем.
ensure_generated_secret() {
  local env_file="$1" key="$2"
  if ! grep -q "^${key}=" "${env_file}" || grep -qx "${key}=password_change_me" "${env_file}"; then
    set_env_key "${env_file}" "${key}" "$(head -c 24 /dev/urandom | base64 | tr -dc 'A-Za-z0-9')"
  fi
}

# Grafana публикуем только если задан Basic auth (файл "логин bcrypt-хеш", см. docs/monitoring.md).
append_grafana_caddy() {
  local snippet="${DEPLOY_PATH}/infra/caddy/grafana.caddy"
  local auth_file="${CADDY_DIR}/grafana-basic-auth"
  local user hash
  if [ ! -f "${snippet}" ] || [ ! -f "${auth_file}" ]; then
    echo "Нет ${auth_file}: Grafana не публикуется через Caddy."
    return 0
  fi
  if [ ! -r "${auth_file}" ]; then
    echo "Нет прав на чтение ${auth_file} у пользователя ${USER}: выполните sudo chown ${USER}: ${auth_file}"
    exit 1
  fi
  read -r user hash < "${auth_file}"
  printf '\n' >> "${CADDY_DIR}/Caddyfile"
  sed -e "s/interviewly\\.top/${PUBLIC_HOST}/g" \
    -e "s|__GRAFANA_AUTH_USER__|${user}|" \
    -e "s|__GRAFANA_AUTH_HASH__|${hash}|" "${snippet}" >> "${CADDY_DIR}/Caddyfile"
}

# GlitchTip доступен без Basic auth: DSN-эндпоинты должны принимать события из браузеров,
# вход в интерфейс защищён его собственными учётными записями.
append_glitchtip_caddy() {
  local snippet="${DEPLOY_PATH}/infra/caddy/glitchtip.caddy"
  if [ ! -f "${snippet}" ]; then
    return 0
  fi
  printf '\n' >> "${CADDY_DIR}/Caddyfile"
  sed "s/interviewly\\.top/${PUBLIC_HOST}/g" "${snippet}" >> "${CADDY_DIR}/Caddyfile"
}

sync_caddyfile() {
  local template="${DEPLOY_PATH}/infra/caddy/Caddyfile"
  if [ ! -f "${template}" ]; then
    return 0
  fi
  mkdir -p "${CADDY_DIR}"
  # Подставляем домен деплоя вместо шаблонного interviewly.top.
  sed "s/interviewly\\.top/${PUBLIC_HOST}/g" "${template}" > "${CADDY_DIR}/Caddyfile"
  append_grafana_caddy
  append_glitchtip_caddy
  if docker_cmd ps -a --format '{{.Names}}' | grep -qx caddy; then
    # Caddyfile примонтирован в контейнер read-only из CADDY_DIR: docker cp и запись изнутри
    # невозможны. Файл выше перезаписан на месте (тот же inode), контейнеру остаётся его перечитать.
    # При `admin off` reload недоступен, тогда перезапускаем контейнер.
    docker_cmd exec caddy caddy reload --config /etc/caddy/Caddyfile 2>/dev/null \
      || docker_cmd restart caddy
  fi
}

if ! command -v git >/dev/null 2>&1 || ! command -v curl >/dev/null 2>&1; then
  require_sudo
  if command -v apt-get >/dev/null 2>&1; then
    sudo -n apt-get update
    sudo -n apt-get install -y ca-certificates curl git
  elif command -v dnf >/dev/null 2>&1; then
    sudo -n dnf install -y ca-certificates curl git
  elif command -v yum >/dev/null 2>&1; then
    sudo -n yum install -y ca-certificates curl git
  else
    echo "Не найден apt-get, dnf или yum. Поставьте git и curl вручную."
    exit 1
  fi
fi

if ! docker info >/dev/null 2>&1 || ! docker compose version >/dev/null 2>&1; then
  require_sudo
  if ! command -v docker >/dev/null 2>&1 || ! sudo -n docker compose version >/dev/null 2>&1; then
    curl -fsSL https://get.docker.com | sudo -n sh
  fi
  sudo -n systemctl enable --now docker
  sudo -n usermod -aG docker "${USER}" || true
  if ! docker compose version >/dev/null 2>&1 && ! sudo -n docker compose version >/dev/null 2>&1; then
    echo "Docker Compose plugin не установился."
    exit 1
  fi
fi

if docker info >/dev/null 2>&1; then
  docker_cmd() { docker "$@"; }
else
  docker_cmd() { sudo -n docker "$@"; }
fi

auth_url="https://x-access-token:${GIT_TOKEN}@github.com/${REPO}.git"
clean_url="https://github.com/${REPO}.git"

cleanup_remote() {
  if [ -d "${DEPLOY_PATH}/.git" ]; then
    git -C "${DEPLOY_PATH}" remote set-url origin "${clean_url}" || true
  fi
}
trap cleanup_remote EXIT

if [ ! -d "${DEPLOY_PATH}/.git" ]; then
  mkdir -p "$(dirname "${DEPLOY_PATH}")"
  git clone --branch "${GIT_REF}" "${auth_url}" "${DEPLOY_PATH}"
else
  git -C "${DEPLOY_PATH}" remote set-url origin "${auth_url}"
  git -C "${DEPLOY_PATH}" fetch origin "${GIT_REF}"
  # Деплой-клон = origin; -f сбрасывает ручные правки (scp и т.п.), иначе checkout падает.
  git -C "${DEPLOY_PATH}" checkout -f -B "${GIT_REF}" "origin/${GIT_REF}"
  git -C "${DEPLOY_PATH}" clean -fd
fi

if [ ! -f "${DEPLOY_PATH}/.env" ]; then
  cp "${DEPLOY_PATH}/.env.example" "${DEPLOY_PATH}/.env"
  if is_domain_host; then
    ensure_prod_public_urls "${DEPLOY_PATH}/.env"
  else
    sed -i "s#http://localhost:3000#http://${PUBLIC_HOST}:3000#g" "${DEPLOY_PATH}/.env"
    sed -i "s#http://localhost:4000#http://${PUBLIC_HOST}:4000#g" "${DEPLOY_PATH}/.env"
    sed -i "s#ws://localhost:7880#ws://${PUBLIC_HOST}:7880#g" "${DEPLOY_PATH}/.env"
  fi
elif is_domain_host; then
  # Уже существующий .env: всё равно выровнять публичные URL под wss/https.
  ensure_prod_public_urls "${DEPLOY_PATH}/.env"
fi

ensure_generated_secret "${DEPLOY_PATH}/.env" GRAFANA_ADMIN_PASSWORD
ensure_generated_secret "${DEPLOY_PATH}/.env" GRAFANA_DB_PASSWORD
ensure_generated_secret "${DEPLOY_PATH}/.env" GLITCHTIP_SECRET_KEY
ensure_generated_secret "${DEPLOY_PATH}/.env" GLITCHTIP_DB_PASSWORD

livekit_config="${DEPLOY_PATH}/infra/livekit/livekit.yaml"
if [ -f "${livekit_config}" ]; then
  # ICE/WebRTC нужен публичный IP origin, не Cloudflare anycast и не домен.
  livekit_ip="${SSH_HOST:-${PUBLIC_HOST}}"
  sed -i "s#node_ip: 127.0.0.1#node_ip: ${livekit_ip}#g" "${livekit_config}"
fi

cd "${DEPLOY_PATH}"

if is_domain_host; then
  sync_caddyfile
fi

compose up -d postgres livekit
# Collaboration без GHCR-образа: собираем из клона (без bind-mount в prod).
# Только в provision: параллельные деплои frontend/backend иначе пересоздают его одновременно.
if [ -z "${SERVICE}" ]; then
  compose up -d --build collaboration
  compose up -d prometheus grafana postgres-exporter redis-exporter cadvisor glitchtip-postgres glitchtip
fi

if [ -n "${SERVICE}" ]; then
  if [ -z "${IMAGE}" ] || [ -z "${GHCR_USER}" ]; then
    echo "Для обновления ${SERVICE} нужны IMAGE и GHCR_USER."
    exit 1
  fi
  printf '%s\n' "${GIT_TOKEN}" | docker_cmd login ghcr.io -u "${GHCR_USER}" --password-stdin
  case "${SERVICE}" in
    frontend)
      FRONTEND_IMAGE="${IMAGE}" compose pull frontend
      FRONTEND_IMAGE="${IMAGE}" compose up -d --no-build --force-recreate frontend
      ;;
    backend)
      BACKEND_IMAGE="${IMAGE}" compose pull backend
      BACKEND_IMAGE="${IMAGE}" compose up -d --no-build --force-recreate backend
      ;;
    *)
      echo "Неизвестный сервис: ${SERVICE}"
      exit 1
      ;;
  esac
fi

# Включает вход роли grafana_reader (создаётся миграцией backend), пароль берётся из .env
DOCKER="$(docker info >/dev/null 2>&1 && echo docker || echo 'sudo -n docker')" \
  bash infra/postgres/grafana-reader.sh

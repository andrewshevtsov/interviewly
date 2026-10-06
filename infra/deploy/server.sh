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

export DEBIAN_FRONTEND=noninteractive

require_sudo() {
  if sudo -n true 2>/dev/null; then
    return 0
  fi
  echo "Пользователю ${USER} нужен passwordless sudo, чтобы доустановить пакеты."
  echo "На сервере от root: echo '${USER} ALL=(ALL) NOPASSWD:ALL' | tee /etc/sudoers.d/${USER} && chmod 440 /etc/sudoers.d/${USER}"
  exit 1
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
  # Домен (без схемы) → https/wss URL; иначе оставляем http://HOST:port для сырого IP.
  if [[ "${PUBLIC_HOST}" == *.* && "${PUBLIC_HOST}" != *:* ]]; then
    sed -i "s#http://localhost:3000#https://${PUBLIC_HOST}#g" "${DEPLOY_PATH}/.env"
    sed -i "s#http://localhost:4000#https://${PUBLIC_HOST}/api#g" "${DEPLOY_PATH}/.env"
    sed -i "s#ws://localhost:7880#ws://livekit.${PUBLIC_HOST}:7880#g" "${DEPLOY_PATH}/.env"
    if grep -q '^NEXT_PUBLIC_COLLABORATION_URL=' "${DEPLOY_PATH}/.env"; then
      sed -i "s|^NEXT_PUBLIC_COLLABORATION_URL=.*|NEXT_PUBLIC_COLLABORATION_URL=ws://${PUBLIC_HOST}:1234|" "${DEPLOY_PATH}/.env"
    fi
    if grep -q '^DEV_TUNNEL_ORIGIN=' "${DEPLOY_PATH}/.env"; then
      sed -i "s|^DEV_TUNNEL_ORIGIN=.*|DEV_TUNNEL_ORIGIN=${PUBLIC_HOST},www.${PUBLIC_HOST}|" "${DEPLOY_PATH}/.env"
    else
      printf 'DEV_TUNNEL_ORIGIN=%s,www.%s\n' "${PUBLIC_HOST}" "${PUBLIC_HOST}" >> "${DEPLOY_PATH}/.env"
    fi
    if grep -q '^FRONTEND_SCRIPT=' "${DEPLOY_PATH}/.env"; then
      sed -i 's|^FRONTEND_SCRIPT=.*|FRONTEND_SCRIPT=start|' "${DEPLOY_PATH}/.env"
    else
      printf 'FRONTEND_SCRIPT=start\n' >> "${DEPLOY_PATH}/.env"
    fi
  else
    sed -i "s#http://localhost:3000#http://${PUBLIC_HOST}:3000#g" "${DEPLOY_PATH}/.env"
    sed -i "s#http://localhost:4000#http://${PUBLIC_HOST}:4000#g" "${DEPLOY_PATH}/.env"
    sed -i "s#ws://localhost:7880#ws://${PUBLIC_HOST}:7880#g" "${DEPLOY_PATH}/.env"
  fi
fi

livekit_config="${DEPLOY_PATH}/infra/livekit/livekit.yaml"
if [ -f "${livekit_config}" ]; then
  # ICE/WebRTC нужен публичный IP origin, не Cloudflare anycast и не домен.
  livekit_ip="${SSH_HOST:-${PUBLIC_HOST}}"
  sed -i "s#node_ip: 127.0.0.1#node_ip: ${livekit_ip}#g" "${livekit_config}"
fi

cd "${DEPLOY_PATH}"
docker_cmd compose up -d postgres livekit

if [ -n "${SERVICE}" ]; then
  if [ -z "${IMAGE}" ] || [ -z "${GHCR_USER}" ]; then
    echo "Для обновления ${SERVICE} нужны IMAGE и GHCR_USER."
    exit 1
  fi
  printf '%s\n' "${GIT_TOKEN}" | docker_cmd login ghcr.io -u "${GHCR_USER}" --password-stdin
  case "${SERVICE}" in
    frontend)
      FRONTEND_IMAGE="${IMAGE}" docker_cmd compose pull frontend
      FRONTEND_IMAGE="${IMAGE}" docker_cmd compose up -d --no-build frontend
      # Bind-mount `.:/app` перекрывает .next из образа — собираем на сервере.
      if grep -q '^FRONTEND_SCRIPT=start$' "${DEPLOY_PATH}/.env" 2>/dev/null; then
        FRONTEND_IMAGE="${IMAGE}" docker_cmd compose exec -T frontend \
          pnpm --filter @app/frontend run build
        FRONTEND_IMAGE="${IMAGE}" docker_cmd compose up -d --no-build --force-recreate frontend
      fi
      ;;
    backend)
      BACKEND_IMAGE="${IMAGE}" docker_cmd compose pull backend
      BACKEND_IMAGE="${IMAGE}" docker_cmd compose up -d --no-build backend
      ;;
    *)
      echo "Неизвестный сервис: ${SERVICE}"
      exit 1
      ;;
  esac
fi

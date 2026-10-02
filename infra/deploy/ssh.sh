#!/usr/bin/env bash
# Запускается на runner GitHub Actions: кладёт RSA-ключ из секрета и
# передаёт infra/deploy/server.sh на сервер.
set -euo pipefail

: "${SSH_HOST:?Задайте секрет SSH_HOST}"
: "${SSH_USER:?Задайте секрет SSH_USER}"
: "${SSH_KEY:?Задайте секрет SSH_KEY}"
: "${GIT_TOKEN:?}"
: "${REPO:?}"
: "${GIT_REF:?}"

DEPLOY_PATH="${DEPLOY_PATH:-/home/${SSH_USER}/interviewly}"
PUBLIC_HOST="${PUBLIC_HOST:-${SSH_HOST}}"
SERVICE="${SERVICE:-}"
IMAGE="${IMAGE:-}"
GHCR_USER="${GHCR_USER:-}"

install -m 700 -d "${HOME}/.ssh"
printf '%s\n' "${SSH_KEY}" > "${HOME}/.ssh/deploy_key"
chmod 600 "${HOME}/.ssh/deploy_key"

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

ssh -i "${HOME}/.ssh/deploy_key" -o StrictHostKeyChecking=accept-new \
  "${SSH_USER}@${SSH_HOST}" \
  "GIT_TOKEN=$(printf '%q' "${GIT_TOKEN}") GHCR_USER=$(printf '%q' "${GHCR_USER}") REPO=$(printf '%q' "${REPO}") DEPLOY_PATH=$(printf '%q' "${DEPLOY_PATH}") PUBLIC_HOST=$(printf '%q' "${PUBLIC_HOST}") GIT_REF=$(printf '%q' "${GIT_REF}") SERVICE=$(printf '%q' "${SERVICE}") IMAGE=$(printf '%q' "${IMAGE}") bash -s" \
  < "${script_dir}/server.sh"

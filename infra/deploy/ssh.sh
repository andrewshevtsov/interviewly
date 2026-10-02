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
python3 - <<'PY'
import os
import re
import sys
from pathlib import Path

raw = os.environ["SSH_KEY"].replace("\r\n", "\n").replace("\r", "\n").strip()
if raw.startswith(("'", '"')) and raw.endswith(("'", '"')) and len(raw) > 1:
    raw = raw[1:-1]
if "\\n" in raw and "\n" not in raw:
    raw = raw.replace("\\n", "\n")
raw = raw.strip()
if raw.startswith(("ssh-rsa ", "ssh-ed25519 ", "ecdsa-sha2-")):
    sys.exit("SSH_KEY содержит публичный ключ. В секрет нужен приватный, без пароля.")

match = re.fullmatch(
    r"(-----BEGIN [^-]+-----)\s*(.+?)\s*(-----END [^-]+-----)",
    raw,
    flags=re.DOTALL,
)
if match is None:
    sys.exit("SSH_KEY не похож на PEM/OpenSSH приватный ключ.")
body = re.sub(r"\s+", "", match.group(2))
wrapped = "\n".join(body[i : i + 70] for i in range(0, len(body), 70))
text = f"{match.group(1)}\n{wrapped}\n{match.group(3)}\n"
path = Path.home() / ".ssh" / "deploy_key"
path.write_text(text)
path.chmod(0o600)
PY

if ! ssh-keygen -y -f "${HOME}/.ssh/deploy_key" >/dev/null; then
  echo "OpenSSH не смог прочитать SSH_KEY. Нужен приватный ключ без пароля (BEGIN OPENSSH PRIVATE KEY или BEGIN RSA PRIVATE KEY)."
  exit 1
fi
echo "Deploy key fingerprint: $(ssh-keygen -l -f "${HOME}/.ssh/deploy_key")"

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

ssh -i "${HOME}/.ssh/deploy_key" -o StrictHostKeyChecking=accept-new \
  "${SSH_USER}@${SSH_HOST}" \
  "GIT_TOKEN=$(printf '%q' "${GIT_TOKEN}") GHCR_USER=$(printf '%q' "${GHCR_USER}") REPO=$(printf '%q' "${REPO}") DEPLOY_PATH=$(printf '%q' "${DEPLOY_PATH}") PUBLIC_HOST=$(printf '%q' "${PUBLIC_HOST}") SSH_HOST=$(printf '%q' "${SSH_HOST}") GIT_REF=$(printf '%q' "${GIT_REF}") SERVICE=$(printf '%q' "${SERVICE}") IMAGE=$(printf '%q' "${IMAGE}") bash -s" \
  < "${script_dir}/server.sh"

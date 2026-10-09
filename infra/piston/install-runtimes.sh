#!/bin/sh
set -eu

PISTON_URL="${PISTON_URL:-http://piston:2000}"

# Установка идемпотентна: существующий runtime повторно не скачивается.
install_runtime() {
  package_language="$1"
  runtime_language="$2"
  version="$3"
  runtimes="$(curl -fsS "${PISTON_URL}/api/v2/runtimes")"

  if printf '%s' "$runtimes" | grep -Fq "\"language\":\"${runtime_language}\",\"version\":\"${version}\""; then
    echo "${runtime_language} ${version} is already installed"
    return
  fi

  echo "Installing ${package_language} ${version}"
  curl -fsS -X POST "${PISTON_URL}/api/v2/packages" \
    -H 'Content-Type: application/json' \
    -d "{\"language\":\"${package_language}\",\"version\":\"${version}\"}"
  echo
}

# Версии зафиксированы, чтобы одинаковый Compose давал одинаковое окружение выполнения.
install_runtime python python 3.11.0
install_runtime node javascript 20.11.1
install_runtime typescript typescript 5.0.3

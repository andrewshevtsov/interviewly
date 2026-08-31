#!/usr/bin/env sh

validate_branch_name() {
  branch="$1"

  if [ -z "$branch" ] || [ "$branch" = "HEAD" ]; then
    return 0
  fi

  if echo "$branch" | grep -qE '[а-яА-ЯёЁ]'; then
    echo "❌ Имя ветки не должно содержать русские символы: $branch"
    return 1
  fi

  if echo "$branch" | grep -q ' '; then
    echo "❌ Имя ветки не должно содержать пробелы: $branch"
    return 1
  fi

  if ! echo "$branch" | grep -qE '^[a-zA-Z0-9_/-]+$'; then
    echo "❌ Имя ветки содержит недопустимые символы (разрешены: латиница, цифры, _, -, /): $branch"
    return 1
  fi

  if echo "$branch" | grep -qE '^(feature|bugfix|hotfix|experiment)/[a-zA-Z0-9_-]+$'; then
    return 0
  fi

  if echo "$branch" | grep -qE '^[a-zA-Z0-9_-]+/dev$'; then
    return 0
  fi

  if echo "$branch" | grep -qE '^[a-zA-Z0-9_-]+$'; then
    return 0
  fi

  echo "❌ Недопустимое имя ветки: $branch"
  echo ""
  echo "Разрешённые форматы:"
  echo "  feature/<название>      — новая функциональность"
  echo "  bugfix/<название>       — исправление ошибок"
  echo "  hotfix/<название>       — срочные правки продакшена"
  echo "  experiment/<название>   — прототипы и эксперименты"
  echo "  <клиент>/dev            — клиентская ветка"
  echo "  <название>              — без префикса (не рекомендуется)"
  echo ""
  echo "Название: латиница, цифры, _, - (без пробелов и русских символов)"
  return 1
}

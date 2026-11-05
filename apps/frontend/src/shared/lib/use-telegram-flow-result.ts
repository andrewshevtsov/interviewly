"use client";

// Слой shared: итог входа/привязки через Telegram. Backend после возврата с Telegram редиректит на сайт
// с `?telegramError=<код>` или `?telegram=linked`.
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const ERROR_PARAM = "telegramError";
const LINKED_PARAM = "telegram";
const LINKED_VALUE = "linked";

/**
 * Коды ошибок, с которыми backend возвращает пользователя после Telegram.
 */
export type TelegramErrorCode = "denied" | "taken" | "failed" | "unavailable";

const ERROR_CODES: readonly string[] = ["denied", "taken", "failed", "unavailable"];

/**
 * Приводит значение параметра к известному коду ошибки.
 * @param {string | null} value - Значение `telegramError` из URL.
 * @returns {TelegramErrorCode | null} Код или `null`, если параметра нет или значение неизвестно.
 */
export function parseTelegramError(value: string | null): TelegramErrorCode | null {
  return value !== null && ERROR_CODES.includes(value) ? (value as TelegramErrorCode) : null;
}

/**
 * Итог Telegram-потока, с которым пользователь вернулся на страницу.
 */
export interface TelegramFlowResult {
  /**
   * Код ошибки или `null`.
   */
  error: TelegramErrorCode | null;

  /**
   * Telegram успешно привязан.
   */
  linked: boolean;
}

/**
 * Читает итог Telegram-потока из параметров URL.
 * @param {Pick<URLSearchParams, "get">} params - Параметры адреса.
 * @returns {TelegramFlowResult} Код ошибки и признак успешной привязки.
 */
function readResult(params: Pick<URLSearchParams, "get">): TelegramFlowResult {
  return {
    error: parseTelegramError(params.get(ERROR_PARAM)),
    linked: params.get(LINKED_PARAM) === LINKED_VALUE,
  };
}

/**
 * Итог Telegram-потока, с которым пользователь вернулся на страницу. Запоминается один раз и сразу
 * убирается из адреса: после перезагрузки сообщение не должно появляться снова.
 * @returns {TelegramFlowResult} Код ошибки и признак успешной привязки.
 */
export function useTelegramFlowResult(): TelegramFlowResult {
  const params = useSearchParams();
  const [result] = useState(readResult(params));

  useEffect(() => {
    if (!result.error && !result.linked) {
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.delete(ERROR_PARAM);
    url.searchParams.delete(LINKED_PARAM);
    window.history.replaceState(null, "", url);
  }, [result]);

  return result;
}

"use client";

// Официальный Telegram Login Widget (https://core.telegram.org/widgets/login). Нужен и для входа,
// и для привязки Telegram к аккаунту.
import { useEffect, useRef } from "react";

import type { TelegramAuthPayload } from "@/shared/api/auth-api";

const TELEGRAM_WIDGET_SCRIPT_SRC = "https://telegram.org/js/telegram-widget.js?22";
const TELEGRAM_AUTH_CALLBACK_NAME = "onInterviewlyTelegramAuth";

declare global {
  /**
   * Добавляет в `Window` глобальный callback, который скрипт Telegram Login Widget вызывает по имени.
   */
  interface Window {
    /**
     * Принимает подписанные данные от Telegram Login Widget.
     */
    [TELEGRAM_AUTH_CALLBACK_NAME]?: (user: TelegramAuthPayload) => void;
  }
}

/**
 * Пропсы {@link TelegramWidget}.
 */
export interface TelegramWidgetProps {
  /**
   * Username бота без `@`.
   */
  botUsername: string;

  /**
   * Вызывается с подписанными данными после подтверждения в Telegram.
   */
  onAuth: (user: TelegramAuthPayload) => void;
}

/**
 * Встраивает Telegram Login Widget с запросом права писать пользователю.
 * @param {TelegramWidgetProps} props - Пропсы компонента.
 * @returns {import('react').ReactNode} Контейнер виджета.
 */
export function TelegramWidget(props: TelegramWidgetProps) {
  const { botUsername, onAuth } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const onAuthRef = useRef(onAuth);
  onAuthRef.current = onAuth;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    /**
     * Передаёт подписанные данные виджета в актуальный `onAuth`.
     * @param {TelegramAuthPayload} user - Подписанные данные виджета.
     * @returns {void}
     */
    window[TELEGRAM_AUTH_CALLBACK_NAME] = (user) => onAuthRef.current(user);

    const script = document.createElement("script");
    script.src = TELEGRAM_WIDGET_SCRIPT_SRC;
    script.async = true;
    script.setAttribute("data-telegram-login", botUsername);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-onauth", `${TELEGRAM_AUTH_CALLBACK_NAME}(user)`);
    script.setAttribute("data-request-access", "write");
    container.appendChild(script);

    return () => {
      delete window[TELEGRAM_AUTH_CALLBACK_NAME];
      container.replaceChildren();
    };
  }, [botUsername]);

  return <div ref={containerRef} />;
}

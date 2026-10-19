"use client";

// Слой shared: значение, которое обновляется с задержкой
import { useEffect, useState } from "react";

/**
 * Возвращает `value` с задержкой.
 * @template T
 * @param {T} value - Быстро меняющееся значение, например текст в поле поиска.
 * @param {number} delayMs - Сколько подождать после последнего изменения.
 * @returns {T} Значение после паузы.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebounced(value), delayMs);

    return () => window.clearTimeout(timeoutId);
  }, [value, delayMs]);

  return debounced;
}

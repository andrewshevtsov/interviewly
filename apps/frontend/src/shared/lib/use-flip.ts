"use client";

// Слой shared: FLIP-анимация перестройки раскладки на CSS-переходах.
// Элементы с data-flip-id плавно переезжают со старого места на новое, новые - проявляются
import { useLayoutEffect, useRef, type RefObject } from "react";

/**
 * Длительность FLIP-перехода; соседние CSS-переходы (например, выезд панели) должны совпадать
 */
export const FLIP_DURATION_MS = 500;

const FLIP_EASING = "cubic-bezier(0.4, 0, 0.2, 1)";
const FLIP_SELECTOR = "[data-flip-id]";
const COUNTER_SELECTOR = "[data-flip-counter]";
// scale(1) - натуральный размер; обратный масштаб к scaleX - NATURAL_SCALE / scaleX
const NATURAL_SCALE = 1;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Запоминает положение каждого анимируемого элемента контейнера
 * @param {HTMLElement | null} container - Контейнер с элементами `data-flip-id`
 * @returns {Map<string, DOMRect>} Прямоугольники элементов по их `data-flip-id`
 */
function measure(container: HTMLElement | null): Map<string, DOMRect> {
  const rects = new Map<string, DOMRect>();
  container?.querySelectorAll<HTMLElement>(FLIP_SELECTOR).forEach((element) => {
    if (element.dataset.flipId) {
      rects.set(element.dataset.flipId, element.getBoundingClientRect());
    }
  });

  return rects;
}

/**
 * Invert: возвращает элемент на старое место трансформацией, без перехода.
 * У масштабируемого элемента потомки с `data-flip-counter` получают обратный масштаб,
 * чтобы текст не растягивался; точку опоры им задаёт их собственный `transform-origin`
 * @param {HTMLElement} element - Анимируемый элемент
 * @param {DOMRect | undefined} first - Где элемент был до перестройки
 * @returns {HTMLElement[]} Подписи, которым задан обратный масштаб
 */
function invert(element: HTMLElement, first: DOMRect | undefined): HTMLElement[] {
  element.style.transition = "none";
  if (!first) {
    element.style.opacity = "0";

    return [];
  }

  const last = element.getBoundingClientRect();
  element.style.transformOrigin = "top left";
  element.style.transform = `translate(${first.left - last.left}px, ${first.top - last.top}px)`;

  if (element.dataset.flipScale === undefined || last.width === 0 || last.height === 0) {
    return [];
  }

  const scaleX = first.width / last.width;
  const scaleY = first.height / last.height;
  element.style.transform += ` scale(${scaleX}, ${scaleY})`;

  const counters = Array.from(element.querySelectorAll<HTMLElement>(COUNTER_SELECTOR));
  counters.forEach((counter) => {
    counter.style.transition = "none";
    counter.style.transform = `scale(${NATURAL_SCALE / scaleX}, ${NATURAL_SCALE / scaleY})`;
  });

  return counters;
}

/**
 * Play: включает переход и снимает трансформацию - элемент едет на новое место
 * @param {HTMLElement} element - Анимируемый элемент
 * @returns {void}
 */
function play(element: HTMLElement): void {
  element.style.transition = `transform ${FLIP_DURATION_MS}ms ${FLIP_EASING}, opacity ${FLIP_DURATION_MS}ms ${FLIP_EASING}`;
  element.style.transform = "";
  element.style.opacity = "";

  setTimeout(() => {
    element.style.transition = "";
    element.style.transformOrigin = "";
  }, FLIP_DURATION_MS);
}

/**
 * Когда меняется `layoutKey`, элементы плавно едут со старого места на новое.
 * Атрибуты решают какие элементы и как анимировать:
 * - `data-flip-id` - элемент едет на новое место;
 * - `data-flip-scale` - элемент плавно меняет размер;
 * - `data-flip-counter` - текст внутри такого элемента не растягивается вместе с ним.
 * @param {RefObject<HTMLElement | null>} containerRef - Контейнер анимируемых элементов
 * @param {unknown} layoutKey - Значение, смена которого перестраивает раскладку
 * @returns {void}
 */
export function useFlip(containerRef: RefObject<HTMLElement | null>, layoutKey: unknown): void {
  const appliedKey = useRef(layoutKey);
  const firstRects = useRef<Map<string, DOMRect> | null>(null);

  if (appliedKey.current !== layoutKey && firstRects.current === null) {
    firstRects.current = measure(containerRef.current);
  }

  useLayoutEffect(() => {
    if (appliedKey.current === layoutKey) {
      return;
    }
    appliedKey.current = layoutKey;
    const first = firstRects.current;
    firstRects.current = null;

    const container = containerRef.current;
    if (!first || !container || window.matchMedia(REDUCED_MOTION_QUERY).matches) {
      return;
    }

    container.style.overflow = "visible";
    const timer = setTimeout(() => {
      container.style.overflow = "";
    }, FLIP_DURATION_MS);

    const elements = Array.from(container.querySelectorAll<HTMLElement>(FLIP_SELECTOR));
    const counters = elements.flatMap((element) => invert(element, first.get(element.dataset.flipId ?? "")));
    void container.offsetHeight;
    [...elements, ...counters].forEach(play);

    return () => {
      clearTimeout(timer);
      container.style.overflow = "";
    };
  }, [containerRef, layoutKey]);
}

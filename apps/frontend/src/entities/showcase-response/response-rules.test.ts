import { describe, expect, it } from "vitest";

import {
  canRespondAgain,
  getSlotBounds,
  isReasonLengthValid,
  isSlotAllowed,
  localValueToIso,
  REASON_MAX_LENGTH,
  REASON_MIN_LENGTH,
  toDateTimeLocalValue,
} from "./response-rules";

const NOW = new Date("2026-10-10T12:00:00.000Z");
const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

describe("getSlotBounds", () => {
  it("min - через 3 часа, max - через 30 дней", () => {
    const { min, max } = getSlotBounds(NOW);

    expect(min.getTime() - NOW.getTime()).toBe(3 * HOUR_MS);
    expect(max.getTime() - NOW.getTime()).toBe(30 * DAY_MS);
  });
});

describe("toDateTimeLocalValue / localValueToIso", () => {
  it("формат значения datetime-local: 16 символов без часового пояса", () => {
    expect(toDateTimeLocalValue(NOW)).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });

  it("значение поля превращается обратно в тот же момент (с точностью до минуты)", () => {
    const iso = localValueToIso(toDateTimeLocalValue(NOW));

    expect(new Date(iso).getTime()).toBe(NOW.getTime());
    expect(iso.endsWith("Z")).toBe(true);
  });
});

describe("isSlotAllowed", () => {
  const at = (ms: number) => toDateTimeLocalValue(new Date(NOW.getTime() + ms));

  it("принимает время внутри окна и на его границах", () => {
    expect(isSlotAllowed(at(3 * HOUR_MS), NOW)).toBe(true);
    expect(isSlotAllowed(at(24 * HOUR_MS), NOW)).toBe(true);
    expect(isSlotAllowed(at(30 * DAY_MS), NOW)).toBe(true);
  });

  it("отклоняет слишком скорое, прошедшее и слишком дальнее время", () => {
    expect(isSlotAllowed(at(2 * HOUR_MS), NOW)).toBe(false);
    expect(isSlotAllowed(at(-HOUR_MS), NOW)).toBe(false);
    expect(isSlotAllowed(at(31 * DAY_MS), NOW)).toBe(false);
  });

  it("отклоняет пустое и некорректное значение", () => {
    expect(isSlotAllowed("", NOW)).toBe(false);
    expect(isSlotAllowed("завтра", NOW)).toBe(false);
  });
});

describe("isReasonLengthValid", () => {
  it("границы 30 и 500 символов включительно", () => {
    expect(isReasonLengthValid("а".repeat(REASON_MIN_LENGTH - 1))).toBe(false);
    expect(isReasonLengthValid("а".repeat(REASON_MIN_LENGTH))).toBe(true);
    expect(isReasonLengthValid("а".repeat(REASON_MAX_LENGTH))).toBe(true);
    expect(isReasonLengthValid("а".repeat(REASON_MAX_LENGTH + 1))).toBe(false);
  });

  it("пробелы по краям не набирают длину, как и на backend", () => {
    expect(isReasonLengthValid(`${" ".repeat(60)}${"а".repeat(20)}${" ".repeat(60)}`)).toBe(false);
  });
});

describe("canRespondAgain", () => {
  const later = new Date(NOW.getTime() + HOUR_MS).toISOString();
  const earlier = new Date(NOW.getTime() - HOUR_MS).toISOString();

  it.each([
    ["отклик ещё в ожидании", { status: "PENDING", sessionStatus: null }, false],
    ["есть действующая встреча", { status: "ACCEPTED", sessionStatus: "SCHEDULED" }, false],
    ["встречу отменили", { status: "ACCEPTED", sessionStatus: "CANCELLED" }, true],
    ["встреча прошла", { status: "ACCEPTED", sessionStatus: "COMPLETED" }, true],
    ["идёт пауза после отказа", { status: "REJECTED", sessionStatus: null, canRetryAt: later }, false],
    ["пауза после отказа кончилась", { status: "REJECTED", sessionStatus: null, canRetryAt: earlier }, true],
    ["отказ из-за времени", { status: "REJECTED", sessionStatus: null, canRetryAt: null }, true],
    ["отклик отозван", { status: "CANCELLED", sessionStatus: null }, true],
    ["время отклика прошло", { status: "EXPIRED", sessionStatus: null }, true],
  ])("%s", (unusedName, response, expected) => {
    expect(canRespondAgain(response, NOW)).toBe(expected);
  });
});

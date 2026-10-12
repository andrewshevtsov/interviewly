import { AxiosError, type AxiosResponse } from "axios";
import { describe, expect, it } from "vitest";

import { getHttpMessage, getHttpStatus } from "./http-client";

/**
 * Ошибка axios с телом ответа, как приходит от backend.
 * @param {number} status - HTTP-статус.
 * @param {unknown} data - Тело ответа.
 * @returns {AxiosError} Ошибка запроса.
 */
function apiError(status: number, data: unknown): AxiosError {
  return new AxiosError("fail", String(status), undefined, undefined, { status, data } as AxiosResponse);
}

describe("getHttpStatus", () => {
  it("возвращает статус ответа backend", () => {
    expect(getHttpStatus(apiError(409, {}))).toBe(409);
  });

  it("для не-axios ошибок возвращает undefined", () => {
    expect(getHttpStatus(new Error("network"))).toBeUndefined();
  });
});

describe("getHttpMessage", () => {
  it("берёт message-строку", () => {
    expect(getHttpMessage(apiError(409, { message: "Showcase card not found" }))).toBe("Showcase card not found");
  });

  it("склеивает список сообщений валидации", () => {
    expect(getHttpMessage(apiError(400, { message: ["a must be x", "b must be y"] }))).toBe("a must be x b must be y");
  });

  it("без тела или чужой ошибки возвращает пустую строку", () => {
    expect(getHttpMessage(apiError(500, undefined))).toBe("");
    expect(getHttpMessage(new Error("boom"))).toBe("");
  });
});

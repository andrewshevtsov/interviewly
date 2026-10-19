import { AxiosError, type AxiosResponse } from "axios";
import { describe, expect, it } from "vitest";

import { classifyEmailChangeError } from "./email-change-errors";

const failure = (status: number) =>
  new AxiosError("fail", String(status), undefined, undefined, { status, data: {} } as AxiosResponse);

describe("classifyEmailChangeError", () => {
  it.each([
    [400, "errEmailInvalid"],
    [403, "errWrongPassword"],
    [409, "errEmailTaken"],
    [503, "errMailFailed"],
    [500, "errGeneric"],
  ])("статус %i -> %s", (status, key) => {
    expect(classifyEmailChangeError(failure(status))).toBe(key);
  });

  it("сетевая ошибка и не-axios ошибка дают общее сообщение", () => {
    expect(classifyEmailChangeError(new Error("offline"))).toBe("errGeneric");
  });
});

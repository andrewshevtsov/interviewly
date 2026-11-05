import { describe, expect, it } from "vitest";

import { parseTelegramError } from "./use-telegram-flow-result";

describe("parseTelegramError", () => {
  it.each(["denied", "taken", "failed", "unavailable"])("принимает код %s", (code) => {
    expect(parseTelegramError(code)).toBe(code);
  });

  it.each([null, "", "DENIED", "unknown", "<script>"])("отбрасывает %j", (value) => {
    expect(parseTelegramError(value)).toBeNull();
  });
});

import { describe, expect, it } from "vitest";

import { isPlaceholderEmail } from "./email";

describe("isPlaceholderEmail", () => {
  it("узнаёт служебный адрес вошедшего через Telegram", () => {
    expect(isPlaceholderEmail("tg-12345@telegram.interviewly.local")).toBe(true);
    expect(isPlaceholderEmail("TG-1@Telegram.Interviewly.Local")).toBe(true);
  });

  it("не считает служебным настоящий адрес", () => {
    expect(isPlaceholderEmail("ivan@example.com")).toBe(false);
    expect(isPlaceholderEmail("telegram.interviewly.local@example.com")).toBe(false);
  });
});

import { describe, expect, it } from "vitest";

import { classifyRespondError, classifyReviewError, CONFLICT_ERRORS } from "./response-errors";

describe("classifyRespondError", () => {
  it.each([
    [400, "Meeting time must be at least 3 hours from now", "invalidTime"],
    [403, "You cannot respond to your own card", "ownCard"],
    [404, "Showcase card not found", "cardGone"],
    [409, "Fill in your profile before responding to a card", "noProfile"],
    [409, "You already have a pending response to this card", "alreadyPending"],
    [409, "You already have a meeting scheduled with this person. Cancel it first to respond to this card again", "meetingScheduled"],
    [409, "The card owner is busy around this time. Propose another time", "ownerBusy"],
    [409, "You already have an interview or a pending response around this time. Propose another time", "youBusy"],
    [409, "что-то неожиданное", "generic"],
    [500, "", "generic"],
    [undefined, "", "generic"],
  ] as const)("статус %s и сообщение «%s» -> %s", (status, message, key) => {
    expect(classifyRespondError(status, message).key).toBe(key);
  });

  it("для паузы после отказа достаёт время, когда можно повторить", () => {
    const message =
      "Your previous response was rejected. You can respond to this card again after 2026-10-12T11:00:00.000Z";

    expect(classifyRespondError(409, message)).toEqual({ key: "cooldown", retryAt: "2026-10-12T11:00:00.000Z" });
  });

  it("пауза без разобранного времени не ломается", () => {
    expect(classifyRespondError(409, "Your previous response was rejected.")).toEqual({
      key: "cooldown",
      retryAt: null,
    });
  });
});

describe("CONFLICT_ERRORS", () => {
  // Все тексты 409, которые backend отдаёт при отклике на карточку
  const BACKEND_CONFLICT_MESSAGES = [
    "Fill in your profile before responding to a card",
    "You already have a pending response to this card",
    "You already have a meeting scheduled with this person. Cancel it first to respond to this card again",
    "Your previous response was rejected. You can respond to this card again after 2026-10-12T11:00:00.000Z",
    "The card owner is busy around this time. Propose another time",
    "You already have an interview or a pending response around this time. Propose another time",
  ];

  it.each(BACKEND_CONFLICT_MESSAGES)("сообщение «%s» подходит ровно под один фрагмент, поэтому порядок записей не важен", (message) => {
    const matches = CONFLICT_ERRORS.filter((conflict) => message.includes(conflict.fragment));

    expect(matches).toHaveLength(1);
  });

  it("у каждой причины есть настоящее сообщение backend, а фрагменты не повторяются", () => {
    const fragments = CONFLICT_ERRORS.map((conflict) => conflict.fragment);

    expect(new Set(fragments).size).toBe(fragments.length);
    expect(BACKEND_CONFLICT_MESSAGES).toHaveLength(CONFLICT_ERRORS.length);
  });
});

describe("classifyReviewError", () => {
  it.each([
    [403, "Only the card owner can review responses", "notAllowed"],
    [409, "This response has already been reviewed", "alreadyReviewed"],
    [409, "Only a pending response can be cancelled", "alreadyReviewed"],
    [409, "The proposed time has already passed", "timePassed"],
    [409, "You already have an interview around this time. Reject this response and mark it as a time mismatch", "youBusy"],
    [409, "The responder is no longer available at this time. Reject this response", "responderBusy"],
    [404, "Response not found", "generic"],
    [undefined, "", "generic"],
  ] as const)("статус %s и сообщение «%s» -> %s", (status, message, key) => {
    expect(classifyReviewError(status, message)).toBe(key);
  });
});

import { describe, expect, it } from "vitest";
import { selectCurrentSavedActivityEvents } from "../shared/savedActivityEvents";

describe("saved activity events", () => {
  const now = new Date("2026-08-14T12:00:00.000Z");

  it("keeps active upcoming, recurring, and evergreen saved activities while hiding passed one-offs", () => {
    const result = selectCurrentSavedActivityEvents([
      { id: "past", isActive: true, isRecurring: false, eventDate: new Date("2026-08-13T12:00:00.000Z"), savedAt: now },
      { id: "upcoming", isActive: true, isRecurring: false, eventDate: new Date("2026-08-15T12:00:00.000Z"), savedAt: now },
      { id: "recurring", isActive: true, isRecurring: true, eventDate: new Date("2026-08-13T12:00:00.000Z"), savedAt: now },
      { id: "evergreen", isActive: true, isRecurring: false, eventDate: null, savedAt: now },
      { id: "inactive", isActive: false, isRecurring: true, eventDate: null, savedAt: now },
    ], now);
    expect(result.map((event) => event.id)).toEqual(["upcoming", "recurring", "evergreen"]);
  });
});

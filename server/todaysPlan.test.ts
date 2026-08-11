import { describe, expect, it } from "vitest";
import { buildTodayPlanSelection } from "../shared/todaysPlan";

describe("today's plan selection", () => {
  it("stores an event without an activity id", () => {
    expect(buildTodayPlanSelection({ id: 12, kind: "event", title: "Public concert" })).toEqual({
      eventId: 12,
      activityId: null,
      note: "Public concert",
    });
  });

  it("stores an activity without an event id", () => {
    expect(buildTodayPlanSelection({ id: 7, kind: "activity", title: "YMCA basketball" })).toEqual({
      eventId: null,
      activityId: 7,
      note: "YMCA basketball",
    });
  });
});

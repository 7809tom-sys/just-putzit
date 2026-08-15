import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("activity detail calendar action", () => {
  it("reuses the calendar-provider menu only for signed-in activity detail viewers", () => {
    const source = readFileSync(resolve(__dirname, "../client/src/pages/EventDetail.tsx"), "utf8");
    expect(source).toContain('import { BookingCalendarMenu } from "@/components/BookingCalendarMenu"');
    expect(source).toContain("{viewer ? (");
    expect(source).toContain("<BookingCalendarMenu booking={{");
    expect(source).toContain("start: activity.eventDate");
    expect(source).toContain("Join Free & RSVP");
  });
});

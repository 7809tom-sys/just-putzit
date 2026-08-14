import { describe, expect, it } from "vitest";
import { parseCommunityCalendarDate } from "./communityScraper";

describe("official Madison community calendar parsing", () => {
  const referenceDate = new Date(2026, 7, 14, 9, 0, 0);

  it("parses a public event date with a time and an implied current year", () => {
    const result = parseCommunityCalendarDate("Friday, August 15 · 7:30 PM", referenceDate);
    expect(result).toEqual(new Date(2026, 7, 15, 19, 30, 0));
  });

  it("rolls an already-passed yearless date into the next calendar year", () => {
    const result = parseCommunityCalendarDate("Aug 2 · 10:00 AM", referenceDate);
    expect(result).toEqual(new Date(2027, 7, 2, 10, 0, 0));
  });

  it("rejects date-free content so non-event headings are not published", () => {
    expect(parseCommunityCalendarDate("Coming Up", referenceDate)).toBeNull();
  });
});

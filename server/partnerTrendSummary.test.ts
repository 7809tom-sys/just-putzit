import { describe, expect, it } from "vitest";
import { formatAverageDailyAttendance, summarizePartnerTrendRange } from "../client/src/lib/partnerTrendSummary";

describe("partner selected-range trend summaries", () => {
  it("calculates total bookings and average daily attendance across every selected day", () => {
    expect(summarizePartnerTrendRange([
      { bookings: 2, attendance: 3 },
      { bookings: 1, attendance: 0 },
      { bookings: 0, attendance: 3 },
    ])).toEqual({ totalBookings: 3, totalAttendance: 6, averageDailyAttendance: 2 });
  });

  it("formats fractional daily attendance without misleading precision", () => {
    expect(formatAverageDailyAttendance(1.5)).toBe("1.5");
    expect(formatAverageDailyAttendance(2)).toBe("2");
  });
});

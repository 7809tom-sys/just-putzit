import { describe, expect, it } from "vitest";
import { ATTENDANCE_CHECK_IN_EARLY_WINDOW_MS, getBookingCheckInError } from "../shared/attendanceProof";
import { summarizePartnerImpact } from "./partnerImpact";

describe("attendance proof", () => {
  const now = new Date("2026-08-12T12:00:00.000Z");

  it("allows a confirmed booking to be privately checked in close to its scheduled time", () => {
    expect(getBookingCheckInError("confirmed", new Date(now.getTime() + ATTENDANCE_CHECK_IN_EARLY_WINDOW_MS), now)).toBeNull();
  });

  it("rejects early, cancelled, and unscheduled booking check-ins", () => {
    expect(getBookingCheckInError("confirmed", new Date(now.getTime() + ATTENDANCE_CHECK_IN_EARLY_WINDOW_MS + 1), now)).toBe("Check-in opens 12 hours before the activity.");
    expect(getBookingCheckInError("cancelled", now, now)).toBe("Only confirmed bookings can be checked in.");
    expect(getBookingCheckInError("confirmed", null, now)).toBe("This booking needs a scheduled time before check-in is available.");
  });

  it("summarizes only active bookings and aggregate RSVP signals", () => {
    expect(summarizePartnerImpact([
      { status: "confirmed", partySize: 2, totalPriceCents: 4000, commissionCents: 480 },
      { status: "checked_in", partySize: 3, totalPriceCents: 6000, commissionCents: 720 },
      { status: "cancelled", partySize: 4, totalPriceCents: 8000, commissionCents: 960 },
    ], [
      { status: "going", checkedIn: true },
      { status: "maybe", checkedIn: false },
      { status: "not_going", checkedIn: false },
    ])).toMatchObject({ bookingCount: 2, bookedSeats: 5, attendanceSignals: 1, rsvpIntent: 2, rsvpCheckIns: 1, grossBookingValueCents: 10000, platformCommissionCents: 1200 });
  });
});

import { describe, expect, it } from "vitest";
import { getBookingStatusPresentation } from "../client/src/lib/bookingStatus";

describe("booking status badges", () => {
  it("labels confirmed bookings with a success treatment", () => {
    expect(getBookingStatusPresentation({ status: "confirmed" })).toMatchObject({ label: "Confirmed", className: expect.stringContaining("teal") });
  });

  it("prioritizes a pending reschedule request so the original confirmation is not misleading", () => {
    expect(getBookingStatusPresentation({ status: "confirmed", rescheduleRequestedFor: new Date() })).toMatchObject({ label: "Pending reschedule", className: expect.stringContaining("amber") });
  });

  it("labels cancelled bookings clearly", () => {
    expect(getBookingStatusPresentation({ status: "cancelled" })).toMatchObject({ label: "Cancelled", className: expect.stringContaining("red") });
  });
});

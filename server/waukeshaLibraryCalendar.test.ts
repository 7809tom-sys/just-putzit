import { describe, expect, it } from "vitest";
import { buildBookingCalendarEvent, getBookingIcs } from "../client/src/lib/bookingCalendar";

describe("Waukesha Library calendar exports", () => {
  it("builds a calendar event with the official library detail link", () => {
    const event = buildBookingCalendarEvent({
      title: "Tabletop Gaming Night",
      start: "2026-08-20T18:00:00Z",
      location: "Waukesha Public Library",
      details: "Waukesha Public Library program from Just Putzit. Official details: https://waukesha.librarycalendar.com/event/123",
      confirmationCode: "waukesha-library-123",
    });
    expect(event?.details).toContain("Official details");
    expect(getBookingIcs(event!)).toContain("SUMMARY:Tabletop Gaming Night");
  });
});

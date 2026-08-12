import { describe, expect, it } from "vitest";
import { BOOKING_CALENDAR_PROVIDERS_TOOLTIP, BOOKING_ICS_DOWNLOAD_DESCRIPTION, BOOKING_ICS_DOWNLOAD_SUCCESS, buildBookingCalendarEvent, getBookingIcs, getGoogleCalendarUrl, getOutlookCalendarUrl } from "../client/src/lib/bookingCalendar";
import { CALENDAR_DOWNLOAD_TOAST_DURATION } from "../client/src/components/CalendarDownloadToast";

describe("confirmed booking calendar export", () => {
  const event = buildBookingCalendarEvent({
    title: "Community Theater Night",
    start: "2026-09-14T18:30:00.000Z",
    durationMinutes: 90,
    location: "Main Street Theater, Waukesha",
    confirmationCode: "JP-123ABC",
  });

  it("creates a complete calendar event with a safe default duration", () => {
    expect(event).toMatchObject({ title: "Community Theater Night", location: "Main Street Theater, Waukesha" });
    expect(event?.end.getTime()).toBe(event!.start.getTime() + 90 * 60_000);
  });

  it("creates Google, Outlook, and ICS calendar payloads", () => {
    expect(event).not.toBeNull();
    expect(getGoogleCalendarUrl(event!)).toContain("calendar.google.com");
    expect(getOutlookCalendarUrl(event!)).toContain("outlook.live.com");
    expect(getBookingIcs(event!)).toContain("BEGIN:VEVENT");
    expect(getBookingIcs(event!)).toContain("JP-123ABC");
  });

  it("does not create a calendar action without a valid scheduled time", () => {
    expect(buildBookingCalendarEvent({ title: "No date", start: null })).toBeNull();
  });

  it("names every supported calendar provider in the action guidance", () => {
    expect(BOOKING_CALENDAR_PROVIDERS_TOOLTIP).toContain("Google");
    expect(BOOKING_CALENDAR_PROVIDERS_TOOLTIP).toContain("Outlook");
    expect(BOOKING_CALENDAR_PROVIDERS_TOOLTIP).toContain("Apple");
    expect(BOOKING_CALENDAR_PROVIDERS_TOOLTIP).toContain(".ics");
  });

  it("gives members clear feedback after the standard file download starts", () => {
    expect(BOOKING_ICS_DOWNLOAD_SUCCESS).toContain("downloaded");
    expect(BOOKING_ICS_DOWNLOAD_DESCRIPTION).toContain(".ics");
    expect(CALENDAR_DOWNLOAD_TOAST_DURATION).toBeGreaterThanOrEqual(4000);
  });
});

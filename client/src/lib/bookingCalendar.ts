export type BookingCalendarInput = {
  title: string;
  start: Date | string | null | undefined;
  durationMinutes?: number | null;
  location?: string | null;
  confirmationCode?: string | null;
  details?: string | null;
};

export type BookingCalendarEvent = {
  title: string;
  start: Date;
  end: Date;
  location: string;
  details: string;
  uid: string;
};

export const BOOKING_CALENDAR_PROVIDERS_TOOLTIP = "Google, Outlook, Apple Calendar, or download a standard .ics file for other calendars";
export const BOOKING_ICS_DOWNLOAD_SUCCESS = "Calendar file downloaded";
export const BOOKING_ICS_DOWNLOAD_DESCRIPTION = "Open the .ics file to add this booking to your calendar.";

function formatGoogleDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escapeIcs(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export function buildBookingCalendarEvent(input: BookingCalendarInput): BookingCalendarEvent | null {
  if (!input.start) return null;
  const start = new Date(input.start);
  if (Number.isNaN(start.getTime())) return null;
  const durationMinutes = Math.max(15, input.durationMinutes ?? 120);
  const location = input.location?.trim() || "Location details in Just Putzit";
  const confirmation = input.confirmationCode ? ` Confirmation: ${input.confirmationCode}.` : "";
  return {
    title: input.title,
    start,
    end: new Date(start.getTime() + durationMinutes * 60_000),
    location,
    details: input.details?.trim() || `Booked through Just Putzit.${confirmation}`,
    uid: `justputzit-${input.confirmationCode ?? `${start.getTime()}-${input.title.replace(/\W+/g, "-")}`}`,
  };
}

export function getGoogleCalendarUrl(event: BookingCalendarEvent) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${formatGoogleDate(event.start)}/${formatGoogleDate(event.end)}`,
    details: event.details,
    location: event.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function getOutlookCalendarUrl(event: BookingCalendarEvent) {
  const params = new URLSearchParams({
    subject: event.title,
    startdt: event.start.toISOString(),
    enddt: event.end.toISOString(),
    body: event.details,
    location: event.location,
    path: "/calendar/action/compose",
    rru: "addevent",
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

export function getBookingIcs(event: BookingCalendarEvent) {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Just Putzit//Bookings//EN",
    "BEGIN:VEVENT",
    `UID:${escapeIcs(event.uid)}`,
    `DTSTAMP:${formatGoogleDate(new Date())}`,
    `DTSTART:${formatGoogleDate(event.start)}`,
    `DTEND:${formatGoogleDate(event.end)}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    `DESCRIPTION:${escapeIcs(event.details)}`,
    `LOCATION:${escapeIcs(event.location)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

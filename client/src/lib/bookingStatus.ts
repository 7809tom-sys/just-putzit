export type BookingStatusInput = {
  status: string;
  rescheduleRequestedFor?: Date | string | null;
};

export type BookingStatusPresentation = {
  label: string;
  className: string;
};

export function getBookingStatusPresentation(booking: BookingStatusInput): BookingStatusPresentation {
  if (booking.status === "cancelled") {
    return { label: "Cancelled", className: "border-red-200 bg-red-50 text-red-700" };
  }
  if (booking.rescheduleRequestedFor) {
    return { label: "Pending reschedule", className: "border-amber-200 bg-amber-50 text-amber-800" };
  }
  if (booking.status === "confirmed" || booking.status === "checked_in") {
    return { label: booking.status === "checked_in" ? "Checked in" : "Confirmed", className: "border-teal-200 bg-teal-50 text-teal-800" };
  }
  return { label: booking.status.replace("_", " "), className: "border-border bg-muted text-muted-foreground" };
}

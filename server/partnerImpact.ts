export type ImpactBooking = {
  status: string;
  partySize: number;
  totalPriceCents: number;
  commissionCents: number;
};

export type ImpactRsvp = {
  status: string;
  checkedIn: boolean;
};

export function summarizePartnerImpact(bookings: ImpactBooking[], rsvps: ImpactRsvp[]) {
  const activeBookings = bookings.filter((booking) => booking.status !== "cancelled");
  const attendanceSignals = activeBookings.filter((booking) => booking.status === "checked_in").length;
  const rsvpIntent = rsvps.filter((rsvp) => rsvp.status === "going" || rsvp.status === "maybe").length;
  const rsvpCheckIns = rsvps.filter((rsvp) => rsvp.checkedIn).length;

  return {
    bookingCount: activeBookings.length,
    bookedSeats: activeBookings.reduce((total, booking) => total + booking.partySize, 0),
    attendanceSignals,
    rsvpIntent,
    rsvpCheckIns,
    grossBookingValueCents: activeBookings.reduce((total, booking) => total + booking.totalPriceCents, 0),
    platformCommissionCents: activeBookings.reduce((total, booking) => total + booking.commissionCents, 0),
  };
}

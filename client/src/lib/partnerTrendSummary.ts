export type PartnerTrendSummaryPoint = { bookings: number; attendance: number };

export function summarizePartnerTrendRange(points: PartnerTrendSummaryPoint[]) {
  const totalBookings = points.reduce((total, point) => total + point.bookings, 0);
  const totalAttendance = points.reduce((total, point) => total + point.attendance, 0);
  return {
    totalBookings,
    totalAttendance,
    averageDailyAttendance: points.length === 0 ? 0 : totalAttendance / points.length,
  };
}

export function formatAverageDailyAttendance(value: number) {
  return value % 1 === 0 ? String(value) : value.toFixed(1);
}

export function getPartnerTrendTooltipLabel(label: string, value: number, metric: "bookings" | "attendance") {
  const singular = metric === "bookings" ? "booking" : "attendance check-in";
  return `${label}: ${value} ${singular}${value === 1 ? "" : "s"}`;
}

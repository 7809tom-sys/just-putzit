export type PartnerTrendRange = { start: string; end: string };
export type PartnerTrendPreset = "7d" | "30d" | "90d" | "custom";

function toInputDate(value: Date) {
  const offset = value.getTimezoneOffset();
  const local = new Date(value.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 10);
}

export function getPartnerTrendPresetRange(days: 7 | 30 | 90, now = new Date()): PartnerTrendRange {
  const end = new Date(now);
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));
  return { start: toInputDate(start), end: toInputDate(end) };
}

export function getPartnerTrendRangeLabel(range: PartnerTrendRange, preset: PartnerTrendPreset) {
  if (preset === "7d") return "Last 7 days";
  if (preset === "30d") return "Last 30 days";
  if (preset === "90d") return "Last 90 days";
  if (!range.start || !range.end) return "Custom period";
  return `${new Date(`${range.start}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${new Date(`${range.end}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
}

export function getTodayInputDate(now = new Date()) {
  return toInputDate(now);
}

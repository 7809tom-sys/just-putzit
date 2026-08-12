import { Card, CardContent } from "@/components/ui/card";
import { CalendarRange, CheckCircle2, Ticket, UsersRound } from "lucide-react";
import { useState } from "react";
import { formatAverageDailyAttendance, summarizePartnerTrendRange } from "@/lib/partnerTrendSummary";

export type PartnerTrendPoint = {
  date: string;
  label: string;
  bookings: number;
  attendance: number;
};

function TrendChart({ title, description, dataKey, data, color, icon }: { title: string; description: string; dataKey: "bookings" | "attendance"; data: PartnerTrendPoint[]; color: string; icon: React.ReactNode }) {
  const width = 640;
  const height = 220;
  const padding = { top: 18, right: 10, bottom: 34, left: 32 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const values = data.map((point) => point[dataKey]);
  const rawMax = Math.max(0, ...values);
  const max = Math.max(1, rawMax);
  const points = data.map((point, index) => {
    const x = padding.left + (data.length <= 1 ? 0 : (index / (data.length - 1)) * chartWidth);
    const y = padding.top + chartHeight - ((point[dataKey] / max) * chartHeight);
    return { x, y, date: point.date, label: point.label, value: point[dataKey] };
  });
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = points.length ? `${padding.left},${padding.top + chartHeight} ${line} ${padding.left + chartWidth},${padding.top + chartHeight}` : "";
  const hasSignal = rawMax > 0;
  const labelStep = Math.max(1, Math.ceil(data.length / 5));
  const gradientId = `partner-${dataKey}-fill`;
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const activePoint = activeIndex === null ? null : points[activeIndex];
  const metricLabel = dataKey === "bookings" ? "booking" : "attendance check-in";

  return <Card className="border-none shadow-sm"><CardContent className="p-5 sm:p-6"><div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">{icon}</span><div><h3 className="font-display text-xl font-bold">{title}</h3><p className="mt-1 text-sm text-muted-foreground">{description}</p></div></div><div className="relative mt-5 h-52" aria-label={`${title} over the selected period`}><svg className="pointer-events-none h-full w-full overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.3" /><stop offset="100%" stopColor={color} stopOpacity="0.02" /></linearGradient></defs>{(hasSignal ? [0, 0.5, 1] : [0]).map((ratio) => { const y = padding.top + chartHeight - chartHeight * ratio; return <g key={ratio}><line x1={padding.left} x2={padding.left + chartWidth} y1={y} y2={y} stroke="currentColor" className="text-border" strokeDasharray="4 5" /><text x={padding.left - 8} y={y + 4} textAnchor="end" className="fill-muted-foreground text-[11px]">{Math.round(max * ratio)}</text></g>; })}{area && <polygon points={area} fill={`url(#${gradientId})`} />}<polyline points={line} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />{points.filter((_, index) => index % labelStep === 0 || index === points.length - 1 || index === activeIndex).map((point) => <g key={`${point.label}-${point.value}`}><circle cx={point.x} cy={point.y} r={activePoint === point ? "5.5" : "3.5"} fill={color} stroke="white" strokeWidth="2" /><text x={point.x} y={height - 8} textAnchor="middle" className="fill-muted-foreground text-[10px]">{point.label}</text></g>)}</svg>{points.map((point, index) => <button key={point.date} type="button" className="absolute h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" style={{ left: `${(point.x / width) * 100}%`, top: `${(point.y / height) * 100}%` }} onMouseEnter={() => setActiveIndex(index)} onMouseLeave={() => setActiveIndex(null)} onFocus={() => setActiveIndex(index)} onBlur={() => setActiveIndex(null)} aria-label={`${point.label}: ${point.value} ${metricLabel}${point.value === 1 ? "" : "s"}`} />)}{activePoint && <div role="tooltip" className="pointer-events-none absolute z-10 min-w-36 -translate-x-1/2 -translate-y-[calc(100%+0.7rem)] rounded-xl border bg-popover px-3 py-2 text-popover-foreground shadow-lg" style={{ left: `${Math.min(91, Math.max(9, (activePoint.x / width) * 100))}%`, top: `${(activePoint.y / height) * 100}%` }}><p className="text-xs font-semibold">{activePoint.label}</p><p className="mt-0.5 text-xs text-muted-foreground"><span className="font-bold text-foreground">{activePoint.value}</span> {metricLabel}{activePoint.value === 1 ? "" : "s"}</p></div>}</div><p className="mt-3 text-xs text-muted-foreground">{hasSignal ? "Hover or focus a point to see its exact daily total." : "No activity has been recorded in this selected period yet."}</p></CardContent></Card>;
}

export function PartnerImpactTrendCharts({ data, rangeLabel, isLoading = false }: { data: PartnerTrendPoint[]; rangeLabel: string; isLoading?: boolean }) {
  const summary = summarizePartnerTrendRange(data);
  return <section className="mt-8"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">{rangeLabel}</p><h2 className="mt-1 font-display text-2xl font-bold">See momentum, not just totals.</h2><p className="mt-1 text-sm text-muted-foreground">Daily aggregate signals help you spot when local activity starts to move.</p></div></div>{isLoading ? <div className="mt-5 grid gap-4 sm:grid-cols-2" aria-label="Loading selected-range summary"><div className="h-28 animate-pulse rounded-3xl bg-muted" /><div className="h-28 animate-pulse rounded-3xl bg-muted" /></div> : <><div className="mt-5 grid gap-4 sm:grid-cols-2"><Card className="border-none bg-orange-50 shadow-sm"><CardContent className="flex items-center gap-4 p-5"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-orange-800"><Ticket className="h-5 w-5" /></span><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-orange-800">Selected range</p><p className="mt-1 text-3xl font-bold tracking-tight">{summary.totalBookings}</p><p className="text-sm text-muted-foreground">Total bookings</p></div></CardContent></Card><Card className="border-none bg-teal-50 shadow-sm"><CardContent className="flex items-center gap-4 p-5"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-teal-800"><UsersRound className="h-5 w-5" /></span><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-teal-800">Selected range</p><p className="mt-1 text-3xl font-bold tracking-tight">{formatAverageDailyAttendance(summary.averageDailyAttendance)}</p><p className="text-sm text-muted-foreground">Avg. daily attendance</p></div></CardContent></Card></div><p className="mt-3 text-xs text-muted-foreground">Attendance is calculated from optional booking and RSVP check-ins, averaged across each day in the selected period.</p><div className="mt-5 grid gap-4 lg:grid-cols-2"><TrendChart title="Booking trend" description="Confirmed and checked-in bookings created each day." dataKey="bookings" data={data} color="#ff5a2f" icon={<CalendarRange className="h-5 w-5" />} /><TrendChart title="Attendance trend" description="Voluntary booking and RSVP check-ins by day." dataKey="attendance" data={data} color="#0f766e" icon={<CheckCircle2 className="h-5 w-5" />} /></div></>}</section>;
}

import { Card, CardContent } from "@/components/ui/card";
import { CalendarRange, CheckCircle2 } from "lucide-react";

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
    return { x, y, label: point.label, value: point[dataKey] };
  });
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = points.length ? `${padding.left},${padding.top + chartHeight} ${line} ${padding.left + chartWidth},${padding.top + chartHeight}` : "";
  const hasSignal = rawMax > 0;
  const labelStep = Math.max(1, Math.ceil(data.length / 5));
  const gradientId = `partner-${dataKey}-fill`;

  return <Card className="border-none shadow-sm"><CardContent className="p-5 sm:p-6"><div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">{icon}</span><div><h3 className="font-display text-xl font-bold">{title}</h3><p className="mt-1 text-sm text-muted-foreground">{description}</p></div></div><div className="mt-5 h-52" role="img" aria-label={`${title} over the past 30 days`}><svg className="h-full w-full overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none"><defs><linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.3" /><stop offset="100%" stopColor={color} stopOpacity="0.02" /></linearGradient></defs>{(hasSignal ? [0, 0.5, 1] : [0]).map((ratio) => { const y = padding.top + chartHeight - chartHeight * ratio; return <g key={ratio}><line x1={padding.left} x2={padding.left + chartWidth} y1={y} y2={y} stroke="currentColor" className="text-border" strokeDasharray="4 5" /><text x={padding.left - 8} y={y + 4} textAnchor="end" className="fill-muted-foreground text-[11px]">{Math.round(max * ratio)}</text></g>; })}{area && <polygon points={area} fill={`url(#${gradientId})`} />}<polyline points={line} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />{points.filter((_, index) => index % labelStep === 0 || index === points.length - 1).map((point) => <g key={point.label}><circle cx={point.x} cy={point.y} r="3.5" fill={color} stroke="white" strokeWidth="2" /><text x={point.x} y={height - 8} textAnchor="middle" className="fill-muted-foreground text-[10px]">{point.label}</text></g>)}</svg></div><p className="mt-3 text-xs text-muted-foreground">{hasSignal ? "Daily totals are aggregated across your venues." : "No activity has been recorded in this 30-day window yet."}</p></CardContent></Card>;
}

export function PartnerImpactTrendCharts({ data }: { data: PartnerTrendPoint[] }) {
  return <section className="mt-8"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">30-day trend</p><h2 className="mt-1 font-display text-2xl font-bold">See momentum, not just totals.</h2><p className="mt-1 text-sm text-muted-foreground">Daily aggregate signals help you spot when local activity starts to move.</p></div></div><div className="mt-5 grid gap-4 lg:grid-cols-2"><TrendChart title="Booking trend" description="Confirmed and checked-in bookings created each day." dataKey="bookings" data={data} color="#ff5a2f" icon={<CalendarRange className="h-5 w-5" />} /><TrendChart title="Attendance trend" description="Voluntary booking and RSVP check-ins by day." dataKey="attendance" data={data} color="#0f766e" icon={<CheckCircle2 className="h-5 w-5" />} /></div></section>;
}

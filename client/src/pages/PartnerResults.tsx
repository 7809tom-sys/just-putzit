import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useSEO } from "@/hooks/useSEO";
import { PartnerImpactTrendCharts } from "@/components/PartnerImpactTrendCharts";
import { PartnerTrendRangeControls } from "@/components/PartnerTrendRangeControls";
import { getPartnerTrendPresetRange, getPartnerTrendRangeLabel, type PartnerTrendPreset } from "@/lib/partnerTrendRange";
import { useMemo, useState } from "react";
import { BarChart3, CalendarCheck2, ChartNoAxesCombined, CircleCheck, CircleDollarSign, MapPin, Store, Ticket, Users } from "lucide-react";

function currency(cents: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}

function ResultsSkeleton() {
  return <div className="container max-w-6xl py-8 sm:py-12"><Skeleton className="h-11 w-72" /><Skeleton className="mt-3 h-5 w-full max-w-xl" /><div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28 rounded-3xl" />)}</div><Skeleton className="mt-8 h-80 rounded-3xl" /></div>;
}

export default function PartnerResults() {
  useSEO({ title: "Partner Results — Just Putzit", description: "See aggregate booking and attendance signals for your venues." });
  const { isAuthenticated, loading } = useAuth();
  const [trendPreset, setTrendPreset] = useState<PartnerTrendPreset>("30d");
  const [trendRange, setTrendRange] = useState(() => getPartnerTrendPresetRange(30));
  const trendQueryInput = useMemo(() => trendRange, [trendRange.start, trendRange.end]);
  const { data, isLoading, error } = trpc.vendor.impactResults.useQuery(undefined, { enabled: isAuthenticated });
  const isTrendRangeReady = Boolean(trendRange.start && trendRange.end && trendRange.start <= trendRange.end);
  const { data: filteredTrend, isLoading: isTrendLoading } = trpc.vendor.trend.useQuery(trendQueryInput, { enabled: isAuthenticated && isTrendRangeReady });

  if (loading || (isAuthenticated && isLoading)) return <div className="min-h-screen bg-gradient-to-b from-teal-50 via-background to-background"><ResultsSkeleton /></div>;
  if (!isAuthenticated) return <div className="min-h-screen bg-background"><div className="container max-w-md py-24 text-center"><Store className="mx-auto h-12 w-12 text-primary" /><h1 className="mt-5 font-display text-3xl font-bold">Partner results</h1><p className="mt-3 text-muted-foreground">Sign in to see aggregate activity for your venue.</p><Button className="mt-6 rounded-full" onClick={() => { window.location.href = getLoginUrl(); }}>Sign in</Button></div></div>;
  if (error) return <div className="min-h-screen bg-background"><div className="container max-w-md py-24 text-center"><h1 className="font-display text-3xl font-bold">Results are unavailable</h1><p className="mt-3 text-muted-foreground">Please refresh or return to your partner portal.</p><Button className="mt-6 rounded-full" asChild><a href="/vendor">Back to partner portal</a></Button></div></div>;

  const totals = data?.totals;
  const venues = data?.venues ?? [];
  const trend = filteredTrend ?? data?.trend ?? [];
  const trendLabel = getPartnerTrendRangeLabel(trendRange, trendPreset);
  return <div className="min-h-screen bg-gradient-to-b from-teal-50 via-background to-background pb-24"><main className="container max-w-6xl py-8 sm:py-12"><section className="grid gap-6 rounded-[2rem] border border-teal-900/10 bg-card p-6 shadow-sm sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end"><div><Badge className="rounded-full bg-teal-700">Partner impact</Badge><h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">Results that show real local intent.</h1><p className="mt-3 max-w-2xl text-muted-foreground">Bookings, RSVP interest, and optional attendance check-ins across your venues. Member identities and private answers are never included here.</p></div><Button variant="outline" className="rounded-full bg-card" asChild><a href="/vendor">Partner portal <Store className="ml-2 h-4 w-4" /></a></Button></section>

  <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><ResultStat icon={<Ticket className="h-5 w-5" />} label="Confirmed bookings" value={String(totals?.bookingCount ?? 0)} detail={`${totals?.bookedSeats ?? 0} booked seats`} tone="primary" /><ResultStat icon={<CalendarCheck2 className="h-5 w-5" />} label="Attendance signals" value={String((totals?.attendanceSignals ?? 0) + (totals?.rsvpCheckIns ?? 0))} detail="Optional, aggregate check-ins" tone="teal" /><ResultStat icon={<Users className="h-5 w-5" />} label="RSVP intent" value={String(totals?.rsvpIntent ?? 0)} detail="Going or maybe responses" tone="amber" /><ResultStat icon={<CircleDollarSign className="h-5 w-5" />} label="Booking value" value={currency(totals?.grossBookingValueCents ?? 0)} detail={`${currency(totals?.platformCommissionCents ?? 0)} platform commission`} tone="slate" /></section>

  <PartnerTrendRangeControls range={trendRange} preset={trendPreset} onRangeChange={setTrendRange} onPresetChange={setTrendPreset} />{!isTrendRangeReady && trendPreset === "custom" && <p className="mt-3 text-sm text-destructive">Choose both dates, with the start date before the end date.</p>}<PartnerImpactTrendCharts data={trend} rangeLabel={trendLabel} isLoading={isTrendLoading && isTrendRangeReady} /><section className="mt-8"><div className="flex items-end justify-between gap-4"><div><div className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-teal-700" /><h2 className="font-display text-2xl font-bold">Venue-by-venue results</h2></div><p className="mt-1 text-sm text-muted-foreground">Use these totals in your monthly partner review—not as a list of individual members.</p></div></div>{venues.length > 0 ? <div className="mt-5 grid gap-4 lg:grid-cols-2">{venues.map((venue) => <Card key={venue.id} className="border-none shadow-sm"><CardContent className="p-6"><div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><h3 className="font-display text-xl font-bold">{venue.name}</h3><Badge variant="outline" className="rounded-full capitalize">{venue.category.replace("_", " ")}</Badge></div><p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{venue.city ?? "Location pending"}</p></div><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-50 text-teal-800"><ChartNoAxesCombined className="h-5 w-5" /></span></div><div className="mt-5 grid grid-cols-2 gap-3"><Metric label="Bookings" value={venue.metrics.bookingCount} /><Metric label="Attendance" value={venue.metrics.attendanceSignals + venue.metrics.rsvpCheckIns} /><Metric label="RSVP intent" value={venue.metrics.rsvpIntent} /><Metric label="Booking value" value={currency(venue.metrics.grossBookingValueCents)} /></div><div className="mt-5 rounded-2xl bg-teal-50/70 p-4 text-sm text-teal-950"><CircleCheck className="mr-2 inline h-4 w-4 text-teal-700" />Check-ins are voluntary. You receive aggregate confirmation signals only—never a member roster.</div></CardContent></Card>)}</div> : <Card className="mt-5 border-dashed border-2 bg-muted/20"><CardContent className="p-10 text-center"><Store className="mx-auto h-10 w-10 text-muted-foreground" /><h3 className="mt-4 font-semibold">Register your first venue to start measuring impact</h3><p className="mt-2 text-sm text-muted-foreground">When your activities are live, this page will show bookings, RSVP intent, and optional attendance signals.</p><Button className="mt-5 rounded-full" asChild><a href="/vendor">Go to partner portal</a></Button></CardContent></Card>}</section></main></div>;
}

function ResultStat({ icon, label, value, detail, tone }: { icon: React.ReactNode; label: string; value: string; detail: string; tone: "primary" | "teal" | "amber" | "slate" }) {
  const tones = { primary: "bg-primary text-primary-foreground", teal: "bg-teal-700 text-white", amber: "bg-amber-100 text-amber-950", slate: "bg-slate-900 text-white" };
  return <Card className={`border-none shadow-sm ${tones[tone]}`}><CardContent className="p-5">{icon}<p className="mt-5 text-3xl font-bold">{value}</p><p className="mt-1 text-sm font-medium">{label}</p><p className="mt-1 text-xs opacity-80">{detail}</p></CardContent></Card>;
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-2xl border bg-muted/20 p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-lg font-bold">{value}</p></div>;
}

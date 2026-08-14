import { ExternalLink, LibraryBig } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { getWaukeshaLibrarySpotlight } from "@/lib/waukeshaLibrarySpotlight";
import { LibraryCalendarMenu } from "@/components/LibraryCalendarMenu";

function formatProgramDate(value: Date | string) {
  return new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

export function WaukeshaLibrarySpotlight({ onExplore, dark = false }: { onExplore: () => void; dark?: boolean }) {
  const { data: events = [], isLoading } = trpc.events.list.useQuery({ city: "Waukesha", limit: 100 });
  const upcoming = getWaukeshaLibrarySpotlight(events as Array<{ id: number; title: string; eventDate: Date | string; venueName?: string | null; address?: string | null; externalUrl?: string | null }>);
  const panelClass = dark ? "border-sky-400/25 bg-sky-400/10 text-white" : "border-sky-200 bg-sky-50 text-foreground";
  const secondaryClass = dark ? "border-sky-300/30 bg-white/10 text-white hover:bg-white/20" : "border-sky-200 bg-white text-foreground hover:bg-sky-50";
  const detailClass = dark ? "text-sky-100" : "text-sky-800";

  return <section aria-label="Waukesha Public Library programs" className={`rounded-2xl border p-4 shadow-sm ${panelClass}`}>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3"><div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${dark ? "bg-sky-300/20 text-sky-100" : "bg-sky-100 text-sky-700"}`}><LibraryBig className="h-5 w-5" /></div><div className="min-w-0"><p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${dark ? "text-sky-200" : "text-sky-700"}`}>Featured local venue</p><h2 className="font-display text-lg font-bold">Waukesha Public Library</h2>{isLoading ? <p className={`mt-0.5 text-sm ${detailClass}`}>Loading current free programs…</p> : upcoming ? <p className={`mt-0.5 text-sm ${detailClass}`}><span className="font-semibold">Next up:</span> {upcoming.title} · {formatProgramDate(upcoming.eventDate)}</p> : <p className={`mt-0.5 text-sm ${detailClass}`}>Free author talks, films, book clubs, games, and public programs.</p>}</div></div>
      <div className="flex flex-wrap gap-2"><Button size="sm" className="rounded-full bg-orange-500 text-white hover:bg-orange-600" onClick={onExplore}>View programs</Button>{upcoming && <LibraryCalendarMenu program={upcoming} dark={dark} />}<Button size="sm" variant="outline" className={`rounded-full ${secondaryClass}`} onClick={() => window.open(upcoming?.externalUrl ?? "https://waukesha.librarycalendar.com/events/upcoming", "_blank", "noopener,noreferrer")}>Official calendar <ExternalLink className="ml-1.5 h-3.5 w-3.5" /></Button></div>
    </div>
  </section>;
}

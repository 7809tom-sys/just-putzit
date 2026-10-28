import { useState } from "react";
import { Calendar, ExternalLink, MapPin, Navigation } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useUserCity } from "@/hooks/useUserCity";
import { formatMilesAway } from "@shared/geo";

const RADIUS_OPTIONS = [5, 15, 25];

type MatchType = "date" | "friends" | "gym_buddy";

const MATCH_LABELS: Record<MatchType, string> = {
  date: "Date",
  friends: "Friends",
  gym_buddy: "Gym Buddy",
};

export function HappeningNearYou() {
  const { city, detectedCity } = useUserCity();
  const [radiusMiles, setRadiusMiles] = useState(15);
  const [matchType, setMatchType] = useState<MatchType>("date");
  const locationReady = Boolean(detectedCity?.city);
  const location = trpc.localDiscovery.happeningNearYou.useQuery({
    city: detectedCity?.city ?? city,
    state: detectedCity?.state || undefined,
    postalCode: detectedCity?.postalCode,
    lat: detectedCity?.lat,
    lng: detectedCity?.lng,
    radiusMiles,
    matchType,
  }, { enabled: locationReady });

  const events = location.data?.events ?? [];
  const locationLabel = location.data?.locationLabel || detectedCity?.displayName || city;
  const sourceNote = locationSourceNote(detectedCity?.source);
  const keyedSources = (location.data?.sources ?? []).filter((source) => source.id === "ticketmaster" || source.id === "eventbrite" || source.id === "facebook_events");

  return (
    <section className="rounded-3xl border border-border/70 bg-white p-5 shadow-sm sm:p-6" aria-label="Happening near you">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            <Navigation className="h-3.5 w-3.5" /> Happening near you
          </div>
          <h2 className="mt-1 font-display text-2xl font-bold text-foreground">Plans around {locationLabel}</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Sally looks at the next two weeks of public library, museum, newspaper, church, and nonprofit calendars, plus independent local spots. {sourceNote}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select aria-label="Match type for nearby events" value={matchType} onChange={(event) => setMatchType(event.target.value as MatchType)} className="rounded-full border border-border bg-background px-3 py-2 text-xs font-medium text-foreground">
            {(Object.keys(MATCH_LABELS) as MatchType[]).map((value) => <option key={value} value={value}>{MATCH_LABELS[value]}</option>)}
          </select>
          <select aria-label="Nearby event radius" value={radiusMiles} onChange={(event) => setRadiusMiles(Number(event.target.value))} className="rounded-full border border-border bg-background px-3 py-2 text-xs font-medium text-foreground">
            {RADIUS_OPTIONS.map((miles) => <option key={miles} value={miles}>Within {miles} miles</option>)}
          </select>
        </div>
      </div>

      {(!locationReady || location.isLoading) && <div className="mt-5 rounded-2xl bg-muted/40 p-4 text-sm text-muted-foreground">Looking up what’s happening near you…</div>}
      {location.data?.needsLocation && locationReady && !location.isLoading && (
        <div className="mt-5 rounded-2xl bg-muted/40 p-4 text-sm text-muted-foreground">Add a city on your profile, or allow location on this device, and Sally can pull community plans for you.</div>
      )}
      {locationReady && !location.isLoading && !location.data?.needsLocation && events.length === 0 && (
        <div className="mt-5 rounded-2xl bg-muted/40 p-4 text-sm text-muted-foreground">Nothing in the next two weeks matched this radius yet. Curated calendars and free public feeds refresh a few times a day.</div>
      )}

      {events.length > 0 && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {events.map((event) => (
            <article key={event.id} className="rounded-2xl border border-border/70 bg-card p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">{labelFor(event.organizerKind)}</span>
                {event.isFree && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">Free</span>}
                {!event.isFree && event.priceCents != null && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">${Math.round(event.priceCents / 100)}</span>}
                {event.familyFriendly && <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-800">Family-friendly</span>}
              </div>
              <h3 className="font-semibold text-sm leading-snug text-foreground">{event.title}</h3>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                {new Date(event.start).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                {event.distanceMiles != null ? ` · ${formatMilesAway(event.distanceMiles)}` : ""}
              </p>
              {(event.venueName || event.address) && (
                <p className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <span>{event.venueName}{event.address ? ` · ${event.address}` : ""}</span>
                </p>
              )}
              {event.description && <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{event.description}</p>}
              <div className="mt-3 flex items-center justify-between gap-2 text-xs">
                <span className="text-muted-foreground">{event.sourceLabel}</span>
                {event.url && <a href={event.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">Details <ExternalLink className="h-3.5 w-3.5" /></a>}
              </div>
            </article>
          ))}
        </div>
      )}

      {keyedSources.length > 0 && (
        <p className="mt-4 text-xs text-muted-foreground">
          {keyedSources.map((source) => `${source.label}: ${source.detail}`).join(" ")}
          {location.data?.stale ? " Showing the saved list while a newer one loads." : ""}
        </p>
      )}
    </section>
  );
}

function locationSourceNote(source?: string) {
  if (source === "gps") return "This list uses this device’s location, which you allowed.";
  if (source === "manual") return "This list uses the place you picked.";
  return "This list uses the city saved on your profile.";
}

function labelFor(kind: string) {
  if (kind === "gym_buddy") return "Gym Buddy";
  if (kind === "ticketed") return "Tickets";
  return kind.replace(/_/g, " ");
}

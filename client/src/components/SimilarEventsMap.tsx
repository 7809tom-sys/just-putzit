import { MapPin } from "lucide-react";
import { getMappableSimilarEvents, getSimilarEventsMapPoints, type MappableSimilarEvent } from "@shared/similarEventsMap";

type SimilarEventMapItem = MappableSimilarEvent & {
  title: string;
  venueName?: string | null;
  venueCity?: string | null;
};

export function SimilarEventsMap({ events, onSelect }: { events: SimilarEventMapItem[]; onSelect: (eventId: number) => void }) {
  const mappableEvents = getMappableSimilarEvents(events);
  const points = getSimilarEventsMapPoints(mappableEvents);

  if (points.length === 0) {
    return <div className="flex min-h-48 items-center justify-center rounded-2xl border border-dashed border-border bg-white/70 px-5 text-center text-sm text-muted-foreground"><MapPin className="mr-2 h-4 w-4 text-primary" />Location markers are not available for these similar events yet.</div>;
  }

  return <div className="relative h-[340px] overflow-hidden rounded-2xl border border-border bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(222,247,241,0.86))]" aria-label="Map of similar event locations">
    <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(23,112,103,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(23,112,103,0.12)_1px,transparent_1px)] [background-size:42px_42px]" />
    <div className="absolute left-[9%] top-[24%] h-[2px] w-[82%] rotate-[-11deg] bg-primary/20" />
    <div className="absolute left-[17%] top-[65%] h-[2px] w-[68%] rotate-[9deg] bg-primary/20" />
    <div className="absolute left-4 top-4 rounded-full border border-white/80 bg-white/90 px-3 py-1 text-xs font-semibold text-foreground">Nearby locations</div>
    {points.map(({ event, x, y }, index) => (
      <button
        key={event.id}
        type="button"
        className="group absolute -translate-x-1/2 -translate-y-1/2 focus-visible:outline-none"
        style={{ left: `${x}%`, top: `${y}%` }}
        onClick={() => onSelect(event.id)}
        aria-label={`Open ${event.title}${event.venueName ? ` at ${event.venueName}` : ""}`}
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-primary text-primary-foreground shadow-lg transition-transform duration-150 group-hover:scale-110 group-focus-visible:scale-110"><MapPin className="h-4 w-4" /></span>
        <span className="pointer-events-none absolute left-1/2 top-11 hidden w-40 -translate-x-1/2 rounded-lg bg-foreground px-2 py-1.5 text-xs font-medium text-background shadow-lg group-hover:block group-focus-visible:block">{event.title}</span>
        <span className="sr-only">Location {index + 1}</span>
      </button>
    ))}
    <div className="absolute bottom-4 left-4 rounded-xl bg-white/92 px-3 py-2 text-xs text-muted-foreground shadow-sm">Tap a pin to open event details</div>
  </div>;
}

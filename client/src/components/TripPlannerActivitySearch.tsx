import { useState } from "react";
import { ExternalLink, Search, Ticket } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type TripPlannerDiscoverableEvent = {
  id: number;
  title: string;
  description?: string | null;
  eventDate?: Date | string | null;
  venueName?: string | null;
  address?: string | null;
  city?: string | null;
  isFree?: boolean | null;
  externalUrl?: string | null;
};

export function TripPlannerActivitySearch({
  onAddEvent,
  isAdding,
}: {
  onAddEvent: (event: TripPlannerDiscoverableEvent) => void;
  isAdding: boolean;
}) {
  const [zipCode, setZipCode] = useState("");
  const [submittedZipCode, setSubmittedZipCode] = useState("");
  const { data: resolvedLocation, isFetching: isResolving, error: locationError } = trpc.location.resolve.useQuery(
    { query: submittedZipCode },
    { enabled: submittedZipCode.length > 0, retry: false },
  );
  const { data: nearbyEvents = [], isFetching: isLoadingEvents } = trpc.events.list.useQuery(
    {
      city: resolvedLocation?.city,
      lat: resolvedLocation?.lat,
      lng: resolvedLocation?.lng,
      radiusMiles: 30,
      limit: 50,
    },
    { enabled: Boolean(resolvedLocation) },
  );

  const search = () => {
    const normalizedZip = zipCode.trim();
    if (!/^\d{5}(?:-\d{4})?$/.test(normalizedZip)) {
      toast.error("Enter a valid 5-digit ZIP code.");
      return;
    }
    setSubmittedZipCode(normalizedZip);
  };

  return (
    <section className="mb-8 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4" aria-labelledby="trip-activity-search-heading">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Build this trip</p>
          <h3 id="trip-activity-search-heading" className="mt-1 text-xl font-bold text-gray-900">Find activities near a ZIP code</h3>
          <p className="mt-1 text-sm text-gray-600">We show current public events within 30 miles. Add one to your itinerary, then use its official page for tickets or reservations.</p>
        </div>
        <div className="flex w-full gap-2 md:w-auto">
          <Input
            aria-label="ZIP code for nearby trip activities"
            inputMode="numeric"
            maxLength={10}
            placeholder="ZIP code"
            value={zipCode}
            onChange={(event) => setZipCode(event.target.value.replace(/[^0-9-]/g, ""))}
            onKeyDown={(event) => { if (event.key === "Enter") search(); }}
            className="bg-white md:w-36"
          />
          <Button type="button" onClick={search} disabled={isResolving} className="gap-2 bg-emerald-700 hover:bg-emerald-800"><Search size={16} />Search</Button>
        </div>
      </div>
      {locationError && <p className="mt-3 text-sm font-medium text-red-700">{locationError.message}</p>}
      {submittedZipCode && resolvedLocation && <p className="mt-3 text-sm text-emerald-800">Showing upcoming options near <span className="font-semibold">{resolvedLocation.city}, {resolvedLocation.state}</span> ({submittedZipCode}).</p>}
      {(isResolving || isLoadingEvents) && <p className="mt-4 text-sm text-gray-600">Finding current activities…</p>}
      {!isLoadingEvents && submittedZipCode && resolvedLocation && nearbyEvents.length === 0 && <p className="mt-4 text-sm text-gray-600">No current activities were found within 30 miles. Try another ZIP code or check back soon.</p>}
      {nearbyEvents.length > 0 && (
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {(nearbyEvents as TripPlannerDiscoverableEvent[]).slice(0, 8).map((event) => (
            <article key={event.id} className="border border-emerald-100 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="font-bold text-gray-900">{event.title}</h4>
                  <p className="mt-1 text-sm text-gray-600">{event.eventDate ? new Date(event.eventDate).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "Date to be confirmed"}</p>
                  {(event.venueName || event.city) && <p className="mt-1 text-sm text-gray-600">{[event.venueName, event.city].filter(Boolean).join(" · ")}</p>}
                </div>
                {event.isFree && <Badge className="shrink-0 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Free</Badge>}
              </div>
              {event.description && <p className="mt-3 line-clamp-2 text-sm text-gray-600">{event.description}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="button" size="sm" onClick={() => onAddEvent(event)} disabled={isAdding}>Add to itinerary</Button>
                {event.externalUrl && <Button asChild type="button" size="sm" variant="outline" className="gap-1.5"><a href={event.externalUrl} target="_blank" rel="noopener noreferrer"><Ticket size={14} />Official details / book <ExternalLink size={13} /></a></Button>}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

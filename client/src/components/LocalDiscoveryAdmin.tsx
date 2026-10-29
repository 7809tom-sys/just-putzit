import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const FEED_KINDS = ["ics", "rss", "jsonld", "html"] as const;
const ORGANIZERS = ["library", "museum", "newspaper", "church", "nonprofit", "business", "other"] as const;

export function LocalDiscoveryAdmin() {
  const utils = trpc.useUtils();
  const [areaKey, setAreaKey] = useState("city:milwaukee|wi");
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [feedKind, setFeedKind] = useState<(typeof FEED_KINDS)[number]>("ics");
  const [organizerKind, setOrganizerKind] = useState<(typeof ORGANIZERS)[number]>("library");
  const [businessName, setBusinessName] = useState("");
  const [businessCity, setBusinessCity] = useState("");
  const [classification, setClassification] = useState<"local" | "chain">("local");
  const feeds = trpc.localDiscovery.listFeeds.useQuery({ areaKey });
  const overrides = trpc.localDiscovery.listOverrides.useQuery();
  const addFeed = trpc.localDiscovery.addFeed.useMutation({
    onSuccess: () => {
      setUrl("");
      setLabel("");
      utils.localDiscovery.listFeeds.invalidate({ areaKey });
      toast.success("Feed saved for this area");
    },
    onError: () => toast.error("Could not save that feed"),
  });
  const removeFeed = trpc.localDiscovery.removeFeed.useMutation({
    onSuccess: () => utils.localDiscovery.listFeeds.invalidate({ areaKey }),
  });
  const setOverride = trpc.localDiscovery.setVenueOverride.useMutation({
    onSuccess: () => {
      setBusinessName("");
      utils.localDiscovery.listOverrides.invalidate();
      toast.success("Venue classification saved");
    },
    onError: () => toast.error("Could not save that venue"),
  });
  const removeOverride = trpc.localDiscovery.removeVenueOverride.useMutation({
    onSuccess: () => utils.localDiscovery.listOverrides.invalidate(),
  });

  return (
    <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
      <p className="text-sm font-medium text-emerald-950">Local discovery feeds and chain overrides</p>
      <p className="mt-1 text-xs text-slate-600">
        Area keys look like <span className="font-mono">city:milwaukee|wi</span> or <span className="font-mono">zip:53202</span>. Add a library, museum, newspaper, church, nonprofit, or independent business calendar. Mark a business local or chain when the automatic check is wrong.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <Input aria-label="Discovery area key" value={areaKey} onChange={(event) => setAreaKey(event.target.value)} placeholder="city:milwaukee|wi" />
        <Input aria-label="Feed label" value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Milwaukee Public Library" />
        <Input aria-label="Feed URL" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.org/events.ics" className="sm:col-span-2" />
        <select aria-label="Feed kind" value={feedKind} onChange={(event) => setFeedKind(event.target.value as typeof feedKind)} className="rounded-md border border-border bg-background px-3 py-2 text-sm">
          {FEED_KINDS.map((kind) => <option key={kind} value={kind}>{kind}</option>)}
        </select>
        <select aria-label="Feed organizer" value={organizerKind} onChange={(event) => setOrganizerKind(event.target.value as typeof organizerKind)} className="rounded-md border border-border bg-background px-3 py-2 text-sm">
          {ORGANIZERS.map((kind) => <option key={kind} value={kind}>{kind}</option>)}
        </select>
      </div>
      <Button type="button" size="sm" className="mt-2 rounded-full" disabled={!url || !label || addFeed.isPending} onClick={() => addFeed.mutate({ areaKey, url, label, feedKind, organizerKind })}>Add feed</Button>
      <div className="mt-3 space-y-1">
        {(feeds.data ?? []).map((feed) => (
          <div key={`${feed.areaKey}-${feed.url}`} className="flex items-center justify-between gap-2 rounded-lg bg-white/80 px-2 py-1.5 text-xs">
            <span className="truncate">{feed.label} · {feed.feedKind}</span>
            {feed.id && <button type="button" className="font-semibold text-red-700" onClick={() => removeFeed.mutate({ id: feed.id! })}>Remove</button>}
          </div>
        ))}
        {feeds.data?.length === 0 && <p className="text-xs text-slate-600">No curated feeds for this area yet. OpenStreetMap calendars still run on their own.</p>}
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_8rem_8rem_auto]">
        <Input aria-label="Business name" value={businessName} onChange={(event) => setBusinessName(event.target.value)} placeholder="Business name, or osm:node/123" />
        <Input aria-label="Business city" value={businessCity} onChange={(event) => setBusinessCity(event.target.value)} placeholder="City" />
        <select aria-label="Local or chain" value={classification} onChange={(event) => setClassification(event.target.value as "local" | "chain")} className="rounded-md border border-border bg-background px-3 py-2 text-sm">
          <option value="local">Local</option>
          <option value="chain">Chain</option>
        </select>
        <Button type="button" size="sm" variant="outline" className="rounded-full" disabled={!businessName || setOverride.isPending} onClick={() => setOverride.mutate({ displayName: businessName, city: businessCity || undefined, classification })}>Save</Button>
      </div>
      <div className="mt-2 space-y-1">
        {(overrides.data ?? []).map((override) => (
          <div key={override.venueKey} className="flex items-center justify-between gap-2 text-xs">
            <span>{override.displayName}{override.city ? ` · ${override.city}` : ""} · {override.classification}</span>
            {override.id && <button type="button" className="font-semibold text-red-700" onClick={() => removeOverride.mutate({ id: override.id! })}>Remove</button>}
          </div>
        ))}
      </div>
    </div>
  );
}

import { annotateOwnership, allowsDiscoveredEvent, dedupeEvents } from "./rank";
import { extractFeedLinks, parseIcsFeed, parseJsonLd, parseRssFeed, type ParseContext } from "./parse";
import {
  DISCOVERY_WINDOW_DAYS,
  isWithinDiscoveryWindow,
  redactUrl,
  resolveBusinessPolicy,
  type CuratedFeed,
  type LocalBusinessPolicy,
  type NormalizedEvent,
  type OrganizerKind,
  type OsmPlace,
  type SourceReport,
  type VenueOverride,
} from "./model";
import {
  eventbriteFailure,
  eventbriteSearchUrl,
  FACEBOOK_EVENTS_SOURCE,
  isAllowedByRobots,
  mapEventbriteEvents,
  mapTicketmasterEvents,
  overpassQuery,
  ownershipForPlace,
  parseOverpassPlaces,
  placeSortRank,
  skippedSource,
  ticketmasterSearchUrl,
} from "./sources";

export type DiscoveryFetch = (
  url: string,
  init?: { method?: string; body?: string; headers?: Record<string, string>; timeoutMs?: number },
) => Promise<{ ok: boolean; status: number; text: string }>;

export type DiscoveryRequest = {
  lat: number;
  lng: number;
  radiusMiles: number;
  city?: string;
  state?: string;
  curatedFeeds?: CuratedFeed[];
  overrides?: VenueOverride[];
  policy?: Partial<LocalBusinessPolicy>;
  ticketmasterApiKey?: string | null;
  eventbriteToken?: string | null;
};

export type DiscoveryDeps = {
  fetch: DiscoveryFetch;
  now?: Date;
  deadlineMs?: number;
  maxVenuePages?: number;
  sleep?: (ms: number) => Promise<void>;
  minHostIntervalMs?: number;
};

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

export async function discoverLocalEvents(request: DiscoveryRequest, deps: DiscoveryDeps) {
  const now = deps.now ?? new Date();
  const policy = resolveBusinessPolicy(request.policy);
  const overrides = request.overrides ?? [];
  const deadline = Date.now() + (deps.deadlineMs ?? 12_000);
  const sources: SourceReport[] = [FACEBOOK_EVENTS_SOURCE];
  const collected: NormalizedEvent[] = [];
  const robotsCache = new Map<string, string>();
  const limiter = createLimiter(deps.minHostIntervalMs ?? 1000, deps.sleep ?? delay);

  const fetchText = async (url: string, init?: Parameters<DiscoveryFetch>[1]) => {
    if (Date.now() > deadline) return null;
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return null;
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    const robots = await robotsFor(parsed, robotsCache, limiter, deps.fetch, deadline);
    if (!isAllowedByRobots(robots, url)) return null;
    await limiter.wait(parsed.host);
    if (Date.now() > deadline) return null;
    try {
      const response = await deps.fetch(url, init);
      return response;
    } catch {
      return null;
    }
  };

  const ticketmasterKey = request.ticketmasterApiKey !== undefined ? request.ticketmasterApiKey : process.env.TICKETMASTER_API_KEY ?? "";
  const eventbriteToken = request.eventbriteToken !== undefined
    ? request.eventbriteToken
    : process.env.EVENTBRITE_TOKEN || process.env.EVENTBRITE_API_KEY || "";
  const windowEnd = new Date(now.getTime() + DISCOVERY_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const [placesResult, ticketmasterResult, eventbriteResult] = await Promise.all([
    loadPlaces(request, fetchText),
    loadTicketmaster(ticketmasterKey ?? "", request, now, windowEnd, fetchText),
    loadEventbrite(eventbriteToken ?? "", request, fetchText),
  ]);
  sources.push(placesResult.report, ticketmasterResult.report, eventbriteResult.report);
  collected.push(...ticketmasterResult.events, ...eventbriteResult.events);

  const curated = await loadCuratedFeeds(request.curatedFeeds ?? [], request, fetchText, now);
  sources.push(curated.report);
  collected.push(...curated.events);

  const venuePages = await loadVenuePages(placesResult.places, overrides, policy, request, fetchText, now, deps.maxVenuePages ?? 12);
  sources.push(venuePages.report);
  collected.push(...venuePages.events);

  const annotated = collected.map((event) => annotateOwnership(event, overrides));
  const allowed = annotated.filter((event) => allowsDiscoveredEvent(event, policy) && isWithinDiscoveryWindow(event.start, event.end, now));
  return { events: dedupeEvents(allowed), sources, policy };
}

async function robotsFor(
  url: URL,
  cache: Map<string, string>,
  limiter: ReturnType<typeof createLimiter>,
  fetch: DiscoveryFetch,
  deadline: number,
) {
  const cached = cache.get(url.host);
  if (cached != null) return cached;
  if (Date.now() > deadline) {
    cache.set(url.host, "");
    return "";
  }
  await limiter.wait(url.host);
  try {
    const response = await fetch(`${url.origin}/robots.txt`);
    const text = response.ok ? response.text : "";
    cache.set(url.host, text);
    return text;
  } catch {
    cache.set(url.host, "");
    return "";
  }
}

async function loadPlaces(request: DiscoveryRequest, fetchText: (url: string, init?: Parameters<DiscoveryFetch>[1]) => Promise<{ ok: boolean; status: number; text: string } | null>) {
  const radiusMeters = request.radiusMiles * 1609.34;
  const response = await fetchText(OVERPASS_URL, { method: "POST", body: overpassQuery(request.lat, request.lng, radiusMeters), headers: { "Content-Type": "text/plain" } });
  if (!response) {
    return { places: [] as OsmPlace[], report: errorReport("openstreetmap", "OpenStreetMap places", "The places lookup did not respond. Curated feeds and keyed APIs still run.") };
  }
  if (!response.ok) {
    return { places: [] as OsmPlace[], report: errorReport("openstreetmap", "OpenStreetMap places", `Places lookup returned HTTP ${response.status}.`) };
  }
  try {
    const places = parseOverpassPlaces(JSON.parse(response.text));
    return {
      places,
      report: { id: "openstreetmap", label: "OpenStreetMap places", state: "ok" as const, detail: `Found ${places.length} nearby libraries, museums, churches, newspapers, nonprofits, and businesses.`, eventCount: 0 },
    };
  } catch {
    return { places: [] as OsmPlace[], report: errorReport("openstreetmap", "OpenStreetMap places", "Places lookup returned data that could not be read.") };
  }
}

async function loadTicketmaster(apiKey: string, request: DiscoveryRequest, now: Date, windowEnd: Date, fetchText: (url: string) => Promise<{ ok: boolean; status: number; text: string } | null>) {
  if (!apiKey) return { events: [] as NormalizedEvent[], report: skippedSource("ticketmaster", "Ticketmaster", "Skipped until TICKETMASTER_API_KEY is set. Free community feeds still run.") };
  const response = await fetchText(ticketmasterSearchUrl(apiKey, request.lat, request.lng, request.radiusMiles, now, windowEnd));
  if (!response) return { events: [], report: errorReport("ticketmaster", "Ticketmaster", "Ticketmaster did not respond.") };
  if (!response.ok) return { events: [], report: errorReport("ticketmaster", "Ticketmaster", `Ticketmaster returned HTTP ${response.status}.`) };
  try {
    const events = mapTicketmasterEvents(JSON.parse(response.text));
    return { events, report: { id: "ticketmaster", label: "Ticketmaster", state: "ok" as const, detail: `${events.length} events from the Discovery API.`, eventCount: events.length } };
  } catch {
    return { events: [], report: errorReport("ticketmaster", "Ticketmaster", "Ticketmaster returned data that could not be read.") };
  }
}

async function loadEventbrite(token: string, request: DiscoveryRequest, fetchText: (url: string) => Promise<{ ok: boolean; status: number; text: string } | null>) {
  if (!token) return { events: [] as NormalizedEvent[], report: skippedSource("eventbrite", "Eventbrite", "Skipped until EVENTBRITE_TOKEN is set. Free community feeds still run.") };
  const url = eventbriteSearchUrl(token, request.lat, request.lng, request.radiusMiles);
  const response = await fetchText(url);
  if (!response) return { events: [], report: errorReport("eventbrite", "Eventbrite", `Eventbrite did not respond (${redactUrl(url)}).`) };
  const denied = eventbriteFailure(response.status, response.text);
  if (denied) return { events: [], report: denied };
  if (!response.ok) return { events: [], report: errorReport("eventbrite", "Eventbrite", `Eventbrite returned HTTP ${response.status}.`) };
  try {
    const events = mapEventbriteEvents(JSON.parse(response.text));
    return { events, report: { id: "eventbrite", label: "Eventbrite", state: "ok" as const, detail: `${events.length} events from location search.`, eventCount: events.length } };
  } catch {
    return { events: [], report: errorReport("eventbrite", "Eventbrite", "Eventbrite returned data that could not be read.") };
  }
}

async function loadCuratedFeeds(
  feeds: CuratedFeed[],
  request: DiscoveryRequest,
  fetchText: (url: string) => Promise<{ ok: boolean; status: number; text: string } | null>,
  now: Date,
) {
  const enabled = feeds.filter((feed) => feed.url);
  const events: NormalizedEvent[] = [];
  let failed = 0;
  for (const feed of enabled) {
    const response = await fetchText(feed.url);
    if (!response?.ok) {
      failed += 1;
      continue;
    }
    events.push(...eventsFromDocument(response.text, feed.url, contextFromFeed(feed, request), now));
  }
  return {
    events,
    report: {
      id: "curated_feeds",
      label: "Admin-curated feeds",
      state: "ok" as const,
      detail: enabled.length === 0 ? "No curated feeds for this area yet." : `Read ${enabled.length} curated feed${enabled.length === 1 ? "" : "s"}${failed ? `, ${failed} unavailable` : ""}.`,
      eventCount: events.length,
    },
  };
}

async function loadVenuePages(
  places: OsmPlace[],
  overrides: VenueOverride[],
  policy: LocalBusinessPolicy,
  request: DiscoveryRequest,
  fetchText: (url: string) => Promise<{ ok: boolean; status: number; text: string } | null>,
  now: Date,
  maxVenuePages: number,
) {
  const ordered = [...places].sort((left, right) => placeSortRank(left.organizerKind) - placeSortRank(right.organizerKind));
  let skippedChains = 0;
  let pages = 0;
  const events: NormalizedEvent[] = [];
  const seenSites = new Set<string>();
  for (const place of ordered) {
    if (pages >= maxVenuePages) break;
    const ownership = ownershipForPlace(place, overrides);
    if (policy.featureIndependentOnly && ownership === "chain") {
      skippedChains += 1;
      continue;
    }
    if (!place.website || seenSites.has(place.website)) continue;
    seenSites.add(place.website);
    const page = await fetchText(place.website);
    pages += 1;
    if (!page?.ok) continue;
    const context = contextFromPlace(place, request);
    events.push(...eventsFromDocument(page.text, place.website, context, now));
    const links = extractFeedLinks(page.text, place.website).slice(0, 2);
    for (const link of links) {
      if (pages >= maxVenuePages) break;
      const feed = await fetchText(link.url);
      pages += 1;
      if (!feed?.ok) continue;
      events.push(...(link.kind === "ics" ? parseIcsFeed(feed.text, context) : parseRssFeed(feed.text, context, now)));
    }
  }
  return {
    events,
    report: {
      id: "venue_calendars",
      label: "Venue calendars",
      state: "ok" as const,
      detail: `Checked ${pages} public calendar page${pages === 1 ? "" : "s"}. Skipped ${skippedChains} chain business${skippedChains === 1 ? "" : "es"}.`,
      eventCount: events.length,
    },
  };
}

function eventsFromDocument(body: string, url: string, context: ParseContext, now: Date) {
  const events = [
    ...parseJsonLd(body, { ...context, url: context.url || url }),
    ...parseIcsFeed(body, context),
  ];
  if (/<(rss|feed|item|entry)\b/i.test(body)) events.push(...parseRssFeed(body, context, now));
  return events;
}

function contextFromPlace(place: OsmPlace, request: DiscoveryRequest): ParseContext {
  return {
    source: place.organizerKind,
    sourceLabel: place.name,
    organizerKind: place.organizerKind,
    venueName: place.name,
    address: place.address,
    city: place.city || request.city,
    state: request.state,
    lat: place.lat,
    lng: place.lng,
    url: place.website,
    osmId: place.osmId,
    brand: place.brand,
    brandWikidata: place.brandWikidata,
  };
}

function contextFromFeed(feed: CuratedFeed, request: DiscoveryRequest): ParseContext {
  return {
    source: feed.organizerKind,
    sourceLabel: feed.label,
    organizerKind: feed.organizerKind,
    city: request.city,
    state: request.state,
    url: feed.url,
  };
}

function errorReport(id: string, label: string, detail: string): SourceReport {
  return { id, label, state: "error", detail, eventCount: 0 };
}

function createLimiter(minIntervalMs: number, sleep: (ms: number) => Promise<void>) {
  const last = new Map<string, number>();
  return {
    async wait(host: string) {
      const now = Date.now();
      const previous = last.get(host) ?? 0;
      const waitMs = previous + minIntervalMs - now;
      if (waitMs > 0) await sleep(waitMs);
      last.set(host, Date.now());
    },
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type { OrganizerKind };

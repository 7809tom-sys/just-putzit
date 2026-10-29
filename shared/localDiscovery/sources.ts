import { classifyVenue } from "./chains";
import {
  DISCOVERY_USER_AGENT,
  inferCategory,
  looksFamilyFriendly,
  organizerKindFromTags,
  priceFromText,
  redactUrl,
  stableExternalId,
  type NormalizedEvent,
  type OrganizerKind,
  type OsmPlace,
  type SourceReport,
} from "./model";

export { DISCOVERY_USER_AGENT };

/**
 * Facebook removed third-party access to public events. This adapter is a
 * placeholder so the source list stays explicit. It never requests Facebook
 * and it never scrapes event pages.
 */
export const FACEBOOK_EVENTS_SOURCE: SourceReport = {
  id: "facebook_events",
  label: "Facebook Events",
  state: "unavailable",
  detail: "Facebook no longer allows third-party apps to read public events. This source is a documented placeholder only. Just Putzit does not scrape Facebook.",
  eventCount: 0,
};

export function ticketmasterSearchUrl(apiKey: string, lat: number, lng: number, radiusMiles: number, start: Date, end: Date) {
  const params = new URLSearchParams({
    apikey: apiKey,
    latlong: `${lat},${lng}`,
    radius: String(Math.min(radiusMiles, 100)),
    unit: "miles",
    size: "40",
    sort: "date,asc",
    startDateTime: toTicketmasterTime(start),
    endDateTime: toTicketmasterTime(end),
  });
  return `https://app.ticketmaster.com/discovery/v2/events.json?${params}`;
}

function toTicketmasterTime(date: Date) {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

export function eventbriteSearchUrl(token: string, lat: number, lng: number, radiusMiles: number) {
  const params = new URLSearchParams({
    "location.latitude": String(lat),
    "location.longitude": String(lng),
    "location.within": `${Math.min(radiusMiles, 100)}mi`,
    expand: "venue",
    token,
  });
  return `https://www.eventbriteapi.com/v3/events/search/?${params}`;
}

export function nominatimSearchUrl(query: string) {
  const params = new URLSearchParams({ format: "jsonv2", limit: "1", countrycodes: "us", addressdetails: "1", q: query });
  return `https://nominatim.openstreetmap.org/search?${params}`;
}

export function nominatimReverseUrl(lat: number, lng: number) {
  const params = new URLSearchParams({ format: "jsonv2", addressdetails: "1", lat: String(lat), lon: String(lng) });
  return `https://nominatim.openstreetmap.org/reverse?${params}`;
}

export function overpassQuery(lat: number, lng: number, radiusMeters: number) {
  const around = `around:${Math.round(radiusMeters)},${lat},${lng}`;
  return `[out:json][timeout:25];
(
  node["amenity"="library"](${around});
  way["amenity"="library"](${around});
  node["tourism"="museum"](${around});
  way["tourism"="museum"](${around});
  node["amenity"="place_of_worship"](${around});
  way["amenity"="place_of_worship"](${around});
  node["office"="newspaper"](${around});
  way["office"="newspaper"](${around});
  node["amenity"="community_centre"](${around});
  way["amenity"="community_centre"](${around});
  node["office"="association"](${around});
  node["office"="ngo"](${around});
  way["office"="association"](${around});
  way["office"="ngo"](${around});
  node["amenity"="social_facility"](${around});
  way["amenity"="social_facility"](${around});
  node["amenity"~"^(cafe|restaurant|bar|pub|arts_centre|theatre|cinema)$"](${around});
  way["amenity"~"^(cafe|restaurant|bar|pub|arts_centre|theatre|cinema)$"](${around});
);
out center tags;`;
}

export function parseOverpassPlaces(payload: unknown): OsmPlace[] {
  const elements = (payload as { elements?: unknown[] } | null)?.elements;
  if (!Array.isArray(elements)) return [];
  const places: OsmPlace[] = [];
  for (const element of elements) {
    if (!element || typeof element !== "object") continue;
    const record = element as { type?: string; id?: number; lat?: number; lon?: number; center?: { lat?: number; lon?: number }; tags?: Record<string, string> };
    const tags = record.tags ?? {};
    const name = tags.name?.trim();
    const lat = record.lat ?? record.center?.lat;
    const lng = record.lon ?? record.center?.lon;
    if (!name || typeof lat !== "number" || typeof lng !== "number" || !record.type || record.id == null) continue;
    const street = [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ");
    const website = tags.website || tags["contact:website"] || tags.url;
    places.push({
      osmId: `${record.type}/${record.id}`,
      name,
      lat,
      lng,
      website: website ? normalizeWebsite(website) : undefined,
      city: tags["addr:city"],
      address: [street, tags["addr:city"], tags["addr:state"]].filter(Boolean).join(", ") || undefined,
      organizerKind: organizerKindFromTags(tags),
      brand: tags.brand,
      brandWikidata: tags["brand:wikidata"],
    });
  }
  return places;
}

function normalizeWebsite(website: string) {
  const trimmed = website.trim();
  if (!trimmed || /facebook\.com|fb\.com|instagram\.com/i.test(trimmed)) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function parseNominatim(payload: unknown) {
  const row = Array.isArray(payload) ? payload[0] : payload;
  if (!row || typeof row !== "object") return null;
  const record = row as { lat?: string; lon?: string; address?: Record<string, string> };
  const lat = Number(record.lat);
  const lng = Number(record.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const address = record.address ?? {};
  return {
    lat,
    lng,
    city: address.city || address.town || address.village || address.hamlet || address.county || "",
    state: address.state || "",
    postalCode: address.postcode || "",
  };
}

type RobotGroup = { agents: string[]; disallows: string[] };

export function parseRobots(text: string): RobotGroup[] {
  const groups: RobotGroup[] = [];
  let current: RobotGroup | null = null;
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const split = trimmed.indexOf(":");
    if (split === -1) continue;
    const field = trimmed.slice(0, split).trim().toLowerCase();
    const value = trimmed.slice(split + 1).trim();
    if (field === "user-agent") {
      if (!current || current.disallows.length > 0) {
        current = { agents: [], disallows: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
    } else if (field === "disallow" && current) {
      if (value) current.disallows.push(value);
    }
  }
  return groups;
}

export function isAllowedByRobots(robotsText: string, targetUrl: string, userAgent = DISCOVERY_USER_AGENT) {
  let path = "/";
  try {
    path = new URL(targetUrl).pathname || "/";
  } catch {
    return false;
  }
  const groups = parseRobots(robotsText);
  const agent = userAgent.toLowerCase();
  const specific = groups.find((group) => group.agents.some((entry) => entry !== "*" && agent.includes(entry)));
  const fallback = groups.find((group) => group.agents.includes("*"));
  const rules = specific ?? fallback;
  if (!rules) return true;
  return !rules.disallows.some((rule) => rule === "/" || path === rule || path.startsWith(rule.endsWith("/") ? rule : `${rule}`));
}

export function mapTicketmasterEvents(payload: unknown): NormalizedEvent[] {
  const events = (payload as { _embedded?: { events?: unknown[] } } | null)?._embedded?.events;
  if (!Array.isArray(events)) return [];
  return events.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const event = entry as Record<string, any>;
    const title = String(event.name ?? "").trim();
    const start = Date.parse(event.dates?.start?.dateTime || `${event.dates?.start?.localDate ?? ""}T${event.dates?.start?.localTime ?? "12:00:00"}`);
    if (!title || Number.isNaN(start)) return [];
    const venue = event._embedded?.venues?.[0];
    const price = Number(event.priceRanges?.[0]?.min);
    const priceCents = Number.isFinite(price) ? Math.round(price * 100) : null;
    const text = `${title} ${event.info ?? ""} ${event.pleaseNote ?? ""} ${(event.classifications ?? []).map((item: any) => item?.genre?.name ?? item?.segment?.name ?? "").join(" ")}`;
    const family = /family|child/i.test(text);
    return [{
      externalId: `ticketmaster:${event.id ?? stableExternalId("ticketmaster", title, new Date(start), event.url)}`,
      title,
      description: typeof event.info === "string" ? event.info : typeof event.pleaseNote === "string" ? event.pleaseNote : undefined,
      start: new Date(start),
      end: null,
      venueName: venue?.name,
      address: [venue?.address?.line1, venue?.city?.name, venue?.state?.stateCode].filter(Boolean).join(", "),
      city: venue?.city?.name,
      state: venue?.state?.stateCode,
      lat: numberOrNull(venue?.location?.latitude),
      lng: numberOrNull(venue?.location?.longitude),
      category: inferCategory(text, "ticketed"),
      source: "ticketmaster",
      sourceLabel: "Ticketmaster",
      url: typeof event.url === "string" ? event.url : undefined,
      priceCents,
      isFree: priceCents === 0,
      familyFriendly: family || looksFamilyFriendly(text),
      organizerKind: "ticketed" as OrganizerKind,
      venueOwnership: "unknown" as const,
      brand: typeof venue?.brand === "string" ? venue.brand : undefined,
      isSponsored: false,
    }];
  });
}

export function mapEventbriteEvents(payload: unknown): NormalizedEvent[] {
  const events = (payload as { events?: unknown[] } | null)?.events;
  if (!Array.isArray(events)) return [];
  return events.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const event = entry as Record<string, any>;
    const title = String(event.name?.text ?? event.name ?? "").trim();
    const start = Date.parse(event.start?.utc || event.start?.local || "");
    if (!title || Number.isNaN(start)) return [];
    const venue = event.venue;
    const address = venue?.address;
    const text = `${title} ${event.description?.text ?? event.summary ?? ""}`;
    const priced = priceFromText(text);
    return [{
      externalId: `eventbrite:${event.id ?? stableExternalId("eventbrite", title, new Date(start), event.url)}`,
      title,
      description: typeof event.summary === "string" ? event.summary : typeof event.description?.text === "string" ? event.description.text.slice(0, 500) : undefined,
      start: new Date(start),
      end: event.end?.utc ? new Date(event.end.utc) : null,
      venueName: venue?.name,
      address: address?.localized_address_display || [address?.address_1, address?.city, address?.region].filter(Boolean).join(", "),
      city: address?.city,
      state: address?.region,
      lat: numberOrNull(address?.latitude ?? venue?.latitude),
      lng: numberOrNull(address?.longitude ?? venue?.longitude),
      category: inferCategory(text, "ticketed"),
      source: "eventbrite",
      sourceLabel: "Eventbrite",
      url: typeof event.url === "string" ? event.url : undefined,
      priceCents: event.is_free ? 0 : priced.priceCents,
      isFree: Boolean(event.is_free) || priced.isFree,
      familyFriendly: looksFamilyFriendly(text),
      organizerKind: "ticketed" as OrganizerKind,
      venueOwnership: "unknown" as const,
      isSponsored: false,
    }];
  });
}

function numberOrNull(value: unknown) {
  const number = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(number) ? number : null;
}

export function eventbriteFailure(status: number, body: string): SourceReport | null {
  const denied = status === 401 || status === 403 || status === 404 || status === 410
    || /not.?authorized|no longer available|deprecated|method_not_allowed|INVALID_AUTH/i.test(body);
  if (!denied) return null;
  return {
    id: "eventbrite",
    label: "Eventbrite",
    state: "unavailable",
    detail: "Eventbrite's token is set, but this token cannot run location search. Public event search is restricted on many Eventbrite apps. The adapter stays in place and returns nothing.",
    eventCount: 0,
  };
}

export function placeSortRank(kind: OrganizerKind) {
  return ["library", "museum", "church", "newspaper", "nonprofit", "business", "other", "ticketed"].indexOf(kind);
}

export function ownershipForPlace(place: OsmPlace, overrides: Parameters<typeof classifyVenue>[0]["overrides"]) {
  return classifyVenue({
    name: place.name,
    city: place.city,
    osmId: place.osmId,
    brand: place.brand,
    brandWikidata: place.brandWikidata,
    organizerKind: place.organizerKind,
    overrides,
  });
}

export function skippedSource(id: string, label: string, detail: string): SourceReport {
  return { id, label, state: "skipped", detail, eventCount: 0 };
}

export { redactUrl };

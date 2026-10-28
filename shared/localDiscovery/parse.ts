import {
  decodeEntities,
  inferCategory,
  looksFamilyFriendly,
  priceFromText,
  stableExternalId,
  stripTags,
  type DiscoveryCategory,
  type NormalizedEvent,
  type OrganizerKind,
} from "./model";

export type ParseContext = {
  source: string;
  sourceLabel: string;
  organizerKind: OrganizerKind;
  venueName?: string;
  address?: string;
  city?: string;
  state?: string;
  lat?: number | null;
  lng?: number | null;
  url?: string;
  osmId?: string;
  brand?: string;
  brandWikidata?: string;
};

function finishEvent(partial: {
  title: string;
  description?: string;
  start: Date;
  end?: Date | null;
  venueName?: string;
  address?: string;
  city?: string;
  state?: string;
  lat?: number | null;
  lng?: number | null;
  url?: string;
  externalId?: string;
  category?: DiscoveryCategory;
  isFree?: boolean;
  priceCents?: number | null;
  familyFriendly?: boolean;
}, context: ParseContext): NormalizedEvent {
  const description = partial.description?.trim() || undefined;
  const blob = `${partial.title} ${description ?? ""}`;
  const price = priceFromText(blob);
  const category = partial.category ?? inferCategory(blob, context.organizerKind);
  const start = partial.start;
  return {
    externalId: partial.externalId || stableExternalId(context.source, partial.title, start, partial.url ?? context.url),
    title: partial.title.trim(),
    description,
    start,
    end: partial.end ?? null,
    venueName: partial.venueName || context.venueName,
    address: partial.address || context.address,
    city: partial.city || context.city,
    state: partial.state || context.state,
    lat: partial.lat ?? context.lat ?? null,
    lng: partial.lng ?? context.lng ?? null,
    category,
    source: context.source,
    sourceLabel: context.sourceLabel,
    url: partial.url || context.url,
    priceCents: partial.priceCents ?? price.priceCents,
    isFree: partial.isFree ?? price.isFree,
    familyFriendly: partial.familyFriendly ?? looksFamilyFriendly(blob),
    organizerKind: context.organizerKind,
    venueOwnership: "unknown",
    brand: context.brand,
    brandWikidata: context.brandWikidata,
    osmId: context.osmId,
    isSponsored: false,
  };
}

function unfoldIcs(ics: string) {
  return ics.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\n[ \t]/g, "");
}

function unescapeIcs(value: string) {
  return value.replace(/\\n/gi, "\n").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\").trim();
}

export function parseIcsDate(value: string, params = ""): Date | null {
  const raw = value.trim();
  const dateOnly = raw.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (dateOnly || params.includes("VALUE=DATE")) {
    const match = dateOnly ?? raw.match(/^(\d{4})(\d{2})(\d{2})/);
    if (!match) return null;
    return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 17, 0, 0));
  }
  const timed = raw.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/);
  if (!timed) {
    const parsed = Date.parse(raw);
    return Number.isNaN(parsed) ? null : new Date(parsed);
  }
  const year = Number(timed[1]);
  const month = Number(timed[2]) - 1;
  const day = Number(timed[3]);
  const hour = Number(timed[4]);
  const minute = Number(timed[5]);
  const second = Number(timed[6]);
  if (timed[7] === "Z") return new Date(Date.UTC(year, month, day, hour, minute, second));
  const tzid = /TZID=([^;:]+)/.exec(params)?.[1] ?? "";
  const offset = /Chicago|Winnipeg/.test(tzid) ? -6
    : /New_York|Detroit/.test(tzid) ? -5
      : /Denver/.test(tzid) ? -7
        : /Los_Angeles|Phoenix/.test(tzid) ? -8
          : 0;
  return new Date(Date.UTC(year, month, day, hour - offset, minute, second));
}

function icsProp(block: string, name: string) {
  const match = new RegExp(`(?:^|\\n)${name}([^:\\n]*):(.*)`, "i").exec(block);
  if (!match) return null;
  return { params: match[1] ?? "", value: unescapeIcs(match[2] ?? "") };
}

export function parseIcsFeed(ics: string, context: ParseContext): NormalizedEvent[] {
  const unfolded = unfoldIcs(ics);
  const blocks = unfolded.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/gi) ?? [];
  const events: NormalizedEvent[] = [];
  for (const block of blocks) {
    const summary = icsProp(block, "SUMMARY");
    const start = icsProp(block, "DTSTART");
    if (!summary?.value || !start) continue;
    const startDate = parseIcsDate(start.value, start.params);
    if (!startDate) continue;
    const end = icsProp(block, "DTEND");
    const location = icsProp(block, "LOCATION")?.value;
    const description = icsProp(block, "DESCRIPTION")?.value;
    const url = icsProp(block, "URL")?.value;
    const uid = icsProp(block, "UID")?.value;
    const geo = icsProp(block, "GEO")?.value;
    const [latText, lngText] = geo?.split(/[;,]/) ?? [];
    events.push(finishEvent({
      title: summary.value,
      description: description?.replace(/\n+/g, " "),
      start: startDate,
      end: end ? parseIcsDate(end.value, end.params) : null,
      venueName: location?.split(",")[0]?.trim(),
      address: location,
      url,
      lat: latText ? Number(latText) : undefined,
      lng: lngText ? Number(lngText) : undefined,
      externalId: uid ? `ics:${uid}` : undefined,
    }, context));
  }
  return events;
}

const MONTHS: Record<string, number> = {
  jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3,
  may: 4, jun: 5, june: 5, jul: 6, july: 6, aug: 7, august: 7,
  sep: 8, sept: 8, september: 8, oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11,
};

export function parseLooseDate(text: string, now: Date): Date | null {
  const iso = /(\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2})?(?:Z|[+-]\d{2}:?\d{2})?)?)/.exec(text);
  if (iso) {
    const parsed = new Date(iso[1]);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  const long = /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:,?\s*(\d{4}))?(?:[^0-9]{0,12}(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b)?/i.exec(text);
  if (!long) return null;
  const month = MONTHS[long[1].toLowerCase()];
  const day = Number(long[2]);
  let year = long[3] ? Number(long[3]) : now.getUTCFullYear();
  let hour = long[4] ? Number(long[4]) : 17;
  const minute = long[5] ? Number(long[5]) : 0;
  const meridiem = long[6]?.toLowerCase();
  if (meridiem === "pm" && hour < 12) hour += 12;
  if (meridiem === "am" && hour === 12) hour = 0;
  if (!long[3]) {
    const candidate = new Date(Date.UTC(year, month, day, hour, minute));
    if (candidate.getTime() < now.getTime() - 24 * 60 * 60 * 1000) year += 1;
  }
  const parsed = new Date(Date.UTC(year, month, day, hour, minute));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function tagValue(block: string, names: string[]) {
  for (const name of names) {
    const match = new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i").exec(block);
    if (match) return stripTags(match[1]);
  }
  return "";
}

function attr(tag: string, name: string) {
  return new RegExp(`${name}=["']([^"']+)["']`, "i").exec(tag)?.[1] ?? "";
}

export function parseRssFeed(xml: string, context: ParseContext, now = new Date()): NormalizedEvent[] {
  const blocks = xml.match(/<item\b[\s\S]*?<\/item>|<entry\b[\s\S]*?<\/entry>/gi) ?? [];
  const events: NormalizedEvent[] = [];
  for (const block of blocks) {
    const title = tagValue(block, ["title"]);
    if (!title) continue;
    const description = tagValue(block, ["description", "summary", "content"]);
    const explicit = tagValue(block, ["startDate", "start", "event:startdate", "ical:dtstart", "ev:startdate"]);
    const endText = tagValue(block, ["endDate", "end", "event:enddate"]);
    const linkTag = /<link\b[^>]*>/i.exec(block)?.[0] ?? "";
    const url = attr(linkTag, "href") || tagValue(block, ["link", "guid"]);
    const start = (explicit && parseLooseDate(explicit, now)) || parseLooseDate(`${title} ${description}`, now);
    if (!start || !explicit && !/\b(20\d{2}|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(`${title} ${description}`)) continue;
    const location = tagValue(block, ["location", "event:location", "ical:location"]);
    events.push(finishEvent({
      title,
      description,
      start,
      end: endText ? parseLooseDate(endText, now) : null,
      venueName: location || undefined,
      url: url || undefined,
    }, context));
  }
  return events;
}

const EVENT_TYPES = new Set([
  "Event", "MusicEvent", "SocialEvent", "SportsEvent", "Festival", "EducationEvent",
  "TheaterEvent", "TheatreEvent", "ChildrensEvent", "FoodEvent", "ExhibitionEvent",
  "VisualArtsEvent", "LiteraryEvent", "BusinessEvent", "ComedyEvent", "DanceEvent",
  "ScreeningEvent", "SaleEvent",
]);

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function typeNames(value: unknown) {
  return asArray(value as string | string[]).map((entry) => String(entry).replace(/^schema:/, "").replace(/^https?:\/\/schema\.org\//, ""));
}

function walkNodes(node: unknown, bucket: Record<string, unknown>[]) {
  if (!node) return;
  if (Array.isArray(node)) {
    node.forEach((entry) => walkNodes(entry, bucket));
    return;
  }
  if (typeof node !== "object") return;
  const record = node as Record<string, unknown>;
  bucket.push(record);
  if (record["@graph"]) walkNodes(record["@graph"], bucket);
}

function addressText(location: Record<string, unknown> | undefined) {
  const address = location?.address;
  if (typeof address === "string") return address;
  if (!address || typeof address !== "object") return "";
  const record = address as Record<string, unknown>;
  return [record.streetAddress, record.addressLocality, record.addressRegion, record.postalCode]
    .filter((part) => typeof part === "string" && part)
    .join(", ");
}

export function parseJsonLd(input: string | unknown, context: ParseContext): NormalizedEvent[] {
  const payloads: unknown[] = [];
  if (typeof input === "string") {
    const scripts = input.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) ?? [];
    if (scripts.length === 0 && /^[\s]*[\[{]/.test(input)) payloads.push(safeJson(input));
    for (const script of scripts) {
      const body = script.replace(/^[\s\S]*?>/, "").replace(/<\/script>$/i, "");
      payloads.push(safeJson(body));
    }
  } else {
    payloads.push(input);
  }

  const events: NormalizedEvent[] = [];
  for (const payload of payloads) {
    const nodes: Record<string, unknown>[] = [];
    walkNodes(payload, nodes);
    for (const node of nodes) {
      if (!typeNames(node["@type"]).some((type) => EVENT_TYPES.has(type))) continue;
      const title = stringValue(node.name);
      const start = Date.parse(stringValue(node.startDate));
      if (!title || Number.isNaN(start)) continue;
      const end = Date.parse(stringValue(node.endDate));
      const location = (typeof node.location === "object" && node.location) ? node.location as Record<string, unknown> : undefined;
      const geo = (location?.geo && typeof location.geo === "object") ? location.geo as Record<string, unknown> : undefined;
      const offer = asArray(node.offers as Record<string, unknown> | Record<string, unknown>[])[0];
      const priceRaw = offer ? Number(offer.price ?? offer.lowPrice) : NaN;
      const priceCents = Number.isFinite(priceRaw) ? Math.round(priceRaw * 100) : null;
      const isFree = node.isAccessibleForFree === true || offer?.price === 0 || offer?.price === "0" || priceCents === 0;
      const family = typeNames(node["@type"]).includes("ChildrensEvent") || looksFamilyFriendly(`${title} ${stringValue(node.description)}`);
      events.push(finishEvent({
        title,
        description: stringValue(node.description),
        start: new Date(start),
        end: Number.isNaN(end) ? null : new Date(end),
        venueName: stringValue(location?.name),
        address: addressText(location),
        city: typeof location?.address === "object" ? stringValue((location.address as Record<string, unknown>).addressLocality) : undefined,
        state: typeof location?.address === "object" ? stringValue((location.address as Record<string, unknown>).addressRegion) : undefined,
        lat: numberValue(geo?.latitude),
        lng: numberValue(geo?.longitude),
        url: stringValue(node.url) || context.url,
        priceCents,
        isFree,
        familyFriendly: family,
        externalId: stringValue(node["@id"]) ? `jsonld:${stringValue(node["@id"])}` : undefined,
      }, context));
    }
  }
  return events;
}

function safeJson(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function stringValue(value: unknown) {
  return typeof value === "string" ? decodeEntities(value).trim() : "";
}

function numberValue(value: unknown) {
  const number = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(number) ? number : undefined;
}

const SKIPPED_FEED_HOSTS = ["facebook.com", "fb.com", "instagram.com", "fb.me"];

export function extractFeedLinks(html: string, baseUrl: string) {
  const links: Array<{ url: string; kind: "ics" | "rss" }> = [];
  const tags = html.match(/<(?:a|link)\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    const href = attr(tag, "href");
    if (!href || href.startsWith("mailto:") || href.startsWith("javascript:")) continue;
    let url: URL;
    try {
      url = new URL(href, baseUrl);
    } catch {
      continue;
    }
    if (SKIPPED_FEED_HOSTS.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`))) continue;
    const type = attr(tag, "type").toLowerCase();
    const rel = attr(tag, "rel").toLowerCase();
    const path = `${url.pathname} ${type} ${rel}`.toLowerCase();
    const kind = path.includes(".ics") || path.includes("text/calendar") || href.startsWith("webcal:")
      ? "ics"
      : path.includes("rss") || path.includes("atom") || path.includes("xml") && (rel.includes("alternate") || path.includes("feed"))
        ? "rss"
        : null;
    if (!kind) continue;
    const absolute = href.startsWith("webcal:") ? href.replace(/^webcal:/, "https:") : url.toString();
    if (!links.some((link) => link.url === absolute)) links.push({ url: absolute, kind });
  }
  return links;
}

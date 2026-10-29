/**
 * Local event discovery model.
 *
 * Business policy lives only in `localBusinessPolicy` below. Flip
 * `featureIndependentOnly` or `sponsoredPlacement` here when paid placement
 * starts. Optional env overrides are read in `resolveBusinessPolicy` so
 * operations can change the flag without scattering it through adapters.
 */

export const DISCOVERY_WINDOW_DAYS = 14;
export const DISCOVERY_CACHE_TTL_MS = 8 * 60 * 60 * 1000;
export const DISCOVERY_CACHE_RADIUS_MILES = 25;
export const DEFAULT_RADIUS_MILES = 15;
export const DISCOVERY_USER_AGENT = "JustPutzit/1.0 (local event discovery; +https://justputzit.com)";

export const localBusinessPolicy = {
  /** Feature privately owned independent businesses. Chain businesses stay out. */
  featureIndependentOnly: true,
  /** Paid placement is off until a business pays to be featured. */
  sponsoredPlacement: false,
} as const;

export type LocalBusinessPolicy = {
  featureIndependentOnly: boolean;
  sponsoredPlacement: boolean;
};

export const ORGANIZER_KINDS = [
  "library",
  "museum",
  "newspaper",
  "church",
  "nonprofit",
  "business",
  "ticketed",
  "other",
] as const;

export type OrganizerKind = (typeof ORGANIZER_KINDS)[number];

export const DISCOVERY_CATEGORIES = [
  "music",
  "food",
  "market",
  "sports",
  "arts",
  "community",
  "outdoors",
  "comedy",
  "karaoke",
  "live_music",
  "other",
] as const;

export type DiscoveryCategory = (typeof DISCOVERY_CATEGORIES)[number];

export type MatchType = "date" | "friends" | "gym_buddy";

export type VenueOwnership = "independent" | "chain" | "nonprofit" | "public" | "unknown";

export type NormalizedEvent = {
  externalId: string;
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
  category: DiscoveryCategory;
  source: string;
  sourceLabel: string;
  url?: string;
  priceCents?: number | null;
  isFree: boolean;
  familyFriendly: boolean;
  organizerKind: OrganizerKind;
  venueOwnership: VenueOwnership;
  brand?: string;
  brandWikidata?: string;
  osmId?: string;
  isSponsored?: boolean;
};

export type SourceReport = {
  id: string;
  label: string;
  state: "ok" | "skipped" | "unavailable" | "error";
  detail: string;
  eventCount: number;
};

export type CuratedFeed = {
  id?: number;
  areaKey: string;
  url: string;
  feedKind: "ics" | "rss" | "jsonld" | "html";
  label: string;
  organizerKind: OrganizerKind;
};

export type VenueOverride = {
  id?: number;
  venueKey: string;
  displayName: string;
  city?: string | null;
  classification: "local" | "chain";
  note?: string | null;
};

export type OsmPlace = {
  osmId: string;
  name: string;
  lat: number;
  lng: number;
  website?: string;
  city?: string;
  address?: string;
  organizerKind: OrganizerKind;
  brand?: string;
  brandWikidata?: string;
};

const PUBLIC_KINDS = new Set<OrganizerKind>(["library", "museum", "newspaper", "church", "nonprofit"]);

export function isPublicOrganizer(kind: OrganizerKind) {
  return PUBLIC_KINDS.has(kind);
}

export function resolveBusinessPolicy(override?: Partial<LocalBusinessPolicy>): LocalBusinessPolicy {
  return {
    featureIndependentOnly: readEnvFlag("LOCAL_DISCOVERY_INDEPENDENT_ONLY", localBusinessPolicy.featureIndependentOnly),
    sponsoredPlacement: readEnvFlag("LOCAL_DISCOVERY_SPONSORED_PLACEMENT", localBusinessPolicy.sponsoredPlacement),
    ...override,
  };
}

function readEnvFlag(name: string, fallback: boolean) {
  if (typeof process === "undefined") return fallback;
  const value = process.env[name];
  if (value == null || value.trim() === "") return fallback;
  return !["0", "false", "no", "off"].includes(value.trim().toLowerCase());
}

export function decodeEntities(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)));
}

export function stripTags(value: string) {
  return decodeEntities(value).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function normalizeName(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function venueKey(name: string, city?: string | null) {
  return `${normalizeName(name)}|${(city ?? "").trim().toLowerCase()}`;
}

export function overrideKey(displayName: string, city?: string | null) {
  const trimmed = displayName.trim();
  if (trimmed.toLowerCase().startsWith("osm:")) return trimmed;
  return venueKey(trimmed, city);
}

export function stableExternalId(source: string, title: string, start: Date, url?: string) {
  const base = `${source}|${normalizeName(title)}|${start.toISOString()}|${url ?? ""}`;
  let hash = 0;
  for (let index = 0; index < base.length; index += 1) {
    hash = (Math.imul(hash, 31) + base.charCodeAt(index)) | 0;
  }
  return `${source}:${Math.abs(hash).toString(36)}`;
}

export function looksFamilyFriendly(text: string) {
  return /\b(family|families|kids|children|storytime|story time|all ages|toddler|teen)\b/i.test(text);
}

export function priceFromText(text: string | undefined) {
  if (!text) return { isFree: false, priceCents: null as number | null };
  if (/\bfree\b/i.test(text) && !/\$\s*[1-9]/.test(text)) return { isFree: true, priceCents: 0 };
  const dollars = /\$\s*(\d+(?:\.\d{1,2})?)/.exec(text);
  if (!dollars) return { isFree: false, priceCents: null };
  const priceCents = Math.round(Number(dollars[1]) * 100);
  return { isFree: priceCents === 0, priceCents };
}

const CATEGORY_RULES: Array<{ category: DiscoveryCategory; pattern: RegExp }> = [
  { category: "karaoke", pattern: /\bkaraoke\b/i },
  { category: "comedy", pattern: /\b(comedy|stand-?up|improv)\b/i },
  { category: "live_music", pattern: /\b(live music|concert|band|jazz|symphony|recital)\b/i },
  { category: "music", pattern: /\b(music|choir|open mic)\b/i },
  { category: "food", pattern: /\b(food|dinner|tasting|brunch|cooking|coffee)\b/i },
  { category: "market", pattern: /\b(market|fair|bazaar)\b/i },
  { category: "sports", pattern: /\b(yoga|run|hike|gym|fitness|workout|zumba|swim|climb|sport|basketball|soccer)\b/i },
  { category: "outdoors", pattern: /\b(park|trail|outdoor|nature|garden)\b/i },
  { category: "arts", pattern: /\b(art|exhibit|museum|gallery|theater|theatre|film|craft)\b/i },
];

export function inferCategory(text: string, organizerKind: OrganizerKind): DiscoveryCategory {
  for (const rule of CATEGORY_RULES) {
    if (rule.pattern.test(text)) return rule.category;
  }
  if (organizerKind === "library" || organizerKind === "church" || organizerKind === "nonprofit" || organizerKind === "newspaper") {
    return "community";
  }
  if (organizerKind === "museum") return "arts";
  return "other";
}

export function isWithinDiscoveryWindow(start: Date, end: Date | null | undefined, now: Date) {
  const startMs = start.getTime();
  const endMs = end?.getTime() ?? startMs;
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) return false;
  if (endMs < now.getTime()) return false;
  return startMs <= now.getTime() + DISCOVERY_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}

export function zipAreaKey(postalCode?: string | null) {
  const zip = postalCode?.trim().match(/\d{5}/)?.[0];
  return zip ? `zip:${zip}` : null;
}

export function cityAreaKey(city?: string | null, state?: string | null) {
  const normalizedCity = city?.trim().toLowerCase();
  if (!normalizedCity) return null;
  const normalizedState = state?.trim().toLowerCase();
  return normalizedState ? `city:${normalizedCity}|${normalizedState}` : `city:${normalizedCity}`;
}

export function primaryAreaKey(input: { postalCode?: string | null; city?: string | null; state?: string | null; lat?: number; lng?: number }) {
  return zipAreaKey(input.postalCode) ?? cityAreaKey(input.city, input.state) ?? (
    input.lat != null && input.lng != null ? `geo:${input.lat.toFixed(1)}|${input.lng.toFixed(1)}` : null
  );
}

export function relatedAreaKeys(input: { postalCode?: string | null; city?: string | null; state?: string | null; lat?: number; lng?: number }) {
  const keys = [primaryAreaKey(input), cityAreaKey(input.city, input.state), zipAreaKey(input.postalCode)].filter((key): key is string => Boolean(key));
  return keys.filter((key, index) => keys.indexOf(key) === index);
}

export function organizerKindFromTags(tags: Record<string, string | undefined>): OrganizerKind {
  if (tags.amenity === "library") return "library";
  if (tags.tourism === "museum" || tags.tourism === "gallery") return "museum";
  if (tags.amenity === "place_of_worship") return "church";
  if (tags.office === "newspaper" || tags.amenity === "newspaper") return "newspaper";
  if (
    tags.office === "ngo"
    || tags.office === "association"
    || tags.amenity === "community_centre"
    || tags.amenity === "social_facility"
    || tags.club != null
  ) {
    return "nonprofit";
  }
  return "business";
}

export function redactUrl(url: string) {
  return url.replace(/([?&](?:apikey|token|api_key)=)[^&]+/gi, "$1REDACTED");
}

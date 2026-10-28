import { haversineDistanceMiles } from "../geo";
import { classifyVenue } from "./chains";
import {
  isPublicOrganizer,
  isWithinDiscoveryWindow,
  normalizeName,
  resolveBusinessPolicy,
  type LocalBusinessPolicy,
  type MatchType,
  type NormalizedEvent,
  type VenueOverride,
} from "./model";

const MATCH_CATEGORIES: Record<MatchType, string[]> = {
  date: ["music", "live_music", "food", "arts", "comedy", "karaoke", "community"],
  friends: ["community", "market", "sports", "outdoors", "arts", "food", "music"],
  gym_buddy: ["sports", "outdoors"],
};

export type RankedEvent = NormalizedEvent & {
  distanceMiles: number | null;
  score: number;
};

export function annotateOwnership(event: NormalizedEvent, overrides: readonly VenueOverride[] = []): NormalizedEvent {
  return {
    ...event,
    venueOwnership: classifyVenue({
      name: event.venueName,
      city: event.city,
      osmId: event.osmId,
      brand: event.brand,
      brandWikidata: event.brandWikidata,
      organizerKind: event.organizerKind,
      overrides,
    }),
  };
}

export function allowsDiscoveredEvent(event: NormalizedEvent, policy: LocalBusinessPolicy = resolveBusinessPolicy()) {
  if (event.isSponsored && !policy.sponsoredPlacement) return false;
  if (!policy.featureIndependentOnly || event.venueOwnership !== "chain") return true;
  return isPublicOrganizer(event.organizerKind);
}

export function dedupeEvents(events: NormalizedEvent[]) {
  const kept: NormalizedEvent[] = [];
  for (const event of events) {
    const index = kept.findIndex((existing) => isSameEvent(existing, event));
    if (index === -1) kept.push(event);
    else kept[index] = preferEvent(kept[index], event);
  }
  return kept;
}

function isSameEvent(left: NormalizedEvent, right: NormalizedEvent) {
  if (normalizeName(left.title) !== normalizeName(right.title)) return false;
  if (Math.abs(left.start.getTime() - right.start.getTime()) > 2 * 60 * 60 * 1000) return false;
  if (left.venueName && right.venueName && normalizeName(left.venueName) === normalizeName(right.venueName)) return true;
  if (left.lat != null && right.lat != null && left.lng != null && right.lng != null) {
    return haversineDistanceMiles(left.lat, left.lng, right.lat, right.lng) <= 0.4;
  }
  return Boolean(left.city && right.city && left.city.toLowerCase() === right.city.toLowerCase());
}

function completeness(event: NormalizedEvent) {
  return Number(Boolean(event.url)) + Number(event.lat != null) + Number(Boolean(event.description))
    + Number(event.isFree || event.priceCents != null) + (isPublicOrganizer(event.organizerKind) ? 2 : 0);
}

function preferEvent(left: NormalizedEvent, right: NormalizedEvent) {
  return completeness(right) > completeness(left) ? right : left;
}

export function rankDiscoveredEvents(events: NormalizedEvent[], input: {
  lat?: number;
  lng?: number;
  radiusMiles: number;
  city?: string;
  interests?: string[];
  matchType?: MatchType;
  now?: Date;
  limit?: number;
}): RankedEvent[] {
  const now = input.now ?? new Date();
  const matchType = input.matchType ?? "date";
  const interests = (input.interests ?? []).map((interest) => interest.trim().toLowerCase()).filter((interest) => interest.length >= 3);
  const ranked = events
    .filter((event) => isWithinDiscoveryWindow(event.start, event.end, now))
    .map((event) => {
      const distanceMiles = input.lat != null && input.lng != null && event.lat != null && event.lng != null
        ? haversineDistanceMiles(input.lat, input.lng, event.lat, event.lng)
        : null;
      return { ...event, distanceMiles, score: 0 };
    })
    .filter((event) => {
      if (event.distanceMiles != null) return event.distanceMiles <= input.radiusMiles;
      return Boolean(input.city && event.city && event.city.toLowerCase() === input.city.toLowerCase());
    })
    .map((event) => ({ ...event, score: scoreEvent(event, { ...input, matchType, interests, now }) }));

  return ranked
    .sort((left, right) => right.score - left.score || left.start.getTime() - right.start.getTime())
    .slice(0, input.limit ?? 12);
}

function scoreEvent(event: RankedEvent, input: { radiusMiles: number; matchType: MatchType; interests: string[]; now: Date }) {
  const distanceScore = event.distanceMiles == null
    ? 0.45
    : 1 - Math.min(event.distanceMiles / Math.max(input.radiusMiles, 1), 1);
  const windowMs = 14 * 24 * 60 * 60 * 1000;
  const untilStart = event.start.getTime() - input.now.getTime();
  const timeScore = untilStart <= 0 ? 1 : 1 - Math.min(untilStart / windowMs, 1);
  const haystack = `${event.title} ${event.description ?? ""} ${event.category} ${event.venueName ?? ""}`.toLowerCase();
  const hits = input.interests.filter((interest) => haystack.includes(interest)).length;
  const interestPart = input.interests.length === 0 ? 0.45 : Math.min(1, hits / Math.min(3, input.interests.length));
  const categoryBoost = MATCH_CATEGORIES[input.matchType].includes(event.category) ? 1 : 0.3;
  const gymBoost = input.matchType === "gym_buddy" && /\b(yoga|run|hike|gym|fitness|workout|zumba|cycle|swim|climb)\b/i.test(haystack) ? 1 : categoryBoost;
  const affinity = input.matchType === "gym_buddy" ? gymBoost * 0.7 + interestPart * 0.3 : interestPart * 0.55 + categoryBoost * 0.45;
  return distanceScore * 0.4 + timeScore * 0.25 + affinity * 0.35;
}

export function buildSallyPlanBrief(events: Array<Pick<NormalizedEvent, "title" | "venueName" | "city" | "start" | "isFree" | "priceCents" | "url" | "organizerKind">>, limit = 5) {
  if (events.length === 0) return "";
  const lines = events.slice(0, limit).map((event) => {
    const when = event.start.toISOString();
    const place = event.venueName || "a public spot";
    const where = event.city ? `${place} in ${event.city}` : place;
    const cost = event.isFree ? "free" : event.priceCents != null ? `$${(event.priceCents / 100).toFixed(0)}` : "see the source for price";
    return `- ${event.title} at ${where} on ${when} (${cost}, ${event.organizerKind}). ${event.url ?? "No public URL."}`;
  });
  return [
    "Real upcoming public events near this member. Suggest these when they fit a date, friend meetup, or Gym Buddy workout.",
    "Do not invent venues or times. Prefer independent local spots, libraries, museums, churches, newspapers, and nonprofits.",
    "Do not suggest chain businesses. Paid placement is off.",
    ...lines,
  ].join("\n");
}

export function matchTypeForProfile(profile: {
  networkType?: string | null;
  traits?: {
    lookingFor?: string;
    idealDate?: string;
    favoriteActivities?: string[];
    hobbies?: string[];
    connectionPreferences?: { dating?: boolean; friendship?: boolean };
  } | null;
} | null | undefined): MatchType {
  const traits = profile?.traits;
  const text = `${traits?.lookingFor ?? ""} ${traits?.idealDate ?? ""} ${(traits?.favoriteActivities ?? []).join(" ")} ${(traits?.hobbies ?? []).join(" ")}`.toLowerCase();
  if (/\bgym|workout|fitness|lift/.test(text)) return "gym_buddy";
  if (traits?.connectionPreferences?.dating) return "date";
  if (traits?.connectionPreferences?.friendship || profile?.networkType === "community") return "friends";
  return "date";
}

export function interestsFromTraits(traits: { hobbies?: string[]; favoriteActivities?: string[] } | null | undefined) {
  return [...(traits?.hobbies ?? []), ...(traits?.favoriteActivities ?? [])].filter((interest): interest is string => typeof interest === "string" && interest.trim().length > 0);
}

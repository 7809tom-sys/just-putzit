import { seededCities } from "../../drizzle/schema";
import {
  DEFAULT_RADIUS_MILES,
  DISCOVERY_CACHE_RADIUS_MILES,
  DISCOVERY_CACHE_TTL_MS,
  DISCOVERY_USER_AGENT,
  primaryAreaKey,
  relatedAreaKeys,
  resolveBusinessPolicy,
  type MatchType,
  type SourceReport,
} from "../../shared/localDiscovery/model";
import { discoverLocalEvents, type DiscoveryFetch } from "../../shared/localDiscovery/pipeline";
import { annotateOwnership, allowsDiscoveredEvent, buildSallyPlanBrief, interestsFromTraits, matchTypeForProfile, rankDiscoveredEvents } from "../../shared/localDiscovery/rank";
import { nominatimReverseUrl, nominatimSearchUrl, parseNominatim } from "../../shared/localDiscovery/sources";
import { getDb, getProfileByUserId, listSavedLocations } from "../db";
import { listFeeds, listOverrides, readCachedArea, writeCachedArea, type CachedArea } from "./store";

export type HappeningQuery = {
  userId?: number;
  city?: string;
  state?: string;
  postalCode?: string;
  lat?: number;
  lng?: number;
  radiusMiles?: number;
  matchType?: MatchType;
  interests?: string[];
  limit?: number;
  force?: boolean;
};

export type HappeningDeps = {
  fetch?: DiscoveryFetch;
  now?: Date;
  minHostIntervalMs?: number;
  deadlineMs?: number;
  sleep?: (ms: number) => Promise<void>;
  ticketmasterApiKey?: string | null;
  eventbriteToken?: string | null;
  readCache?: typeof readCachedArea;
  writeCache?: typeof writeCachedArea;
  loadFeeds?: typeof listFeeds;
  loadOverrides?: typeof listOverrides;
};

const refreshing = new Set<string>();

export async function discoveryFetch(url: string, init?: Parameters<DiscoveryFetch>[1]) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), init?.timeoutMs ?? 8000);
  try {
    const response = await fetch(url, {
      method: init?.method ?? "GET",
      headers: {
        "User-Agent": DISCOVERY_USER_AGENT,
        Accept: "text/html,application/json,text/calendar,application/xml,application/rss+xml,*/*",
        ...(init?.headers ?? {}),
      },
      body: init?.body,
      signal: controller.signal,
      redirect: "follow",
    });
    const text = await response.text();
    return { ok: response.ok, status: response.status, text: text.slice(0, 1_500_000) };
  } catch {
    return { ok: false, status: 0, text: "" };
  } finally {
    clearTimeout(timeout);
  }
}

export async function getHappeningNearYou(query: HappeningQuery, deps: HappeningDeps = {}) {
  const now = deps.now ?? new Date();
  const fetchImpl = deps.fetch ?? discoveryFetch;
  const readCache = deps.readCache ?? readCachedArea;
  const writeCache = deps.writeCache ?? writeCachedArea;
  const loadFeeds = deps.loadFeeds ?? listFeeds;
  const loadOverrides = deps.loadOverrides ?? listOverrides;
  const profileLocation = query.userId ? await locationFromUser(query.userId) : {};
  const located = await resolveLocation({
    ...profileLocation,
    ...query,
    city: query.city?.trim() || profileLocation.city,
    state: query.state?.trim() || profileLocation.state,
    postalCode: query.postalCode?.trim() || profileLocation.postalCode,
    lat: finite(query.lat) ?? finite(profileLocation.lat),
    lng: finite(query.lng) ?? finite(profileLocation.lng),
    matchType: query.matchType ?? matchTypeForProfile(profileLocation),
    interests: query.interests?.length ? query.interests : interestsFromTraits(profileLocation.traits),
  }, fetchImpl);
  if (!located) return emptyHappening(query.radiusMiles ?? DEFAULT_RADIUS_MILES);

  const cached = query.force ? null : await readCache(located.areaKey);
  const fresh = cached != null && now.getTime() - cached.fetchedAt.getTime() < DISCOVERY_CACHE_TTL_MS;
  if (cached && fresh) return present(cached, located, query, now, false, await loadOverrides());
  if (cached) {
    queueRefresh(located, deps, fetchImpl, writeCache, loadFeeds, loadOverrides);
    return present(cached, located, query, now, true, await loadOverrides());
  }

  try {
    const area = await refreshArea(located, deps, fetchImpl, writeCache, loadFeeds, loadOverrides);
    return present(area, located, query, now, false, await loadOverrides());
  } catch (error) {
    return {
      ...emptyHappening(query.radiusMiles ?? DEFAULT_RADIUS_MILES),
      areaKey: located.areaKey,
      locationLabel: located.label,
      needsLocation: false,
      sources: [errorReport(error)],
    };
  }
}

export async function loadSallyDiscoveryBrief(userId: number) {
  const saved = await locationFromUser(userId);
  const result = await withTimeout(getHappeningNearYou({
    userId,
    ...saved,
    matchType: matchTypeForProfile(saved),
    interests: interestsFromTraits(saved.traits),
    limit: 5,
  }), 7000, emptyHappening(DEFAULT_RADIUS_MILES));
  const events = result.events.map((event) => ({ ...event, start: new Date(event.start) }));
  return { brief: buildSallyPlanBrief(events), events: result.events };
}

export async function refreshSeededDiscoveryAreas(limit = 8) {
  const db = await getDb();
  if (!db) return { refreshed: 0 };
  const cities = await db.select().from(seededCities).limit(limit);
  let refreshed = 0;
  for (const city of cities) {
    if (city.lat == null || city.lng == null) continue;
    await getHappeningNearYou({
      city: city.city,
      state: city.state,
      lat: city.lat,
      lng: city.lng,
      radiusMiles: DEFAULT_RADIUS_MILES,
    });
    refreshed += 1;
  }
  return { refreshed };
}

async function refreshArea(
  located: Located,
  deps: HappeningDeps,
  fetchImpl: DiscoveryFetch,
  writeCache: typeof writeCachedArea,
  loadFeeds: typeof listFeeds,
  loadOverrides: typeof listOverrides,
) {
  const now = deps.now ?? new Date();
  const [feeds, overrides] = await Promise.all([
    loadFeeds(relatedAreaKeys(located)),
    loadOverrides(),
  ]);
  const discovered = await discoverLocalEvents({
    lat: located.lat,
    lng: located.lng,
    radiusMiles: DISCOVERY_CACHE_RADIUS_MILES,
    city: located.city,
    state: located.state,
    curatedFeeds: feeds,
    overrides,
    ticketmasterApiKey: deps.ticketmasterApiKey,
    eventbriteToken: deps.eventbriteToken,
  }, {
    fetch: fetchImpl,
    now,
    minHostIntervalMs: deps.minHostIntervalMs ?? 1000,
    deadlineMs: deps.deadlineMs ?? 12_000,
    sleep: deps.sleep,
  });
  const area: CachedArea = {
    areaKey: located.areaKey,
    city: located.city,
    state: located.state,
    postalCode: located.postalCode,
    lat: located.lat,
    lng: located.lng,
    radiusMiles: DISCOVERY_CACHE_RADIUS_MILES,
    fetchedAt: now,
    expiresAt: new Date(now.getTime() + DISCOVERY_CACHE_TTL_MS),
    status: "fresh",
    sources: discovered.sources,
    events: discovered.events,
  };
  await writeCache(area);
  return area;
}

function queueRefresh(
  located: Located,
  deps: HappeningDeps,
  fetchImpl: DiscoveryFetch,
  writeCache: typeof writeCachedArea,
  loadFeeds: typeof listFeeds,
  loadOverrides: typeof listOverrides,
) {
  if (refreshing.has(located.areaKey)) return;
  refreshing.add(located.areaKey);
  void refreshArea(located, deps, fetchImpl, writeCache, loadFeeds, loadOverrides)
    .catch((error) => console.warn("[local-discovery] background refresh failed", error))
    .finally(() => refreshing.delete(located.areaKey));
}

function present(
  area: CachedArea,
  located: Located,
  query: HappeningQuery,
  now: Date,
  stale: boolean,
  overrides: Awaited<ReturnType<typeof listOverrides>>,
) {
  const radiusMiles = clampRadius(query.radiusMiles);
  const visible = area.events
    .map((event) => annotateOwnership(event, overrides))
    .filter((event) => allowsDiscoveredEvent(event, resolveBusinessPolicy()));
  const events = rankDiscoveredEvents(visible, {
    lat: located.lat,
    lng: located.lng,
    radiusMiles,
    city: located.city,
    interests: query.interests,
    matchType: query.matchType ?? "date",
    now,
    limit: query.limit ?? 12,
  });
  return {
    areaKey: area.areaKey,
    locationLabel: located.label,
    radiusMiles,
    cached: true,
    stale,
    fetchedAt: area.fetchedAt.toISOString(),
    needsLocation: false,
    events: events.map((event) => ({
      id: event.externalId,
      title: event.title,
      description: event.description,
      start: event.start.toISOString(),
      end: event.end ? event.end.toISOString() : null,
      venueName: event.venueName,
      address: event.address,
      city: event.city,
      state: event.state,
      lat: event.lat ?? null,
      lng: event.lng ?? null,
      category: event.category,
      source: event.source,
      sourceLabel: event.sourceLabel,
      url: event.url,
      priceCents: event.priceCents ?? null,
      isFree: event.isFree,
      familyFriendly: event.familyFriendly,
      organizerKind: event.organizerKind,
      venueOwnership: event.venueOwnership,
      distanceMiles: event.distanceMiles,
    })),
    sources: area.sources,
    policy: resolveBusinessPolicy(),
  };
}

type Located = {
  lat: number;
  lng: number;
  city?: string;
  state?: string;
  postalCode?: string;
  areaKey: string;
  label: string;
  traits?: { hobbies?: string[]; favoriteActivities?: string[]; lookingFor?: string; idealDate?: string; connectionPreferences?: { dating?: boolean; friendship?: boolean } };
  networkType?: string | null;
};

async function resolveLocation(input: HappeningQuery & { traits?: Located["traits"]; networkType?: string | null }, fetchImpl: DiscoveryFetch): Promise<Located | null> {
  let lat = finite(input.lat);
  let lng = finite(input.lng);
  let city = input.city?.trim() || undefined;
  let state = input.state?.trim() || undefined;
  let postalCode = input.postalCode?.trim() || undefined;
  if ((lat == null || lng == null) && (city || postalCode)) {
    const found = await geocode([postalCode, city, state].filter(Boolean).join(", "), fetchImpl);
    if (found) {
      lat = found.lat;
      lng = found.lng;
      city = city || found.city || undefined;
      state = state || found.state || undefined;
      postalCode = postalCode || found.postalCode || undefined;
    }
  }
  if (lat == null || lng == null) return null;
  if (!city) {
    const reverse = await geocodeReverse(lat, lng, fetchImpl);
    if (reverse) {
      city = reverse.city || undefined;
      state = state || reverse.state || undefined;
      postalCode = postalCode || reverse.postalCode || undefined;
    }
  }
  const areaKey = primaryAreaKey({ postalCode, city, state, lat, lng });
  if (!areaKey) return null;
  const label = [city, state].filter(Boolean).join(", ") || postalCode || areaKey;
  return { lat, lng, city, state, postalCode, areaKey, label, traits: input.traits, networkType: input.networkType };
}

async function locationFromUser(userId: number) {
  try {
    const [profile, saved] = await Promise.all([
      getProfileByUserId(userId),
      listSavedLocations(userId),
    ]);
    const home = saved.find((location) => location.isHome) ?? saved[0];
    if (home?.latitude && home.longitude) {
      return {
        city: home.city,
        state: home.state,
        postalCode: home.postalCode ?? undefined,
        lat: Number(home.latitude),
        lng: Number(home.longitude),
        traits: profile?.traits,
        networkType: profile?.networkType,
      };
    }
    return {
      city: profile?.city ?? undefined,
      state: profile?.state ?? undefined,
      lat: profile?.latitude ? Number(profile.latitude) : undefined,
      lng: profile?.longitude ? Number(profile.longitude) : undefined,
      traits: profile?.traits,
      networkType: profile?.networkType,
    };
  } catch {
    return {};
  }
}

async function geocode(query: string, fetchImpl: DiscoveryFetch) {
  const response = await fetchImpl(nominatimSearchUrl(query));
  if (!response.ok) return null;
  try {
    return parseNominatim(JSON.parse(response.text));
  } catch {
    return null;
  }
}

async function geocodeReverse(lat: number, lng: number, fetchImpl: DiscoveryFetch) {
  const response = await fetchImpl(nominatimReverseUrl(lat, lng));
  if (!response.ok) return null;
  try {
    return parseNominatim(JSON.parse(response.text));
  } catch {
    return null;
  }
}

function finite(value: number | undefined) {
  return value != null && Number.isFinite(value) ? value : undefined;
}

function clampRadius(radius: number | undefined) {
  if (radius == null || !Number.isFinite(radius)) return DEFAULT_RADIUS_MILES;
  return Math.min(50, Math.max(1, radius));
}

function emptyHappening(radiusMiles: number) {
  return {
    areaKey: null as string | null,
    locationLabel: "",
    radiusMiles,
    cached: false,
    stale: false,
    fetchedAt: null as string | null,
    needsLocation: true,
    events: [] as ReturnType<typeof present>["events"],
    sources: [] as SourceReport[],
    policy: resolveBusinessPolicy(),
  };
}

function errorReport(error: unknown): SourceReport {
  return {
    id: "local_discovery",
    label: "Local discovery",
    state: "error",
    detail: error instanceof Error ? error.message : "Local discovery did not finish.",
    eventCount: 0,
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T) {
  return new Promise<T>((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    promise.then((value) => {
      clearTimeout(timer);
      resolve(value);
    }, () => {
      clearTimeout(timer);
      resolve(fallback);
    });
  });
}

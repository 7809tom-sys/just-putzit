import { and, eq, inArray } from "drizzle-orm";
import {
  discoveredLocalEvents,
  localDiscoveryAreas,
  localDiscoveryFeeds,
  localVenueOverrides,
} from "../../drizzle/schema";
import type { CuratedFeed, NormalizedEvent, OrganizerKind, SourceReport, VenueOverride } from "../../shared/localDiscovery/model";
import { overrideKey } from "../../shared/localDiscovery/model";
import { getDb } from "../db";

export type CachedArea = {
  areaKey: string;
  city?: string;
  state?: string;
  postalCode?: string;
  lat: number;
  lng: number;
  radiusMiles: number;
  fetchedAt: Date;
  expiresAt: Date;
  status: string;
  errorMessage?: string | null;
  sources: SourceReport[];
  events: NormalizedEvent[];
};

const memoryAreas = new Map<string, CachedArea>();
const memoryFeeds: Array<CuratedFeed & { id: number; enabled: boolean }> = [];
const memoryOverrides: Array<VenueOverride & { id: number }> = [];
let memoryFeedId = 1;
let memoryOverrideId = 1;

export async function readCachedArea(areaKey: string): Promise<CachedArea | null> {
  const db = await getDb();
  if (!db) return memoryAreas.get(areaKey) ?? null;
  try {
    const [area] = await db.select().from(localDiscoveryAreas).where(eq(localDiscoveryAreas.areaKey, areaKey)).limit(1);
    if (!area) return memoryAreas.get(areaKey) ?? null;
    const rows = await db.select().from(discoveredLocalEvents).where(eq(discoveredLocalEvents.areaKey, areaKey));
    return {
      areaKey,
      city: area.city ?? undefined,
      state: area.state ?? undefined,
      postalCode: area.postalCode ?? undefined,
      lat: area.lat ?? 0,
      lng: area.lng ?? 0,
      radiusMiles: area.radiusMiles,
      fetchedAt: area.fetchedAt,
      expiresAt: area.expiresAt,
      status: area.status,
      errorMessage: area.errorMessage,
      sources: (area.sourceSummary ?? []) as SourceReport[],
      events: rows.map(rowToEvent),
    };
  } catch (error) {
    console.warn("[local-discovery] cache read failed; using memory", error);
    return memoryAreas.get(areaKey) ?? null;
  }
}

export async function writeCachedArea(area: CachedArea) {
  memoryAreas.set(area.areaKey, area);
  const db = await getDb();
  if (!db) return;
  try {
    const values = {
      areaKey: area.areaKey,
      city: area.city ?? null,
      state: area.state ?? null,
      postalCode: area.postalCode ?? null,
      lat: area.lat,
      lng: area.lng,
      radiusMiles: area.radiusMiles,
      fetchedAt: area.fetchedAt,
      expiresAt: area.expiresAt,
      status: area.status,
      errorMessage: area.errorMessage ?? null,
      sourceSummary: area.sources,
    };
    const [existing] = await db.select({ id: localDiscoveryAreas.id }).from(localDiscoveryAreas).where(eq(localDiscoveryAreas.areaKey, area.areaKey)).limit(1);
    if (existing) await db.update(localDiscoveryAreas).set(values).where(eq(localDiscoveryAreas.id, existing.id));
    else await db.insert(localDiscoveryAreas).values(values);
    await db.delete(discoveredLocalEvents).where(eq(discoveredLocalEvents.areaKey, area.areaKey));
    const unique = new Map(area.events.map((event) => [event.externalId, event]));
    const rows = Array.from(unique.values()).slice(0, 200).map((event) => ({
      areaKey: area.areaKey,
      externalId: event.externalId.slice(0, 191),
      title: event.title.slice(0, 255),
      description: event.description ?? null,
      startsAt: event.start,
      endsAt: event.end ?? null,
      venueName: event.venueName?.slice(0, 255) ?? null,
      address: event.address ?? null,
      city: event.city?.slice(0, 100) ?? null,
      state: event.state?.slice(0, 32) ?? null,
      lat: event.lat ?? null,
      lng: event.lng ?? null,
      category: event.category,
      sourceAdapter: event.source.slice(0, 40),
      sourceLabel: event.sourceLabel.slice(0, 160),
      url: event.url ?? null,
      priceCents: event.priceCents ?? null,
      isFree: event.isFree,
      familyFriendly: event.familyFriendly,
      organizerKind: event.organizerKind,
      venueOwnership: event.venueOwnership,
      brand: event.brand ?? null,
      brandWikidata: event.brandWikidata ?? null,
      osmId: event.osmId ?? null,
      isSponsored: event.isSponsored ?? false,
    }));
    if (rows.length > 0) await db.insert(discoveredLocalEvents).values(rows);
  } catch (error) {
    console.warn("[local-discovery] cache write failed; memory cache still has this area", error);
  }
}

export async function listFeeds(areaKeys: string[]) {
  const keys = areaKeys.filter(Boolean);
  const fromMemory = memoryFeeds.filter((feed) => feed.enabled && keys.includes(feed.areaKey));
  const db = await getDb();
  if (!db || keys.length === 0) return fromMemory;
  try {
    const rows = await db.select().from(localDiscoveryFeeds).where(and(inArray(localDiscoveryFeeds.areaKey, keys), eq(localDiscoveryFeeds.enabled, true)));
    const stored = rows.map((row) => ({
      id: row.id,
      areaKey: row.areaKey,
      url: row.url,
      feedKind: row.feedKind as CuratedFeed["feedKind"],
      label: row.label,
      organizerKind: row.organizerKind as OrganizerKind,
      enabled: row.enabled,
    }));
    return [...stored, ...fromMemory.filter((feed) => !stored.some((row) => row.url === feed.url && row.areaKey === feed.areaKey))];
  } catch (error) {
    console.warn("[local-discovery] feed read failed", error);
    return fromMemory;
  }
}

export async function addFeed(feed: CuratedFeed) {
  const db = await getDb();
  if (!db) {
    const created = { ...feed, id: memoryFeedId++, enabled: true };
    memoryFeeds.push(created);
    return created;
  }
  await db.insert(localDiscoveryFeeds).values({
    areaKey: feed.areaKey,
    url: feed.url,
    feedKind: feed.feedKind,
    label: feed.label,
    organizerKind: feed.organizerKind,
    enabled: true,
  });
  const [row] = await db.select().from(localDiscoveryFeeds).where(and(eq(localDiscoveryFeeds.areaKey, feed.areaKey), eq(localDiscoveryFeeds.url, feed.url))).limit(1);
  return row;
}

export async function removeFeed(id: number) {
  const db = await getDb();
  if (!db) {
    const index = memoryFeeds.findIndex((feed) => feed.id === id);
    if (index >= 0) memoryFeeds.splice(index, 1);
    return;
  }
  await db.delete(localDiscoveryFeeds).where(eq(localDiscoveryFeeds.id, id));
}

export async function listOverrides() {
  const db = await getDb();
  if (!db) return memoryOverrides;
  try {
    const rows = await db.select().from(localVenueOverrides);
    return rows.map((row) => ({
      id: row.id,
      venueKey: row.venueKey,
      displayName: row.displayName,
      city: row.city,
      classification: row.classification as VenueOverride["classification"],
      note: row.note,
    }));
  } catch (error) {
    console.warn("[local-discovery] override read failed", error);
    return memoryOverrides;
  }
}

export async function setVenueOverride(input: { displayName: string; city?: string | null; classification: "local" | "chain"; note?: string | null }) {
  const venueKey = overrideKey(input.displayName, input.city);
  const db = await getDb();
  if (!db) {
    const existing = memoryOverrides.find((override) => override.venueKey === venueKey);
    if (existing) {
      existing.classification = input.classification;
      existing.note = input.note;
      existing.city = input.city;
      return existing;
    }
    const created = { id: memoryOverrideId++, venueKey, displayName: input.displayName, city: input.city, classification: input.classification, note: input.note };
    memoryOverrides.push(created);
    return created;
  }
  const [existing] = await db.select().from(localVenueOverrides).where(eq(localVenueOverrides.venueKey, venueKey)).limit(1);
  if (existing) {
    await db.update(localVenueOverrides).set({
      displayName: input.displayName,
      city: input.city ?? null,
      classification: input.classification,
      note: input.note ?? null,
    }).where(eq(localVenueOverrides.id, existing.id));
  } else {
    await db.insert(localVenueOverrides).values({
      venueKey,
      displayName: input.displayName,
      city: input.city ?? null,
      classification: input.classification,
      note: input.note ?? null,
    });
  }
  const [row] = await db.select().from(localVenueOverrides).where(eq(localVenueOverrides.venueKey, venueKey)).limit(1);
  return row;
}

export async function removeVenueOverride(id: number) {
  const db = await getDb();
  if (!db) {
    const index = memoryOverrides.findIndex((override) => override.id === id);
    if (index >= 0) memoryOverrides.splice(index, 1);
    return;
  }
  await db.delete(localVenueOverrides).where(eq(localVenueOverrides.id, id));
}

function rowToEvent(row: typeof discoveredLocalEvents.$inferSelect): NormalizedEvent {
  return {
    externalId: row.externalId,
    title: row.title,
    description: row.description ?? undefined,
    start: row.startsAt,
    end: row.endsAt,
    venueName: row.venueName ?? undefined,
    address: row.address ?? undefined,
    city: row.city ?? undefined,
    state: row.state ?? undefined,
    lat: row.lat,
    lng: row.lng,
    category: row.category as NormalizedEvent["category"],
    source: row.sourceAdapter,
    sourceLabel: row.sourceLabel ?? row.sourceAdapter,
    url: row.url ?? undefined,
    priceCents: row.priceCents,
    isFree: row.isFree,
    familyFriendly: row.familyFriendly,
    organizerKind: row.organizerKind as OrganizerKind,
    venueOwnership: row.venueOwnership as NormalizedEvent["venueOwnership"],
    brand: row.brand ?? undefined,
    brandWikidata: row.brandWikidata ?? undefined,
    osmId: row.osmId ?? undefined,
    isSponsored: row.isSponsored,
  };
}

export function clearMemoryDiscoveryCache() {
  memoryAreas.clear();
  memoryFeeds.splice(0, memoryFeeds.length);
  memoryOverrides.splice(0, memoryOverrides.length);
}

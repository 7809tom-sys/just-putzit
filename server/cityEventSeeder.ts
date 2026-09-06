/**
 * cityEventSeeder.ts
 *
 * When a user signs up in a new city, this module:
 *  1. Checks if the city already has events in the DB.
 *  2. Triggers permitted official-source crawling for the requested city.
 *  3. Geocodes the city only to support city-level discovery metadata.
 *  4. Records the refresh attempt in seeded_cities without publishing generated events.
 *
 * Runs fire-and-forget — never blocks the signup flow.
 */

import { getDb } from "./db";
import { communityEvents, seededCities } from "../drizzle/schema";
import { eq, count } from "drizzle-orm";
import { ENV } from "./_core/env";
import { crawlMuseumLibraryEvents } from "./museumLibraryCrawler";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GeneratedEvent {
  title: string;
  description: string;
  category: string;
  eventDate: string;
  endDate?: string | null;
  venueName: string;
  address: string;
  isFree: boolean;
  priceCents: number;
  externalUrl?: string | null;
  source: string;
  isOnCampus?: boolean;
}

const VALID_CATEGORIES = [
  "music", "food", "market", "sports", "arts", "community", "outdoors", "other",
] as const;

const VALID_SOURCES = [
  "community", "eventbrite", "admin", "milwaukee_library", "waukesha_library", "waukesha_county_parks", "brookfield_library",
  "uwm", "marquette", "onmilwaukee", "scraped", "jsonline", "milwaukee_journal",
  "waukesha_freeman", "newspaper", "college", "university", "church",
  "senior_center", "youth_group", "neighborhood", "general",
] as const;

// ─── Geocoding ────────────────────────────────────────────────────────────────

/** Geocode a city to lat/lng using the Nominatim free API */
async function geocodeCity(city: string, state: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const query = encodeURIComponent(`${city}, ${state}, USA`);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
      { headers: { "User-Agent": "JustPutzit-EventBot/1.0 (contact@justputzit.com)" } }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!data.length) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

// ─── DB helpers ───────────────────────────────────────────────────────────────

async function cityHasEvents(city: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return true;
  const rows = await db
    .select({ cnt: count() })
    .from(communityEvents)
    .where(eq(communityEvents.city, city));
  return (rows[0]?.cnt ?? 0) > 0;
}

async function markCitySeeded(
  city: string,
  state: string,
  eventCount: number,
  coords: { lat: number; lng: number } | null
) {
  const db = await getDb();
  if (!db) return;
  try {
    await db
      .insert(seededCities)
      .values({
        city,
        state,
        eventCount,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
      })
      .onDuplicateKeyUpdate({
        set: {
          eventCount,
          lastRefreshedAt: new Date(),
          ...(coords ? { lat: coords.lat, lng: coords.lng } : {}),
        },
      });
  } catch {
    // non-critical
  }
}

// ─── LLM generation ───────────────────────────────────────────────────────────

async function generateEventsForCity(city: string, state: string): Promise<GeneratedEvent[]> {
  const apiUrl = ENV.forgeApiUrl;
  const apiKey = ENV.forgeApiKey;
  if (!apiUrl || !apiKey) return [];

  const today = new Date();
  const twoMonthsOut = new Date(today);
  twoMonthsOut.setMonth(twoMonthsOut.getMonth() + 2);
  const dateRange = `${today.toISOString().slice(0, 10)} to ${twoMonthsOut.toISOString().slice(0, 10)}`;

  const prompt = `Generate 40 realistic community events for ${city}, ${state} between ${dateRange}.

Include events from ALL of these categories (at least 4-6 per category):

1. **Library events** (source: "college" or "general") — story time, book clubs, author talks, tech help, summer reading programs at the local public library
2. **Newspaper-listed events** (source: "newspaper") — farmers markets, art walks, festivals, outdoor concerts, food truck events listed in local news
3. **College/University events** (source: "college" or "university") — campus lectures, sports games, theater productions, alumni events, student fairs — use realistic local college names for ${city}
4. **Church & faith events** (source: "church") — community dinners, holiday celebrations, volunteer drives, youth programs, choir concerts
5. **Senior center events** (source: "senior_center") — fitness classes, card games, day trips, health screenings, social mixers for 55+
6. **Youth & family events** (source: "youth_group") — after-school programs, sports leagues, summer camps, teen nights, family game nights
7. **Neighborhood events** (source: "neighborhood") — block parties, neighborhood watch meetings, park cleanups, community garden workdays, HOA events
8. **General community** (source: "general") — charity runs, blood drives, job fairs, cultural festivals, civic meetings

Return a JSON array. Each event must have exactly these fields:
{
  "title": string (specific, e.g. "Summer Reading Kickoff at ${city} Public Library"),
  "description": string (2-3 sentences, authentic),
  "category": one of ["music","food","market","sports","arts","community","outdoors","other"],
  "eventDate": "YYYY-MM-DDTHH:MM:SS",
  "endDate": "YYYY-MM-DDTHH:MM:SS" or null,
  "venueName": string (realistic local name for ${city}),
  "address": string (realistic street address in ${city}, ${state}),
  "isFree": boolean,
  "priceCents": number (0 if free),
  "externalUrl": null,
  "source": one of the source strings listed above,
  "isOnCampus": boolean (true only for college/university events)
}

Make events feel authentic to ${city}, ${state}. Use real-sounding local names. Spread events across the date range. Return ONLY the JSON array, no other text.`;

  try {
    const res = await fetch(`${apiUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 8000,
        temperature: 0.7,
      }),
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = json.choices?.[0]?.message?.content ?? "";
    const match = content.match(/\[[\s\S]*\]/);
    if (!match) return [];
    return JSON.parse(match[0]) as GeneratedEvent[];
  } catch (err) {
    console.warn(`[cityEventSeeder] LLM generation failed for ${city}:`, err);
    return [];
  }
}

// ─── Insert events ────────────────────────────────────────────────────────────

async function insertGeneratedEvents(
  events: GeneratedEvent[],
  city: string,
  state: string,
  coords: { lat: number; lng: number } | null
): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  let inserted = 0;
  for (const ev of events) {
    try {
      const category = VALID_CATEGORIES.includes(ev.category as typeof VALID_CATEGORIES[number])
        ? (ev.category as typeof VALID_CATEGORIES[number])
        : "other";
      const source = VALID_SOURCES.includes(ev.source as typeof VALID_SOURCES[number])
        ? (ev.source as typeof VALID_SOURCES[number])
        : "general";
      const eventDate = new Date(ev.eventDate);
      if (isNaN(eventDate.getTime())) continue;
      await db.insert(communityEvents).values({
        title: ev.title.slice(0, 255),
        description: ev.description,
        category,
        eventDate,
        endDate: ev.endDate ? new Date(ev.endDate) : undefined,
        venueName: ev.venueName?.slice(0, 255),
        address: ev.address,
        city,
        state,
        isFree: ev.isFree,
        priceCents: ev.priceCents ?? 0,
        externalUrl: ev.externalUrl ?? null,
        source,
        isOnCampus: ev.isOnCampus ?? false,
        isActive: true,
        rsvpCount: 0,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
      });
      inserted++;
    } catch {
      // skip duplicates or bad rows
    }
  }
  return inserted;
}

// ─── Main entry point ─────────────────────────────────────────────────────────

/**
 * Call fire-and-forget when a user sets their city.
 * Silently skips if the city already has events.
 */
export async function autoSeedCityEvents(city: string, state = "WI"): Promise<void> {
  if (!city || city.trim().length < 2) return;
  const normalizedCity = city.trim();

  try {
    console.log(`[cityEventSeeder] Refreshing permitted sources for ${normalizedCity}, ${state}`);
    const [coords] = await Promise.all([
      geocodeCity(normalizedCity, state),
      crawlMuseumLibraryEvents(normalizedCity).catch(() => {}),
    ]);

    if (coords) {
      console.log(`[cityEventSeeder] Geocoded ${normalizedCity}: ${coords.lat}, ${coords.lng}`);
    }

    await markCitySeeded(normalizedCity, state, 0, coords);
    console.log(`[cityEventSeeder] Completed permitted-source refresh for ${normalizedCity}; no generated events were published.`);
  } catch (err) {
    console.error(`[cityEventSeeder] Failed to refresh permitted sources for ${normalizedCity}:`, err);
  }
}

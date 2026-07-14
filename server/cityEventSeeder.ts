/**
 * cityEventSeeder.ts
 *
 * When a user signs up in a new city (one we haven't seeded yet), this module:
 *  1. Checks if the city already has events in the DB.
 *  2. If not, uses the built-in LLM to generate a realistic set of community
 *     events for that city (libraries, newspapers, community centres, parks, etc.)
 *  3. Upserts those events into community_events and records the city in seeded_cities.
 *
 * This runs asynchronously (fire-and-forget) so it never blocks the signup flow.
 */

import { getDb } from "./db";
import { communityEvents, seededCities } from "../drizzle/schema";
import { eq, and, count } from "drizzle-orm";
import { ENV } from "./_core/env";

interface GeneratedEvent {
  title: string;
  description: string;
  category: string;
  eventDate: string; // ISO date string
  endDate?: string;
  venueName: string;
  address: string;
  isFree: boolean;
  priceCents: number;
  externalUrl?: string;
  source: string;
}

/** Returns true if this city already has events in the DB */
async function cityHasEvents(city: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return true; // fail-safe: don't seed if DB unavailable
  const rows = await db
    .select({ cnt: count() })
    .from(communityEvents)
    .where(eq(communityEvents.city, city));
  return (rows[0]?.cnt ?? 0) > 0;
}

/** Mark a city as seeded in the seeded_cities table */
async function markCitySeeded(city: string, state: string, eventCount: number) {
  const db = await getDb();
  if (!db) return;
  try {
    await db
      .insert(seededCities)
      .values({ city, state, eventCount })
      .onDuplicateKeyUpdate({ set: { eventCount, lastRefreshedAt: new Date() } });
  } catch {
    // non-critical
  }
}

/** Use the built-in LLM to generate realistic community events for a city */
async function generateEventsForCity(city: string, state: string): Promise<GeneratedEvent[]> {
  const apiUrl = ENV.forgeApiUrl;
  const apiKey = ENV.forgeApiKey;
  if (!apiUrl || !apiKey) return [];

  const today = new Date();
  const nextMonth = new Date(today);
  nextMonth.setMonth(nextMonth.getMonth() + 2);
  const dateRange = `${today.toISOString().slice(0, 10)} to ${nextMonth.toISOString().slice(0, 10)}`;

  const prompt = `Generate 15 realistic community events for ${city}, ${state} happening between ${dateRange}.
Include a mix of:
- Public library events (story time, author talks, book clubs, computer classes)
- Local newspaper-listed events (farmers markets, art walks, festivals, concerts)
- Community center events (fitness classes, senior programs, youth activities)
- Parks & recreation (outdoor movies, nature walks, sports leagues)
- Free or low-cost cultural events

Return a JSON array of events. Each event must have:
{
  "title": string (specific and realistic, e.g. "Summer Reading Kickoff at ${city} Public Library"),
  "description": string (2-3 sentences),
  "category": one of ["music","food","market","sports","arts","community","outdoors","other"],
  "eventDate": ISO date string (YYYY-MM-DDTHH:MM:SS),
  "endDate": ISO date string or null,
  "venueName": string (realistic local venue name),
  "address": string (realistic street address in ${city}, ${state}),
  "isFree": boolean,
  "priceCents": number (0 if free, otherwise cost in cents),
  "externalUrl": string or null,
  "source": one of ["milwaukee_library","waukesha_library","jsonline","newspaper","community","admin"]
}

Make the events feel authentic to ${city}, ${state}. Use real-sounding local venue names. Return ONLY the JSON array, no other text.`;

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
        max_tokens: 4000,
        temperature: 0.7,
      }),
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = json.choices?.[0]?.message?.content ?? "";
    // Extract JSON array from response
    const match = content.match(/\[[\s\S]*\]/);
    if (!match) return [];
    return JSON.parse(match[0]) as GeneratedEvent[];
  } catch (err) {
    console.warn(`[cityEventSeeder] LLM generation failed for ${city}:`, err);
    return [];
  }
}

const VALID_CATEGORIES = ["music", "food", "market", "sports", "arts", "community", "outdoors", "other"] as const;
const VALID_SOURCES = ["community", "eventbrite", "admin", "milwaukee_library", "waukesha_library", "uwm", "marquette", "onmilwaukee", "scraped", "jsonline", "milwaukee_journal", "waukesha_freeman", "newspaper"] as const;

/** Insert generated events into the community_events table */
async function insertGeneratedEvents(events: GeneratedEvent[], city: string, state: string): Promise<number> {
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
        : "admin";
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
        isActive: true,
        rsvpCount: 0,
      });
      inserted++;
    } catch {
      // skip duplicates or bad rows
    }
  }
  return inserted;
}

/**
 * Main entry point — call this fire-and-forget when a user sets their city.
 * It will silently skip if the city already has events.
 */
export async function autoSeedCityEvents(city: string, state = "WI"): Promise<void> {
  if (!city || city.trim().length < 2) return;
  const normalizedCity = city.trim();

  try {
    const alreadyHasEvents = await cityHasEvents(normalizedCity);
    if (alreadyHasEvents) {
      console.log(`[cityEventSeeder] ${normalizedCity} already has events — skipping seed`);
      return;
    }

    console.log(`[cityEventSeeder] New city detected: ${normalizedCity}, ${state} — generating events...`);
    const events = await generateEventsForCity(normalizedCity, state);
    if (events.length === 0) {
      console.warn(`[cityEventSeeder] No events generated for ${normalizedCity}`);
      return;
    }

    const inserted = await insertGeneratedEvents(events, normalizedCity, state);
    await markCitySeeded(normalizedCity, state, inserted);
    console.log(`[cityEventSeeder] Seeded ${inserted} events for ${normalizedCity}, ${state}`);
  } catch (err) {
    console.error(`[cityEventSeeder] Failed to seed ${normalizedCity}:`, err);
  }
}

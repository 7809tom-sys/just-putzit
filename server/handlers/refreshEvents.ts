/**
 * refreshEvents.ts
 *
 * Heartbeat handler: POST /api/scheduled/refresh-events
 *
 * Runs on a schedule (e.g. every 6 hours) to keep the community event feed fresh:
 *  1. Crawl all supported cities' real-data sources (Chicago Public Library,
 *     Art Institute of Chicago, Milwaukee Public Library).
 *  2. Purge community_events rows whose eventDate is more than 3 days in the past.
 *  3. Re-seed any city in seeded_cities that has fewer than 10 upcoming events.
 *
 * Auth: authenticated via sdk.authenticateRequest — isCron must be true.
 */

import type { Request, Response } from "express";
import { sdk } from "../_core/sdk";
import { getDb } from "../db";
import { communityEvents, seededCities } from "../../drizzle/schema";
import { lt, gte, eq, count } from "drizzle-orm";
import { crawlAllCities } from "../museumLibraryCrawler";
import { autoSeedCityEvents } from "../cityEventSeeder";

export async function refreshEventsHandler(req: Request, res: Response) {
  try {
    // Authenticate — only cron callers allowed
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron) {
      return res.status(403).json({ error: "cron-only endpoint" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "DB unavailable" });
    }

    const startTime = Date.now();
    const results: Record<string, unknown> = {};

    // ── Step 1: Crawl all real-data sources ──────────────────────────────────
    console.log("[refreshEvents] Starting real-data crawl for all cities...");
    await crawlAllCities();
    results.crawlComplete = true;
    console.log("[refreshEvents] Crawl complete.");

    // ── Step 2: Purge past events (older than 3 days) ─────────────────────────
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 3);

    const deleteResult = await db
      .delete(communityEvents)
      .where(lt(communityEvents.eventDate, cutoff));

    results.purgedEvents = (deleteResult as any).affectedRows ?? "unknown";
    console.log(`[refreshEvents] Purged ${results.purgedEvents} past events (before ${cutoff.toISOString()})`);

    // ── Step 3: Re-seed thin cities ───────────────────────────────────────────
    const seeded = await db.select().from(seededCities);
    const now = new Date();
    const reseeded: string[] = [];

    for (const cityRow of seeded) {
      // Count upcoming events for this city
      const [{ cnt }] = await db
        .select({ cnt: count() })
        .from(communityEvents)
        .where(
          // upcoming events only
          gte(communityEvents.eventDate, now)
        );

      // If fewer than 10 upcoming events, re-seed
      if ((cnt ?? 0) < 10) {
        console.log(`[refreshEvents] City ${cityRow.city} has only ${cnt} upcoming events — re-seeding...`);
        autoSeedCityEvents(cityRow.city, cityRow.state ?? "WI").catch(() => {});
        reseeded.push(cityRow.city);
      }
    }

    results.reseededCities = reseeded;
    results.durationMs = Date.now() - startTime;

    console.log(`[refreshEvents] Done in ${results.durationMs}ms`, results);
    return res.json({ ok: true, ...results });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error("[refreshEvents] Handler error:", err);
    return res.status(500).json({
      error: message,
      stack,
      context: { url: req.url },
      timestamp: new Date().toISOString(),
    });
  }
}

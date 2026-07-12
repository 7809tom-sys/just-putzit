/**
 * scheduledScrape.ts
 * Express handler for POST /api/scheduled/scrape-events
 * Triggered nightly by the Manus Heartbeat cron job.
 * Scrapes Milwaukee/Waukesha community event sources and upserts into DB.
 */

import type { Request, Response } from "express";
import { sdk } from "./_core/sdk";
import { scrapeAllMilwaukeeEvents } from "./communityScraper";
import { upsertScrapedEvents } from "./db";

export async function scrapeEventsHandler(req: Request, res: Response) {
  try {
    // Authenticate — only cron callers allowed
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron) {
      return res.status(403).json({ error: "cron-only endpoint" });
    }

    console.log(`[scheduledScrape] Starting nightly community event scrape (taskUid: ${user.taskUid})`);

    const events = await scrapeAllMilwaukeeEvents();
    console.log(`[scheduledScrape] Scraped ${events.length} total events`);

    const inserted = await upsertScrapedEvents(events);
    console.log(`[scheduledScrape] Inserted ${inserted} new events`);

    return res.json({
      ok: true,
      scraped: events.length,
      inserted,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[scheduledScrape] Error:", err);
    return res.status(500).json({
      error: err.message,
      stack: err.stack,
      context: { url: req.url, taskUid: "unknown" },
      timestamp: new Date().toISOString(),
    });
  }
}

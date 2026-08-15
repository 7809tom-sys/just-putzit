import type { Request, Response } from "express";
import { sdk } from "./_core/sdk";
import { createBirthdayMatchNotifications } from "./db";

/**
 * Heartbeat endpoint for a once-daily, private birthday reminder pass. It never
 * exposes a full birth date and relies on durable delivery records for retries.
 */
export async function birthdayRemindersHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron) {
      return res.status(403).json({ error: "cron-only endpoint" });
    }

    const result = await createBirthdayMatchNotifications();
    return res.json({ ok: true, ...result, timestamp: new Date().toISOString() });
  } catch (error: any) {
    console.error("[scheduledBirthdayReminders] Error:", error);
    return res.status(500).json({
      error: error.message,
      stack: error.stack,
      context: { url: req.url, taskUid: "unknown" },
      timestamp: new Date().toISOString(),
    });
  }
}

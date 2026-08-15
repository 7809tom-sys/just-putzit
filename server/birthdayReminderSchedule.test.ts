import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("birthday reminder schedule route", () => {
  it("registers a cron-only scheduled endpoint and does not expose member birth dates", () => {
    const root = resolve(__dirname, "..");
    const handler = readFileSync(resolve(root, "server/scheduledBirthdayReminders.ts"), "utf8");
    const server = readFileSync(resolve(root, "server/_core/index.ts"), "utf8");

    expect(handler).toContain("if (!user.isCron)");
    expect(handler).toContain("createBirthdayMatchNotifications()");
    expect(server).toContain('app.post("/api/scheduled/birthday-reminders", birthdayRemindersHandler)');
    expect(handler).not.toContain("birthDate");
  });
});

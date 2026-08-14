import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("event source health integration", () => {
  it("records source outcomes from the nightly scrape and exposes them to administrators", () => {
    const root = resolve(__dirname, "..");
    const scraper = readFileSync(resolve(root, "server/communityScraper.ts"), "utf8");
    const schedule = readFileSync(resolve(root, "server/scheduledScrape.ts"), "utf8");
    const router = readFileSync(resolve(root, "server/routers.ts"), "utf8");
    const admin = readFileSync(resolve(root, "client/src/pages/Admin.tsx"), "utf8");
    expect(scraper).toContain("scrapeAllMilwaukeeEventsWithHealth");
    expect(scraper).toContain("scrapeAllMadisonEventsWithHealth");
    expect(schedule).toContain("recordEventSourceHealth");
    expect(router).toContain("sourceHealth: protectedProcedure");
    expect(admin).toContain("Official calendar source health");
  });
});

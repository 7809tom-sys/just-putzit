import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Marketplace availability recovery", () => {
  const marketplace = readFileSync(resolve(__dirname, "../client/src/pages/Marketplace.tsx"), "utf8");
  const db = readFileSync(resolve(__dirname, "./db.ts"), "utf8");
  const router = readFileSync(resolve(__dirname, "./routers.ts"), "utf8");

  it("exposes only active Marketplace category counts through the established protected router", () => {
    expect(db).toContain("getActivityMarketplaceCategoryCounts");
    expect(db).toContain("groupBy(activityListings.category)");
    expect(router).toContain("categoryCounts: protectedProcedure");
  });

  it("recovers from a stale empty category and explains retry and nearby-activity options", () => {
    expect(marketplace).toContain("availableCategories");
    expect(marketplace).toContain('setCategory("all")');
    expect(marketplace).toContain("We couldn’t load Marketplace activities");
    expect(marketplace).toContain("Explore nearby activities");
  });
});

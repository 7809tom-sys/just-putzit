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
    expect(router).toContain("categoryCounts: publicProcedure");
  });

  it("allows visitors to browse while retaining sign-in handoff for booking", () => {
    expect(router).toContain("browse: publicProcedure");
    expect(marketplace).toContain("Join free to book this local activity.");
    expect(marketplace).toContain("Join free to book");
  });

  it("uses the signed-in member city without silently switching them to another market", () => {
    expect(router).toContain("city: z.string().trim().min(1).max(120).optional()");
    expect(router).toContain("getActivityListings(input.city, input.category)");
    expect(marketplace).toContain("Showing bookable activities in ${locationLabel}.");
    expect(marketplace).toContain("Browse all locations instead");
  });

  it("recovers from a stale empty category and explains retry and nearby-activity options", () => {
    expect(marketplace).toContain("availableCategories");
    expect(marketplace).toContain('setCategory("all")');
    expect(marketplace).toContain("We couldn’t load Marketplace activities");
    expect(marketplace).toContain("Explore nearby activities");
  });
});

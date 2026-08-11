import { describe, expect, it } from "vitest";
import { buildPublicVenueSearchPlan, getCuratedPublicSeedsForCity, normalizeDiscoveryCity, PUBLIC_ACTIVITY_CATEGORIES } from "./publicVenueDiscovery";

describe("public venue discovery", () => {
  it("covers every requested public recreation category", () => {
    expect(PUBLIC_ACTIVITY_CATEGORIES).toEqual(expect.arrayContaining([
      "swimming_pool", "beach", "dirt_track", "basketball", "ymca", "public_gym",
      "golf", "disc_golf", "volleyball", "tennis",
    ]));
  });

  it("keeps Waukesha curated public recreation venues separate from Milwaukee", () => {
    const waukesha = getCuratedPublicSeedsForCity("Waukesha, WI");
    const milwaukee = getCuratedPublicSeedsForCity("Milwaukee, WI");

    expect(waukesha.length).toBeGreaterThanOrEqual(4);
    expect(waukesha.some((seed) => seed.venueName === "Buchner Park Community Pool")).toBe(true);
    expect(waukesha.some((seed) => seed.venueName === "Minooka Park Beach")).toBe(true);
    expect(waukesha.every((seed) => seed.city === "Waukesha" && seed.state === "WI")).toBe(true);
    expect(milwaukee.some((seed) => seed.venueName === "Buchner Park Community Pool")).toBe(false);
  });

  it("builds a city-specific search plan for any US city", () => {
    const plan = buildPublicVenueSearchPlan("Oklahoma City", "OK");
    expect(plan).toHaveLength(PUBLIC_ACTIVITY_CATEGORIES.length);
    expect(plan.find((item) => item.category === "golf")?.query).toContain("Oklahoma City, OK");
  });

  it("removes a state suffix from a saved city label", () => {
    expect(normalizeDiscoveryCity("Madison, WI")).toBe("Madison");
  });
});

import { describe, expect, it } from "vitest";
import { buildPublicVenueSearchPlan, normalizeDiscoveryCity, PUBLIC_ACTIVITY_CATEGORIES } from "./publicVenueDiscovery";

describe("public venue discovery", () => {
  it("covers every requested public recreation category", () => {
    expect(PUBLIC_ACTIVITY_CATEGORIES).toEqual(expect.arrayContaining([
      "swimming_pool", "beach", "dirt_track", "basketball", "ymca", "public_gym",
      "golf", "disc_golf", "volleyball", "tennis",
    ]));
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

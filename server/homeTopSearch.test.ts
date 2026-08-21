import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Home top community search", () => {
  it("places the existing location search before the welcome header and nearby discovery", () => {
    const source = readFileSync(resolve(__dirname, "../client/src/pages/Home.tsx"), "utf8");
    const topSearch = source.indexOf('aria-label="Search your community"');
    const welcomeHeader = source.indexOf("{/* Welcome header */}");
    const nearbyDiscovery = source.indexOf("<NearbyNowModule navigate={navigate} />");

    expect(topSearch).toBeGreaterThan(-1);
    expect(topSearch).toBeLessThan(welcomeHeader);
    expect(welcomeHeader).toBeLessThan(nearbyDiscovery);
    expect(source).toContain("Find your community");
  });
});

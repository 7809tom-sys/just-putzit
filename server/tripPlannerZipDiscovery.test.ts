import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Trip Planner ZIP discovery and booking handoff", () => {
  const pageSource = readFileSync(resolve(__dirname, "../client/src/pages/TripPlanner.tsx"), "utf8");
  const searchSource = readFileSync(resolve(__dirname, "../client/src/components/TripPlannerActivitySearch.tsx"), "utf8");

  it("resolves a member-entered ZIP code before searching current nearby events", () => {
    expect(searchSource).toContain("trpc.location.resolve.useQuery");
    expect(searchSource).toContain("trpc.events.list.useQuery");
    expect(searchSource).toContain("radiusMiles: 30");
    expect(searchSource).toContain("/^\\d{5}(?:-\\d{4})?$/");
    expect(searchSource).toContain("Enter a valid 5-digit ZIP code.");
  });

  it("preserves an official event link when adding a current event to an itinerary", () => {
    expect(pageSource).toContain("url: event.externalUrl || undefined");
    expect(searchSource).toContain("Official details / book");
    expect(searchSource).toContain("Add to itinerary");
    expect(pageSource).toContain("target=\"_blank\"");
  });

  it("explains the ZIP-search path before a member has created their first trip", () => {
    expect(pageSource).toContain("enter a ZIP code to find current nearby activities");
    expect(pageSource).toContain("Create a trip");
  });
});

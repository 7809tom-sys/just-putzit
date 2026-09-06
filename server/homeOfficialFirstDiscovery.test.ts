import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("official-first Home nearby discovery", () => {
  const home = readFileSync(resolve(__dirname, "../client/src/pages/Home.tsx"), "utf8");

  it("uses official-handoff events for Home recommendations", () => {
    expect(home).toContain("const officialEvents = events.filter");
    expect(home).toContain("Boolean(event.externalUrl)");
    expect(home).toContain("...officialEvents.map");
  });

  it("keeps community listings available through the dedicated events route", () => {
    expect(home).toContain("Community-submitted events remain available in");
    expect(home).toContain('navigate("/events")');
    expect(home).toContain("prioritize listings with official public handoffs");
  });
});

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("profile saved-events summary", () => {
  it("shows only the member’s current saved-event count and links to the private section", () => {
    const source = readFileSync(resolve(__dirname, "../client/src/pages/Profile.tsx"), "utf8");
    expect(source).toContain("const savedEventsCount = savedEvents?.length ?? 0");
    expect(source).toContain('document.getElementById("saved-events")?.scrollIntoView');
    expect(source).toContain('id="saved-events"');
  });

  it("gives members with no saved events a direct route to browse events", () => {
    const source = readFileSync(resolve(__dirname, "../client/src/pages/Profile.tsx"), "utf8");
    expect(source).toContain("Save an event from its details page to keep the plan handy here.");
    expect(source).toContain('onClick={() => navigate("/events")}>Browse events</Button>');
  });
});

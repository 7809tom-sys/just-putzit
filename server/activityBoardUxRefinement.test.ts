import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Activity Board UX refinement", () => {
  const board = readFileSync(resolve(__dirname, "../client/src/pages/ActivityBoard.tsx"), "utf8");
  const location = readFileSync(resolve(__dirname, "../client/src/components/LocationOverrideControl.tsx"), "utf8");

  it("keeps saved-location naming behind an explicit bookmark action", () => {
    expect(location).toContain("Bookmark this location");
    expect(location).toContain("showSaveLocation");
  });

  it("offers compact filters, consistent counts, sorting, and card-level event actions", () => {
    expect(board).toContain("More filters");
    expect(board).toContain('aria-label="Sort community events"');
    expect(board).toContain("current event");
    expect(board).toContain("Save ${event.title} for later");
    expect(board).toContain("<Share2");
    expect(board).toContain("More info");
  });

  it("places the partner promotion naturally within the community feed", () => {
    expect(board).toContain('key="native-sponsor-cta"');
    expect(board).toContain("index !== 1");
  });

  it("offers a filtered, selectable Community Events calendar view", () => {
    expect(board).toContain("CalendarWidget");
    expect(board).toContain('aria-label="Community Events calendar"');
    expect(board).toContain("selectedCommunityEvents");
    expect(board).toContain("Show all current events");
  });
});

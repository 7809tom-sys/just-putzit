import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("activity detail add-to-trip handoff", () => {
  const root = resolve(__dirname, "..");
  const detail = readFileSync(resolve(root, "client/src/pages/EventDetail.tsx"), "utf8");
  const planner = readFileSync(resolve(root, "client/src/pages/TripPlanner.tsx"), "utf8");

  it("keeps the public join flow while giving signed-in members a review-first Trip Planner handoff", () => {
    expect(detail).toContain("{viewer ? (");
    expect(detail).toContain("Add to a trip");
    expect(detail).toContain("/trip-planner?");
    expect(detail).toContain("Join Free & RSVP");
  });

  it("does not save an activity automatically and requires a selected trip before opening the item editor", () => {
    expect(planner).toContain("const [pendingActivity, setPendingActivity]");
    expect(planner).toContain("Choose a trip to review and add");
    expect(planner).toContain("setIsAddItemOpen(true)");
    expect(planner).toContain("onClick={() => selectTrip(trip)}");
  });
});

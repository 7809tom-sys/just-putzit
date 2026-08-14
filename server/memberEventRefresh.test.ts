import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("member event refresh", () => {
  it("refreshes both community and Eventbrite listing queries with clear feedback", () => {
    const page = readFileSync(resolve(__dirname, "../client/src/pages/Events.tsx"), "utf8");
    expect(page).toContain("refetchEventbrite");
    expect(page).toContain("Promise.all([refetch(), refetchEventbrite()])");
    expect(page).toContain("Event list refreshed with the latest saved listings.");
    expect(page).toContain("Refresh list");
  });
});

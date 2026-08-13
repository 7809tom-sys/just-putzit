import { describe, expect, it } from "vitest";
import { isMoreHeaderRoute, moreHeaderNavigation, primaryHeaderNavigation } from "../client/src/lib/headerNavigation";

describe("responsive header navigation", () => {
  it("keeps core links visible while routing secondary destinations through More", () => {
    expect(primaryHeaderNavigation.map((item) => item.label)).toEqual(["Matches", "Marketplace", "Activities", "Community"]);
    expect(moreHeaderNavigation).toHaveLength(7);
    expect(moreHeaderNavigation.some((item) => item.href === "/vendor" && item.label === "For Businesses")).toBe(true);
    expect(isMoreHeaderRoute("/gym-buddy/today")).toBe(true);
    expect(isMoreHeaderRoute("/marketplace")).toBe(false);
  });
});

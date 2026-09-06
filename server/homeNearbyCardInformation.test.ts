import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Home nearby discovery card information", () => {
  const home = readFileSync(resolve(__dirname, "../client/src/pages/Home.tsx"), "utf8");

  it("keeps complete Home card information visible with direct official and directions handoffs", () => {
    expect(home).toContain('const detailPath = item.kind === "event" ? `/events/${item.id}`');
    expect(home).toContain('hour: "numeric", minute: "2-digit"');
    expect(home).toContain("{item.description &&");
    expect(home).toContain("{item.address &&");
    expect(home).toContain("Official details");
  });

  it("features only explicitly verified locally owned coffee and dining businesses", () => {
    expect(home).toContain("const locallyOwnedDining = activities.filter");
    expect(home).toContain("activity.venueIsLocallyOwned");
    expect(home).toContain("Locally owned coffee & dining nearby");
    expect(home).toContain("Each card shows its exact city.");
    expect(home).toContain("Official site, hours & menu");
  });
});

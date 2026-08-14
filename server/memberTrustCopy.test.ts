import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("member trust copy", () => {
  it("does not promise universal verification or GPS verification for every member", () => {
    const root = resolve(__dirname, "..");
    const source = readFileSync(resolve(root, "client/src/components/LocalVenueBanner.tsx"), "utf8");
    expect(source).not.toContain("100% Local & Verified");
    expect(source).not.toContain("Every member is GPS-verified");
    expect(source).toContain("Optional account and location verification tools");
  });

  it("does not label public landing-page profiles or sample cards as verified", () => {
    const root = resolve(__dirname, "..");
    const homeSource = readFileSync(resolve(root, "client/src/pages/Home.tsx"), "utf8");
    const citySource = readFileSync(resolve(root, "client/src/pages/CityLanding.tsx"), "utf8");
    expect(homeSource).not.toContain("Verified Profiles");
    expect(citySource).not.toContain("Verified Profiles");
    expect(homeSource).not.toContain("98% Match!");
    expect(homeSource).toContain("Safety & Trust");
  });
});

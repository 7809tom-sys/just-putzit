import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("authenticated landing actions", () => {
  it("waits for profile resolution instead of flashing public CTAs to an authenticated member", () => {
    const source = readFileSync(resolve(__dirname, "../client/src/pages/Home.tsx"), "utf8");
    expect(source).toContain("isAuthenticated && profile === undefined");
    expect(source).toContain("Preparing your home…");
  });

  it("hides sign in and routes authenticated incomplete members to continue setup", () => {
    const source = readFileSync(resolve(__dirname, "../client/src/pages/Home.tsx"), "utf8");
    expect(source).toContain("!isAuthenticated && <Button variant=\"ghost\"");
    expect(source).toContain('label: "Continue setup", destination: "/onboarding"');
  });
});

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Profile referral entry", () => {
  it("provides an accessible Profile-to-Shout-Out invite action", () => {
    const source = readFileSync(resolve(__dirname, "../client/src/pages/Profile.tsx"), "utf8");
    expect(source).toContain('navigate("/shout-out")');
    expect(source).toContain('aria-label="Invite friends to Just Putzit"');
    expect(source).toContain("Invite friends");
  });
});

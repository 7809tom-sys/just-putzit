import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("authenticated home referral entry", () => {
  const source = readFileSync(resolve(__dirname, "../client/src/pages/Home.tsx"), "utf8");

  it("keeps a direct accessible referral action beside Home customization", () => {
    expect(source).toContain('navigate("/shout-out")');
    expect(source).toContain('aria-label="Recommend Just Putzit to a friend"');
    expect(source).toContain("Refer</span>");
  });

  it("includes the full Shout-Out module in new members’ default layouts", () => {
    expect(source).toContain('id: "shoutout"');
    expect(source).toContain("defaultPinned: true");
  });
});

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("floating authenticated Home referral action", () => {
  it("routes to Shout-Out as a desktop floating action while mobile uses the primary Refer tab", () => {
    const source = readFileSync(resolve(__dirname, "../client/src/pages/Home.tsx"), "utf8");
    expect(source).toContain('navigate("/shout-out")');
    expect(source).toContain("fixed bottom-6 left-2 z-40 hidden h-12 w-12 items-center justify-center");
    expect(source).toContain("sm:flex");
    expect(source).toContain('aria-label="Invite friends to Just Putzit"');
    expect(source).toContain("Invite friends");
  });
});

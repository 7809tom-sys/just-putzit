import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("concise referral route", () => {
  it("maps both referral URLs to the existing Shout-Out invitation experience", () => {
    const source = readFileSync(resolve(__dirname, "../client/src/App.tsx"), "utf8");
    expect(source).toContain('<Route path="/shout-out" component={ShoutOut} />');
    expect(source).toContain('<Route path="/refer" component={ShoutOut} />');
  });
});

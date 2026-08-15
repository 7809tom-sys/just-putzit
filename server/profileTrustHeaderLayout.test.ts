import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("mobile profile trust header", () => {
  it("keeps the member name separate from wrapping trust badges", () => {
    const source = readFileSync(resolve(__dirname, "../client/src/pages/Profile.tsx"), "utf8");
    expect(source).toContain('flex items-center justify-center sm:justify-start mb-1');
    expect(source).toContain('mb-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start');
    expect(source).toContain("Device passkey verified");
    expect(source).toContain("City check complete");
  });
});

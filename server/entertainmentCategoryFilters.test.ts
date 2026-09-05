import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Entertainment category filters", () => {
  it("exposes dedicated live-band, comedy, and karaoke filters without removing the full local feed", () => {
    const source = readFileSync(resolve(__dirname, "../client/src/pages/Entertainment.tsx"), "utf8");
    expect(source).toContain('label: "All entertainment"');
    expect(source).toContain('label: "Live bands"');
    expect(source).toContain('label: "Comedy"');
    expect(source).toContain('label: "Karaoke"');
    expect(source).toContain("matchesEntertainmentKind");
    expect(source).toContain('aria-label="Entertainment type filters"');
  });
});

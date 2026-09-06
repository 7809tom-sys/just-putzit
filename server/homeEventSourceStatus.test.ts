import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Home event source status", () => {
  const home = readFileSync(resolve(__dirname, "../client/src/pages/Home.tsx"), "utf8");

  it("distinguishes official event handoffs from cards that need venue confirmation", () => {
    expect(home).toContain("function getEventSourceStatus");
    expect(home).toContain('label: "Official source"');
    expect(home).toContain('label: "Community submitted"');
    expect(home).toContain('label: "Community listing"');
    expect(home).toContain("Confirm details with the venue");
  });

  it("only shows the official details handoff when an official URL is available", () => {
    expect(home).toContain("{sourceStatus && !item.externalUrl");
    expect(home).toContain("{item.externalUrl && <a href={item.externalUrl}");
    expect(home).toContain("source: event.source");
  });
});

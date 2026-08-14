import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const safetyPage = readFileSync(new URL("../client/src/pages/Safety.tsx", import.meta.url), "utf8");

describe("Safety & Trust content", () => {
  it("describes the implemented private report and block controls", () => {
    expect(safetyPage).toContain("Reports are private");
    expect(safetyPage).toContain("Block closes the connection");
    expect(safetyPage).toContain("contact local emergency services first");
  });

  it("does not promise unsupported universal safety outcomes", () => {
    expect(safetyPage).not.toContain("Zero Fake Profiles");
    expect(safetyPage).not.toContain("Every Match Is Real");
    expect(safetyPage).not.toContain("Every login triggers a fresh");
    expect(safetyPage).not.toContain("Reported accounts are immediately restricted");
  });
});

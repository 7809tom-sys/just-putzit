import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Shared question synchronization developer website", () => {
  it("registers a public developer route and communicates the safe delta contract", () => {
    const app = readFileSync(resolve(__dirname, "../client/src/App.tsx"), "utf8");
    const page = readFileSync(resolve(__dirname, "../client/src/pages/SharedQuestionSync.tsx"), "utf8");

    expect(app).toContain('path="/developer-sync" component={SharedQuestionSync}');
    expect(app).toContain('"/developer-sync"');
    expect(page).toContain("Ship fresh game content without shipping answers.");
    expect(page).toContain("Presentation-safe by design");
    expect(page).toContain("Idempotent release updates");
    expect(page).toContain("Scored rooms stay pinned");
    expect(page).toContain("Request snapshot");
  });
});

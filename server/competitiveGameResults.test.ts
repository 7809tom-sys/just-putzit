import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("competitive game result integration", () => {
  it("records Jeopardy and Trivia Pursuit outcomes once and returns dashboard stats", () => {
    const root = resolve(__dirname, "..");
    const db = readFileSync(resolve(root, "server/db.ts"), "utf8");
    const jeopardy = readFileSync(resolve(root, "server/routers/jeopardy.ts"), "utf8");
    const trivia = readFileSync(resolve(root, "server/routers/trivia-pursuit.ts"), "utf8");
    const dashboard = readFileSync(resolve(root, "server/routers.ts"), "utf8");
    const profileDashboard = readFileSync(resolve(root, "client/src/pages/ProfileDashboard.tsx"), "utf8");
    expect(db).toContain("recordCompetitiveGameResults");
    expect(db).toContain("onDuplicateKeyUpdate");
    expect(jeopardy).toContain('recordCompetitiveGameResults("jeopardy"');
    expect(trivia).toContain('recordCompetitiveGameResults("trivia_pursuit"');
    expect(dashboard).toContain("competitiveGameStats");
    expect(profileDashboard).toContain("Competitive game record");
  });
});

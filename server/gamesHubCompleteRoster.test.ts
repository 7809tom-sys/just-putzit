import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Games Hub complete roster", () => {
  it("lists every current direct and match-required game with a clear handoff", () => {
    const source = readFileSync(resolve(__dirname, "../client/src/pages/GamesHub.tsx"), "utf8");
    for (const title of [
      "Would You Rather",
      "Newlywed Game",
      "Two Truths & a Lie",
      "This or That",
      "Pick a Plan",
      "Would You Rather Challenge",
      "Bulger Dash",
      "Team Builder",
      "Watch Party",
    ]) {
      expect(source).toContain(`title: "${title}"`);
    }
    expect(source).toContain("if (game.requiresMatch)");
    expect(source).toContain('navigate("/matches")');
    expect(source).toContain("Choose a match first");
    expect(source).toContain('id: "team_builder"');
    expect(source).toContain('route: "/game-lobby"');
  });
});

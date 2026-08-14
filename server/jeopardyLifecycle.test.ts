import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { isJeopardyBoardComplete, sortJeopardyPlayers } from "../shared/jeopardyLifecycle";

describe("Jeopardy lifecycle", () => {
  it("only completes a board after every available clue has been answered", () => {
    expect(isJeopardyBoardComplete(0, 0)).toBe(false);
    expect(isJeopardyBoardComplete(5, 4)).toBe(false);
    expect(isJeopardyBoardComplete(5, 5)).toBe(true);
  });

  it("orders the final scoreboard from highest to lowest score", () => {
    expect(sortJeopardyPlayers([{ score: 200 }, { score: 1000 }, { score: 600 }]).map((player) => player.score)).toEqual([1000, 600, 200]);
  });

  it("keeps final scoreboard and end-game controls available in the Jeopardy page", () => {
    const root = resolve(__dirname, "..");
    const source = readFileSync(resolve(root, "client/src/pages/Jeopardy.tsx"), "utf8");
    expect(source).toContain("Final Scoreboard");
    expect(source).toContain("View Final Scoreboard");
    expect(source).toContain("endGameMutation");
  });
});

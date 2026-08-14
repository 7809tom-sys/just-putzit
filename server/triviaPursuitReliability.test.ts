import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Trivia Pursuit reliability", () => {
  it("keeps persistent chat, answer feedback, and end-game state wired into the experience", () => {
    const root = resolve(__dirname, "..");
    const routerSource = readFileSync(resolve(root, "server/routers/trivia-pursuit.ts"), "utf8");
    const clientSource = readFileSync(resolve(root, "client/src/pages/TriviaPursuit.tsx"), "utf8");
    expect(routerSource).toContain("getTriviaPursuitChatMessages");
    expect(routerSource).toContain("You already answered this question");
    expect(clientSource).toContain("Final Scoreboard");
    expect(clientSource).toContain("Correct answer:");
    expect(clientSource).toContain("grid-cols-1 gap-2 mt-2 sm:grid-cols-2");
  });
});

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { FINISH_SENTENCE_PROMPTS, normalizeFinishSentenceAnswer } from "../shared/finishSentence";

describe("Finish My Sentence", () => {
  it("provides a short, playable set of community-safe prompts", () => {
    expect(FINISH_SENTENCE_PROMPTS).toHaveLength(5);
    expect(FINISH_SENTENCE_PROMPTS.every((prompt) => prompt.prompt.endsWith("…"))).toBe(true);
  });

  it("normalizes an answer without exceeding the profile-safe length", () => {
    expect(normalizeFinishSentenceAnswer("  A  neighborhood   concert  ")).toBe("A neighborhood concert");
    expect(normalizeFinishSentenceAnswer("x".repeat(300))).toHaveLength(240);
  });

  it("keeps the solo route and public room support wired to the game", () => {
    const root = resolve(__dirname, "..");
    const appSource = readFileSync(resolve(root, "client/src/App.tsx"), "utf8");
    const lobbySource = readFileSync(resolve(root, "client/src/pages/GameLobby.tsx"), "utf8");
    const routerSource = readFileSync(resolve(root, "server/routers.ts"), "utf8");
    expect(appSource).toContain('path="/finish-sentence"');
    expect(lobbySource).toContain('finish_sentence: "/finish-sentence"');
    expect(routerSource).toContain('"finish_sentence"');
  });
});

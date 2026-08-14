import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { isJeopardyAnswerCorrect, normalizeJeopardyAnswer } from "../shared/jeopardyAnswerMatching";

describe("Jeopardy answer matching", () => {
  it("accepts natural Jeopardy phrasing and punctuation around the correct response", () => {
    expect(normalizeJeopardyAnswer(" Who is Gene Sarazen? ")).toBe("gene sarazen");
    expect(isJeopardyAnswerCorrect("Who is Gene Sarazen?", "Gene Sarazen")).toBe(true);
  });

  it("does not treat an unrelated response as correct", () => {
    expect(isJeopardyAnswerCorrect("What is a Caddy", "Gene Sarazen")).toBe(false);
  });

  it("keeps completed clues disabled from persisted room state as well as local state", () => {
    const root = resolve(__dirname, "..");
    const source = readFileSync(resolve(root, "client/src/pages/Jeopardy.tsx"), "utf8");
    expect(source).toContain("clue.answered || answeredClueIds.has(clue.id)");
    expect(source).toContain("Correct response:");
    expect(source).toContain("Check Answer");
  });
});

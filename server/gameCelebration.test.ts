import { describe, expect, it } from "vitest";
import {
  CELEBRATION_CONFETTI,
  COMPLETION_CHIME_FREQUENCIES,
  isGameCompletionSoundEnabled,
} from "../client/src/lib/gameCelebration";

describe("social game completion celebration", () => {
  it("uses a compact, varied confetti set", () => {
    expect(CELEBRATION_CONFETTI).toHaveLength(11);
    expect(new Set(CELEBRATION_CONFETTI.map((piece) => piece.color)).size).toBeGreaterThan(3);
  });

  it("uses a brief two-note success chime and defaults to sound enabled", () => {
    expect(COMPLETION_CHIME_FREQUENCIES).toEqual([523.25, 659.25]);
    expect(isGameCompletionSoundEnabled()).toBe(true);
  });
});

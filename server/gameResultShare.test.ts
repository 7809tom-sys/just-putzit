import { describe, expect, it } from "vitest";
import { buildGameResultShareData, GAME_RESULT_SHARE_PATH } from "../client/src/lib/gameResultShare";

describe("social game result sharing", () => {
  it("creates a public, game-level share message without private answer details", () => {
    const share = buildGameResultShareData("Local Legend", "https://justputzit.com/");
    expect(share.title).toContain("Local Legend");
    expect(share.text).toContain("community");
    expect(share.text.toLowerCase()).not.toContain("your picks");
    expect(share.url).toBe(`https://justputzit.com${GAME_RESULT_SHARE_PATH}`);
  });
});

import { describe, expect, it } from "vitest";
import {
  COMMON_GROUND_OPTIONS,
  hasExactlyThreeCommonGroundSelections,
  PUBLIC_PLAN_OPTIONS,
  SAFE_PLAN_COPY,
  SOCIAL_GAMES,
} from "../client/src/lib/socialGames";

describe("social game collection", () => {
  it("ships four playable game concepts with distinct identifiers", () => {
    expect(SOCIAL_GAMES.map((game) => game.id)).toEqual([
      "local_legend",
      "perfect_saturday",
      "three_in_common",
      "would_you_join_me",
    ]);
  });

  it("requires exactly three common-ground choices", () => {
    expect(hasExactlyThreeCommonGroundSelections(COMMON_GROUND_OPTIONS.slice(0, 3))).toBe(true);
    expect(hasExactlyThreeCommonGroundSelections(COMMON_GROUND_OPTIONS.slice(0, 2))).toBe(false);
    expect(hasExactlyThreeCommonGroundSelections(COMMON_GROUND_OPTIONS.slice(0, 4))).toBe(false);
  });

  it("keeps coordination prompts public and safety-oriented", () => {
    expect(PUBLIC_PLAN_OPTIONS.every((option) => /market|library|park|museum|theater|recreation/i.test(option))).toBe(true);
    expect(SAFE_PLAN_COPY.toLowerCase()).toContain("public");
    expect(SAFE_PLAN_COPY.toLowerCase()).toContain("comfortable");
  });
});

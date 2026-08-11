import { describe, expect, it } from "vitest";
import {
  getFamilyInvalidGenderToast,
  getFamilyGenderSelectionToast,
  normalizeFamilyChildGender,
} from "../client/src/lib/familySelection";

describe("Family Select feedback", () => {
  it("normalizes each supported gender selection", () => {
    expect(normalizeFamilyChildGender("boy")).toBe("boy");
    expect(normalizeFamilyChildGender("girl")).toBe("girl");
    expect(normalizeFamilyChildGender("nonbinary")).toBe("nonbinary");
    expect(normalizeFamilyChildGender("prefer_not_to_say")).toBe("prefer_not_to_say");
  });

  it("rejects unsupported values without creating selection feedback", () => {
    expect(normalizeFamilyChildGender("unknown")).toBeNull();
    expect(normalizeFamilyChildGender("")).toBeNull();
  });

  it("returns clear confirmation copy for a valid selection", () => {
    expect(getFamilyGenderSelectionToast("girl")).toEqual({
      title: "Girl selected",
      description: "This preference is ready to save with the child’s family profile.",
    });
  });

  it("returns guidance when submission has no valid selection", () => {
    expect(getFamilyInvalidGenderToast()).toEqual({
      title: "Choose a gender selection",
      description: "Select Boy, Girl, Non-binary, or Prefer not to say before adding the child.",
    });
  });
});

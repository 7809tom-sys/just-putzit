import { describe, expect, it } from "vitest";
import { sanitizeWyrProfileInsights } from "../shared/wyrProfileInsightPolicy";

describe("Would You Rather profile insight policy", () => {
  it("keeps only preference phrases directly supported by the selected option", () => {
    expect(sanitizeWyrProfileInsights({
      favoriteActivities: ["coffee"],
      interests: ["coffee"],
      values: ["unlimited"],
    }, "Have unlimited free coffee every day")).toEqual({
      favoriteActivities: ["coffee"],
      interests: ["coffee"],
      values: ["unlimited"],
    });
  });

  it("rejects personality labels, paraphrases, and fields unsupported by one game choice", () => {
    expect(sanitizeWyrProfileInsights({
      personalityKeywords: ["adventurous"],
      favoriteActivities: ["cafe hopping"],
      interests: ["coffee"],
      socialStyle: "extrovert",
    }, "Have unlimited free coffee every day")).toEqual({
      interests: ["coffee"],
    });
  });
});

import { describe, expect, it } from "vitest";
import { buildJustPutzitReferralMessage } from "../shared/referralCopy";

describe("community-first referral copy", () => {
  it("invites friends through events, activities, and real-world connection without city or dating-first claims", () => {
    const message = buildJustPutzitReferralMessage("https://justputzit.com/?invite=abc123");
    expect(message).toContain("local events, activities, and real-world connection");
    expect(message).toContain("https://justputzit.com/?invite=abc123");
    expect(message.toLocaleLowerCase()).not.toContain("dating app");
    expect(message).not.toContain("Waukesha");
  });
});

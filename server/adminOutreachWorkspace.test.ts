import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("administrator direct outreach workspace", () => {
  it("keeps the recipient venue-bound and requires a separate confirmation action", () => {
    const source = readFileSync(resolve(__dirname, "../client/src/pages/Admin.tsx"), "utf8");
    expect(source).toContain('value="outreach"');
    expect(source).toContain("trpc.outreach.eligibleVenues.useQuery");
    expect(source).toContain("trpc.outreach.history.useQuery");
    expect(source).toContain("Review & send");
    expect(source).toContain("Send this outreach email?");
    expect(source).toContain("confirmed: true");
    expect(source).toContain("support@justputzit.com");
    expect(source).toContain("Start from a reviewable template");
    expect(source).toContain("hydrateOutreachTemplate(nextTemplate, selectedVenue)");
  });
});

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("event introduction consent", () => {
  it("requires an RSVP before a member can opt in to Sally introductions", () => {
    const root = resolve(__dirname, "..");
    const dbSource = readFileSync(resolve(root, "server/db.ts"), "utf8");
    expect(dbSource).toContain("RSVP to this public event before opting in to introductions");
    expect(dbSource).toContain("openToSallyIntroduction");
  });

  it("keeps attendee identities private in the member-facing consent copy", () => {
    const root = resolve(__dirname, "..");
    const source = readFileSync(resolve(root, "client/src/pages/Events.tsx"), "utf8");
    expect(source).toContain("another attendee independently opts in");
    expect(source).toContain("Attendee identities stay private until both people agree");
  });
});

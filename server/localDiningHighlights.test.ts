import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("local dining and complete discovery cards", () => {
  const schema = readFileSync(resolve(__dirname, "../drizzle/schema.ts"), "utf8");
  const db = readFileSync(resolve(__dirname, "./db.ts"), "utf8");
  const board = readFileSync(resolve(__dirname, "../client/src/pages/ActivityBoard.tsx"), "utf8");
  const sourceAudit = readFileSync(resolve(__dirname, "../research/local-business-source-audit.md"), "utf8");

  it("stores local ownership only as explicit venue metadata", () => {
    expect(schema).toContain('isLocallyOwned: boolean("is_locally_owned")');
    expect(schema).toContain('ownershipNote: varchar("ownership_note", { length: 300 })');
    expect(db).toContain("venueIsLocallyOwned: venuePartners.isLocallyOwned");
    expect(db).toContain("venueOwnershipNote: venuePartners.ownershipNote");
  });

  it("features verified locally owned coffee and dining with official handoffs", () => {
    expect(board).toContain("locallyOwnedDiningHighlights");
    expect(board).toContain('activity.venueIsLocallyOwned');
    expect(board).toContain("Locally owned coffee & dining in");
    expect(board).toContain("Ownership is shown only when stated on the business’s official site.");
    expect(board).toContain("Official website, hours & menu");
  });

  it("keeps full event descriptions, address detail, and official event handoffs visible on cards", () => {
    expect(board).toContain('<p className="text-gray-600 text-sm mb-2">{event.description}</p>');
    expect(board).toContain("{event.address &&");
    expect(board).toContain("Official details, tickets & hours");
  });

  it("retains official ownership and direct-handoff evidence for Milwaukee local-business highlights", () => {
    expect(sourceAudit).toContain("## Sprocket Café");
    expect(sourceAudit).toContain("3385 S Kinnickinnic Ave, Milwaukee, WI 53207");
    expect(sourceAudit).toContain("https://sprocketcafe.weebly.com/");
    expect(sourceAudit).toContain("## The Packing House");
    expect(sourceAudit).toContain("900 E Layton Ave, Milwaukee, WI");
    expect(sourceAudit).toContain("https://packinghousemke.com/");
  });

  it("retains Brookfield local-ownership evidence while excluding unverified coffee ownership claims", () => {
    expect(sourceAudit).toContain("## The Elbow Room");
    expect(sourceAudit).toContain("Brookfield’s locally owned bar and grill");
    expect(sourceAudit).toContain("2850 N Brookfield Rd, Brookfield, WI 53045");
    expect(sourceAudit).toContain("https://www.elbowroombrookfield.com/");
    expect(sourceAudit).toContain("## Brookfield Coffee Candidates");
    expect(sourceAudit).toContain("none is labeled or seeded as a **locally owned** Brookfield coffee card");
  });
});

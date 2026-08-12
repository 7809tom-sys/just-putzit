import { describe, expect, it } from "vitest";
import { getWaukeshaLibrarySpotlight } from "../client/src/lib/waukeshaLibrarySpotlight";

describe("Waukesha Public Library spotlight", () => {
  it("selects the next active Waukesha Public Library program for primary discovery", () => {
    const now = new Date("2026-08-12T12:00:00Z");
    const program = getWaukeshaLibrarySpotlight([
      { id: 1, title: "Past program", venueName: "Waukesha Public Library", eventDate: "2026-08-10T18:00:00Z" },
      { id: 2, title: "Carnegie Series", venueName: "Waukesha Public Library", eventDate: "2026-08-14T14:00:00Z", externalUrl: "https://example.com/library" },
      { id: 3, title: "Other venue", venueName: "Waukesha Civic Theatre", eventDate: "2026-08-13T18:00:00Z" },
      { id: 4, title: "Trail Running Film Festival", venueName: "Waukesha Public Library", eventDate: "2026-08-18T18:00:00Z" },
    ], now);
    expect(program?.id).toBe(2);
    expect(program?.title).toBe("Carnegie Series");
  });
});

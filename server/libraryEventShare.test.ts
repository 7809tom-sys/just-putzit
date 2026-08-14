import { describe, expect, it } from "vitest";
import { buildLibraryEventShareData } from "../client/src/lib/libraryEventShare";

describe("Waukesha Library event sharing", () => {
  it("shares public program details and the official event link only", () => {
    const shareData = buildLibraryEventShareData({
      title: "Tabletop Gaming Night",
      eventDate: "2026-08-20T18:00:00Z",
      venueName: "Waukesha Public Library",
      externalUrl: "https://waukesha.librarycalendar.com/event/123",
    });
    expect(shareData.title).toContain("Waukesha Public Library");
    expect(shareData.text).toContain("Want to join me");
    expect(shareData.url).toBe("https://waukesha.librarycalendar.com/event/123");
  });
});

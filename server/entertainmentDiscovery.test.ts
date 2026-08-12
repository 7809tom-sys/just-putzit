import { describe, expect, it } from "vitest";
import { filterCurrentEntertainment } from "../client/src/lib/entertainmentDiscovery";

describe("current entertainment discovery", () => {
  const now = new Date("2026-08-12T12:00:00Z");

  it("keeps future music, arts, community, and named entertainment listings while excluding stale items", () => {
    const listings = [
      { id: 1, title: "Friday Night Live", category: "music", eventDate: new Date("2026-08-14T18:30:00Z"), city: "Waukesha", isFree: true },
      { id: 2, title: "Book Discussion", category: "community", eventDate: new Date("2026-08-19T18:30:00Z"), city: "Waukesha", isFree: true },
      { id: 3, title: "Old Concert", category: "music", eventDate: new Date("2026-08-01T18:30:00Z"), city: "Waukesha", isFree: true },
      { id: 4, title: "Neighborhood meeting", category: "other", eventDate: new Date("2026-08-20T18:30:00Z"), city: "Waukesha", isFree: true },
    ];
    expect(filterCurrentEntertainment(listings, now).map((listing) => listing.id)).toEqual([1, 2]);
  });
});

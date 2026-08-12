import { describe, expect, it } from "vitest";
import { BOOKINGS_SKELETON_CARD_COUNT } from "../client/src/lib/bookingsLoading";

describe("bookings loading skeleton", () => {
  it("uses a compact set of booking-card placeholders", () => {
    expect(BOOKINGS_SKELETON_CARD_COUNT).toBe(3);
  });
});

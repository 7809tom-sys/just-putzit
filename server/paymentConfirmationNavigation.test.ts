import { describe, expect, it } from "vitest";
import { PAYMENT_CONFIRMATION_NAVIGATION } from "../client/src/lib/paymentConfirmationNavigation";

describe("payment confirmation navigation", () => {
  it("provides direct post-payment routes to bookings and home", () => {
    expect(PAYMENT_CONFIRMATION_NAVIGATION.bookings).toEqual({
      href: "/bookings",
      label: "View My Bookings",
      loadingLabel: "Loading bookings…",
    });
    expect(PAYMENT_CONFIRMATION_NAVIGATION.home).toEqual({
      href: "/",
      label: "Return to Home",
    });
  });
});

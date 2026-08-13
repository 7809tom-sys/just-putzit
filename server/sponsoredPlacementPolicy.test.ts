import { describe, expect, it } from "vitest";
import { getSponsoredPlacementEligibility, getSponsoredPlacementPackage } from "../shared/sponsoredPlacementPolicy";

describe("sponsored placement policy", () => {
  it("uses transparent seven and thirty day packages", () => {
    expect(getSponsoredPlacementPackage("week")).toMatchObject({ amountCents: 9900, durationDays: 7 });
    expect(getSponsoredPlacementPackage("month")).toMatchObject({ amountCents: 24900, durationDays: 30 });
  });

  it("requires an active business activity but does not block member-facing paid venues", () => {
    expect(getSponsoredPlacementEligibility({ listingIsActive: false, listingIsPublicAccess: true, venueIsPublicAccess: true })).toMatch(/active/i);
    expect(getSponsoredPlacementEligibility({ listingIsActive: true, listingIsPublicAccess: false, venueIsPublicAccess: false })).toBeNull();
    expect(getSponsoredPlacementEligibility({ listingIsActive: true, listingIsPublicAccess: false, venueIsPublicAccess: true })).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import { getPartnerTrendTooltipLabel } from "../client/src/lib/partnerTrendTooltip";

describe("partner trend exact-value tooltip copy", () => {
  it("uses accurate singular and plural labels for chart points", () => {
    expect(getPartnerTrendTooltipLabel("Aug 12", 1, "bookings")).toBe("Aug 12: 1 booking");
    expect(getPartnerTrendTooltipLabel("Aug 12", 3, "bookings")).toBe("Aug 12: 3 bookings");
    expect(getPartnerTrendTooltipLabel("Aug 12", 2, "attendance")).toBe("Aug 12: 2 attendance check-ins");
  });
});

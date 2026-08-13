import { describe, expect, it } from "vitest";
import { getNotificationActionLabel, getNotificationDestination } from "../client/src/lib/notificationDestination";

describe("pickup notification routing", () => {
  it("sends pickup alerts to public activity coordination", () => {
    expect(getNotificationDestination("pickup_invite")).toBe("/activities");
    expect(getNotificationActionLabel("pickup_invite")).toBe("View public pickup");
  });

  it("does not invent a destination for unrelated alerts", () => {
    expect(getNotificationDestination("new_match")).toBeNull();
  });
});

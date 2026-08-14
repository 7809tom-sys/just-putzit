import { describe, expect, it } from "vitest";
import { DEFAULT_CONNECTION_PREFERENCES, hasSharedConnectionIntent, normalizeConnectionPreferences } from "../shared/connectionPreferences";

describe("connection preferences", () => {
  it("defaults members to community activities without dating or friendship matching", () => {
    expect(normalizeConnectionPreferences(undefined)).toEqual(DEFAULT_CONNECTION_PREFERENCES);
    expect(normalizeConnectionPreferences({ community: false, friendship: true })).toEqual({ community: true, friendship: true, dating: false });
  });

  it("requires a shared opt-in before allowing a new connection match", () => {
    expect(hasSharedConnectionIntent({ friendship: true }, { friendship: true })).toBe(true);
    expect(hasSharedConnectionIntent({ dating: true }, { dating: true })).toBe(true);
    expect(hasSharedConnectionIntent({ dating: true }, { friendship: true })).toBe(false);
    expect(hasSharedConnectionIntent(undefined, { friendship: true })).toBe(false);
  });
});

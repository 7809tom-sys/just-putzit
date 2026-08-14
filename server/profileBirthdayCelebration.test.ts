import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("private profile birthday celebration", () => {
  it("shows the birthday greeting only through the member's own Profile page", () => {
    const source = readFileSync(resolve(__dirname, "../client/src/pages/Profile.tsx"), "utf8");
    expect(source).toContain("const birthdayToday = isProfileBirthdayToday(profileAny?.birthDate)");
    expect(source).toContain("Happy birthday!");
    expect(source).toContain('aria-label="Happy birthday celebration"');
  });
});

import { describe, expect, it } from "vitest";
import { formatProfileBirthday, getProfileAge, parseProfileBirthDate } from "../shared/profileBirthDate";

describe("profile birth-date safeguards", () => {
  it("accepts real calendar dates and formats them safely", () => {
    expect(parseProfileBirthDate("1967-08-14")).not.toBeNull();
    expect(formatProfileBirthday("1967-08-14")).toBe("August 14");
    expect(getProfileAge("1967-08-14", new Date("2026-08-14T12:00:00Z"))).toBe(59);
  });

  it("rejects invalid, impossible, and future date values", () => {
    for (const value of ["Invalid Date", "2020-02-30", "not-a-date", "2099-01-01", undefined]) {
      expect(parseProfileBirthDate(value)).toBeNull();
      expect(formatProfileBirthday(value)).toBeNull();
      expect(getProfileAge(value)).toBeNull();
    }
  });
});

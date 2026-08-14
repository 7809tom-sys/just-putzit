import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("mobile identity editor", () => {
  it("uses native select controls for Android-compatible identity saving", () => {
    const source = readFileSync(resolve(__dirname, "../client/src/pages/Profile.tsx"), "utf8");
    expect(source).toContain('id="id-gender"');
    expect(source).toContain('id="id-orientation"');
    expect(source).toContain("Identity Edit Dialog — uses native <select> for full Android Chrome compatibility");
    expect(source).toContain("onClick={saveIdentity}");
  });
});

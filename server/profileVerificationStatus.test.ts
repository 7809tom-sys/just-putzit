import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("honest profile verification status", () => {
  it("distinguishes optional device and city checks without claiming identity verification", () => {
    const root = resolve(__dirname, "..");
    const source = readFileSync(resolve(root, "client/src/pages/Profile.tsx"), "utf8");
    expect(source).toContain("Device passkey verified");
    expect(source).toContain("City check complete");
    expect(source).toContain("Checks are optional");
    expect(source).not.toContain("Continuous Vetting Status");
    expect(source).not.toContain("Live Background Audit");
  });
});

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("member trust copy", () => {
  it("does not promise universal verification or GPS verification for every member", () => {
    const root = resolve(__dirname, "..");
    const source = readFileSync(resolve(root, "client/src/components/LocalVenueBanner.tsx"), "utf8");
    expect(source).not.toContain("100% Local & Verified");
    expect(source).not.toContain("Every member is GPS-verified");
    expect(source).toContain("Optional account and location verification tools");
  });
});

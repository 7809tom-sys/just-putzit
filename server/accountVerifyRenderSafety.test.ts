import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("AccountVerify render safety", () => {
  it("synchronizes verification state inside an effect instead of during render", () => {
    const source = readFileSync(resolve(__dirname, "../client/src/pages/AccountVerify.tsx"), "utf8");
    expect(source).toContain("useEffect(() => {");
    expect(source).toContain("verificationStatus.passkeyVerified");
    expect(source).toContain("navigate(\"/\")");
    expect(source).not.toContain("prevStatusRef");
  });
});

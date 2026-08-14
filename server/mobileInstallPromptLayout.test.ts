import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("mobile install prompt layout", () => {
  it("keeps the install prompt above bottom navigation on narrow screens", () => {
    const component = readFileSync(resolve(__dirname, "../client/src/components/FloatingInstallButton.tsx"), "utf8");
    expect(component).toContain("bottom-[calc(env(safe-area-inset-bottom)+5.5rem)]");
    expect(component).toContain("sm:bottom-6");
  });
});

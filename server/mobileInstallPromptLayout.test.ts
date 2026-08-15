import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("mobile install prompt layout", () => {
  it("keeps the install entry compact above bottom navigation so it does not cover mobile event actions", () => {
    const component = readFileSync(resolve(__dirname, "../client/src/components/FloatingInstallButton.tsx"), "utf8");
    expect(component).toContain("bottom-[calc(env(safe-area-inset-bottom)+5.5rem)]");
    expect(component).toContain("right-2 z-50 flex flex-col items-end gap-2 sm:hidden");
    expect(component).toContain("right-2 z-50");
    expect(component).toContain("flex h-10 w-10 items-center justify-center rounded-full");
    expect(component).toContain("<span className=\"hidden sm:inline\">Install App</span>");
  });
});

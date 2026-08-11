import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("mobile notification navigation", () => {
  it("uses the registered notifications route instead of an unregistered hard-coded destination", () => {
    const root = resolve(__dirname, "..");
    const app = readFileSync(resolve(root, "client/src/App.tsx"), "utf8");
    const mobileNav = readFileSync(resolve(root, "client/src/components/MobileBottomNav.tsx"), "utf8");

    expect(app).toContain('path={APP_ROUTES.notifications}');
    expect(mobileNav).toContain('href={APP_ROUTES.notifications}');
  });
});

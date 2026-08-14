import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("PWA update refresh", () => {
  it("checks for an updated service worker and reloads only when a new controller activates", () => {
    const root = resolve(__dirname, "..");
    const refreshSource = readFileSync(resolve(root, "client/src/lib/pwaUpdateRefresh.ts"), "utf8");
    const configSource = readFileSync(resolve(root, "vite.config.ts"), "utf8");
    expect(refreshSource).toContain('navigator.serviceWorker.addEventListener("controllerchange"');
    expect(refreshSource).toContain("window.location.reload()");
    expect(refreshSource).toContain("registration?.update()");
    expect(configSource).toContain("clientsClaim: true");
    expect(configSource).toContain("skipWaiting: true");
  });
});

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Cinch Community integration", () => {
  const communityPage = readFileSync(resolve(__dirname, "../client/src/pages/Community.tsx"), "utf8");
  const routerSource = readFileSync(resolve(__dirname, "./routers.ts"), "utf8");

  it("mounts the approved official Cinch script directly in the Community page", () => {
    expect(communityPage).toContain('document.createElement("script")');
    expect(communityPage).toContain("script.src = cinchConfig.scriptUrl");
    expect(communityPage).toContain("script.dataset.seed = cinchConfig.seedId");
    expect(communityPage).toContain("script.dataset.key = cinchConfig.connectKey");
    expect(communityPage).toContain('script.dataset.platform = "generic"');
    expect(communityPage).toContain("mount.replaceChildren(script)");
    expect(routerSource).toContain('scriptUrl: "https://cinchseed.com/v1/watch.js"');
  });

  it("states the administrator approval and member-data boundaries", () => {
    expect(communityPage).toContain("Every Cinch-originated improvement requires administrator approval");
    expect(communityPage).toContain("profile, matching, message, or payment records");
    expect(communityPage).toContain("Review before publish is active");
  });

  it("returns only the approved embed configuration through a narrow public procedure", () => {
    expect(routerSource).toContain("cinchSeed: router({");
    expect(routerSource).toContain("getEmbedConfig: publicProcedure.query");
    expect(routerSource).toContain("process.env.CINCH_SEED_ID");
    expect(routerSource).toContain("process.env.CINCH_CONNECT_KEY");
    expect(routerSource).toContain('scriptUrl: "https://cinchseed.com/v1/watch.js"');
  });
});

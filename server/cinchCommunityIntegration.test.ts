import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Cinch Community integration", () => {
  const communityPage = readFileSync(resolve(__dirname, "../client/src/pages/Community.tsx"), "utf8");
  const routerSource = readFileSync(resolve(__dirname, "./routers.ts"), "utf8");

  it("uses a contained official Cinch iframe with no parent-origin privileges", () => {
    expect(communityPage).toContain('src="${config.scriptUrl}"');
    expect(communityPage).toContain('data-platform="generic"');
    expect(communityPage).toContain('sandbox="allow-scripts"');
    expect(communityPage).toContain('referrerPolicy="no-referrer"');
    expect(communityPage).not.toContain("allow-same-origin");
    expect(communityPage).not.toContain("allow-top-navigation");
    expect(routerSource).toContain('scriptUrl: "https://cinchseed.com/v1/watch.js"');
  });

  it("states the administrator approval and member-data boundaries", () => {
    expect(communityPage).toContain("Every Cinch-originated improvement requires administrator approval");
    expect(communityPage).toContain("profiles, matches, messages, and payment data");
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

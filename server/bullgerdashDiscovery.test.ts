import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Bulger Dash discovery", () => {
  it("keeps the matched game route and gives direct visitors a clear path to Matches", () => {
    const root = resolve(__dirname, "..");
    const app = readFileSync(resolve(root, "client/src/App.tsx"), "utf8");
    const page = readFileSync(resolve(root, "client/src/pages/Bullgerdash.tsx"), "utf8");
    const hub = readFileSync(resolve(root, "client/src/pages/GamesHub.tsx"), "utf8");

    expect(app).toContain('<Route path="/bullgerdash/:matchId" component={Bullgerdash} />');
    expect(app).toContain('<Route path="/bullgerdash" component={Bullgerdash} />');
    expect(page).toContain("Play Bulger Dash with a match");
    expect(page).toContain('navigate("/matches")');
    expect(hub).toContain('navigate("/matches")');
  });
});

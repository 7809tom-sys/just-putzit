import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Gym detail routes", () => {
  it("keeps the Gym Buddy route and supports direct gym detail links", () => {
    const source = readFileSync(resolve(__dirname, "../client/src/App.tsx"), "utf8");
    expect(source).toContain('<Route path="/gym-buddy/:gymId" component={GymPage} />');
    expect(source).toContain('<Route path="/gym/:gymId" component={GymPage} />');
  });
});

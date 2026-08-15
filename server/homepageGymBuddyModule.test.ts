import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Gym Buddy personalized Home module", () => {
  it("offers Gym Buddy as an optional module and keeps both fitness routes available", () => {
    const source = readFileSync(resolve(__dirname, "../client/src/pages/Home.tsx"), "utf8");

    expect(source).toContain('{ id: "gymbuddy",   label: "Gym Buddy"');
    expect(source).toContain('case "gymbuddy":    return <GymBuddyModule navigate={navigate} />;');
    expect(source).toContain('navigate("/gym-buddy")');
    expect(source).toContain('navigate("/my-workout")');
    expect(source).toContain('aria-label={`${m.pinned ? "Remove" : "Add"} ${def.label} from your home page`}');
  });
});

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Gym Buddy fitness-profile presentation", () => {
  const source = readFileSync(resolve(__dirname, "../client/src/pages/GymPage.tsx"), "utf8");

  it("collects and persists member-selected fitness level and workout goals", () => {
    expect(source).toContain("const [fitnessLevel, setFitnessLevel]");
    expect(source).toContain("const [goals, setGoals]");
    expect(source).toContain("fitnessLevel, goals: goals.trim() || undefined");
    expect(source).toContain("Workout Goal");
  });

  it("shows only member-provided matching details on Gym Buddy cards", () => {
    expect(source).toContain("(buddy.fitnessLevel || buddy.goals) &&");
    expect(source).toContain("Goal: {buddy.goals}");
    expect(source).toContain("setGoals(myProfile?.goals ?? \"\")");
  });
});

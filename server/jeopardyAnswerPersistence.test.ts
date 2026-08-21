import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Jeopardy answer persistence", () => {
  it("uses a 64-bit timestamp column for millisecond answer times", () => {
    const schema = readFileSync(resolve(__dirname, "../drizzle/schema.ts"), "utf8");
    const migration = readFileSync(resolve(__dirname, "../drizzle/0051_jeopardy_answer_timestamp.sql"), "utf8");

    expect(schema).toContain('answeredAtMs: bigint("answeredAtMs", { mode: "number" })');
    expect(migration).toContain("MODIFY COLUMN `answeredAtMs` BIGINT");
    expect(Date.now()).toBeGreaterThan(2_147_483_647);
  });

  it("returns safe answer-save feedback instead of raw database text", () => {
    const router = readFileSync(resolve(__dirname, "../server/routers/jeopardy.ts"), "utf8");
    const client = readFileSync(resolve(__dirname, "../client/src/pages/Jeopardy.tsx"), "utf8");

    expect(router).toContain("We couldn't save that answer. Please try again.");
    expect(client).toContain('toast.error("We couldn\'t save that answer. Please try again.")');
    expect(client).not.toContain('toast.error(error.message || "We couldn\'t check that answer. Please try again.")');
  });
});

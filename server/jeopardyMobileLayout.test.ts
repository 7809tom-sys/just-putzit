import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Jeopardy mobile category layout", () => {
  it("stacks category controls on narrow screens and permits multi-line labels", () => {
    const root = resolve(__dirname, "..");
    const source = readFileSync(resolve(root, "client/src/pages/Jeopardy.tsx"), "utf8");
    expect(source).toContain('grid-cols-1 gap-2 mt-2 sm:grid-cols-2');
    expect(source).toContain('min-h-12 h-auto justify-start whitespace-normal');
  });
});

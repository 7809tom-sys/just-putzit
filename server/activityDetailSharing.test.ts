import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("activity detail sharing", () => {
  it("keeps the copy-link action signed-in and gives clear feedback", () => {
    const source = readFileSync(resolve(__dirname, "../client/src/pages/EventDetail.tsx"), "utf8");
    expect(source).toContain("const copyActivityLink = async () =>");
    expect(source).toContain("navigator.clipboard.writeText(window.location.href)");
    expect(source).toContain('toast.success("Event link copied")');
    expect(source).toContain("Copy link");
    expect(source).toContain("{viewer ? (");
  });
});

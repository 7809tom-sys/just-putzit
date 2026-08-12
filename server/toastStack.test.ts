import { describe, expect, it } from "vitest";
import { TOAST_STACK_EXPANDED, TOAST_STACK_GAP, TOAST_STACK_POSITION, TOAST_STACK_VISIBLE_COUNT } from "../client/src/lib/toastStack";

describe("toast notification stacking", () => {
  it("keeps several alerts visible in an expanded vertical stack", () => {
    expect(TOAST_STACK_VISIBLE_COUNT).toBeGreaterThan(1);
    expect(TOAST_STACK_EXPANDED).toBe(true);
    expect(TOAST_STACK_GAP).toBeGreaterThan(0);
    expect(TOAST_STACK_POSITION).toBe("top-right");
  });
});

import { describe, expect, it } from "vitest";
import { APP_ROUTES } from "./routes";

describe("application route registry", () => {
  it("keeps the notifications destination as a valid absolute route", () => {
    expect(APP_ROUTES.notifications).toBe("/notifications");
  });
});

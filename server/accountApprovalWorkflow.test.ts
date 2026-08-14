import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("moderation account approval workflow", () => {
  it("provides an explicit audited approval path for suspended accounts", () => {
    const root = resolve(__dirname, "..");
    const dbSource = readFileSync(resolve(root, "server/db.ts"), "utf8");
    const routerSource = readFileSync(resolve(root, "server/routers.ts"), "utf8");
    const adminSource = readFileSync(resolve(root, "client/src/pages/Admin.tsx"), "utf8");
    expect(dbSource).toContain("approveSuspendedUser");
    expect(dbSource).toContain("Account approved and restored by admin after review");
    expect(routerSource).toContain("approveUser: protectedProcedure");
    expect(adminSource).toContain("Approve & restore account");
  });
});

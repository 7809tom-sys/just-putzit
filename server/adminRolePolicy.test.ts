import { describe, expect, it } from "vitest";
import { getAdminRoleChangeBlock } from "./adminRolePolicy";

describe("administrator role safeguards", () => {
  const owner = { id: 1, openId: "owner-open-id", role: "admin" as const };
  const member = { id: 2, openId: "member-open-id", role: "user" as const };

  it("allows an admin to promote an existing member", () => {
    expect(getAdminRoleChangeBlock(owner.id, member, "admin", owner.openId)).toBeNull();
  });

  it("prevents self-demotion and owner demotion", () => {
    expect(getAdminRoleChangeBlock(owner.id, owner, "user", owner.openId)).toContain("own");
    expect(getAdminRoleChangeBlock(member.id, owner, "user", owner.openId)).toContain("owner");
  });

  it("does not promote banned accounts", () => {
    expect(getAdminRoleChangeBlock(owner.id, { ...member, role: "banned" }, "admin", owner.openId)).toContain("Banned");
  });
});

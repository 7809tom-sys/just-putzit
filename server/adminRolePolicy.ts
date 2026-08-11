export type ManagedMember = {
  id: number;
  openId: string;
  role: "user" | "admin" | "banned";
};

export function getAdminRoleChangeBlock(
  actorUserId: number,
  target: ManagedMember,
  nextRole: "user" | "admin",
  ownerOpenId?: string,
): string | null {
  if (target.role === "banned") return "Banned accounts cannot be granted administrator access.";
  if (actorUserId === target.id && nextRole !== "admin") return "You cannot remove your own administrator access.";
  if (ownerOpenId && target.openId === ownerOpenId && nextRole !== "admin") return "The owner administrator role cannot be removed here.";
  return null;
}

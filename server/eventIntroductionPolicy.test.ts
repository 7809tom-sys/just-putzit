import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { canCreateEventIntroduction } from "../shared/eventIntroductionPolicy";

const eligible = {
  requesterUserId: 11,
  candidateUserId: 22,
  requesterOptedIn: true,
  candidateOptedIn: true,
  isBlocked: false,
  alreadyMatched: false,
};

describe("mutual event introduction policy", () => {
  it("requires two different attendees to each opt in", () => {
    expect(canCreateEventIntroduction(eligible)).toBe(true);
    expect(canCreateEventIntroduction({ ...eligible, candidateOptedIn: false })).toBe(false);
    expect(canCreateEventIntroduction({ ...eligible, candidateUserId: 11 })).toBe(false);
  });

  it("never creates an event introduction across a block or existing match", () => {
    expect(canCreateEventIntroduction({ ...eligible, isBlocked: true })).toBe(false);
    expect(canCreateEventIntroduction({ ...eligible, alreadyMatched: true })).toBe(false);
  });

  it("keeps the mutual introduction mutation and private member action wired", () => {
    const root = resolve(__dirname, "..");
    const routerSource = readFileSync(resolve(root, "server/routers.ts"), "utf8");
    const eventsSource = readFileSync(resolve(root, "client/src/pages/Events.tsx"), "utf8");
    expect(routerSource).toContain("requestSallyIntroduction: protectedProcedure");
    expect(routerSource).toContain("createMutualEventIntroduction(input.eventId, ctx.user.id)");
    expect(eventsSource).toContain("Ask Sally");
    expect(eventsSource).toContain("requestSallyIntroduction.useMutation");
  });
});

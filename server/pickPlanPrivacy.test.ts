import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { toPickPlanViewerPayload } from "./routers";

describe("Pick a Plan private voting", () => {
  const candidate = { id: 41, title: "Public Library Film Night", externalUrl: "https://example.com/book" };

  it("reveals only a member’s own vote and aggregate partner progress while the round is voting", () => {
    const payload = toPickPlanViewerPayload({
      round: { id: 8, matchId: 3, status: "voting", matchedEventId: null, expiresAt: new Date("2026-09-01") },
      candidates: [candidate],
      votes: [{ userId: 100, eventId: 41 }, { userId: 200, eventId: 999 }],
    } as any, 100, 200);

    expect(payload.round.myVoteEventId).toBe(41);
    expect(payload.round.partnerSubmitted).toBe(true);
    expect(payload.round.matchedEvent).toBeNull();
    expect(payload).not.toHaveProperty("votes");
    expect(payload.round).not.toHaveProperty("partnerVoteEventId");
  });

  it("reveals an event only after the server marks the round as matched", () => {
    const payload = toPickPlanViewerPayload({
      round: { id: 9, matchId: 3, status: "matched", matchedEventId: 41, expiresAt: new Date("2026-09-01") },
      candidates: [candidate],
      votes: [{ userId: 100, eventId: 41 }, { userId: 200, eventId: 41 }],
    } as any, 100, 200);

    expect(payload.round.matchedEvent).toMatchObject({ id: 41, title: "Public Library Film Night" });
  });

  it("registers Pick a Plan from a private match-games screen", () => {
    const gamesSource = readFileSync(resolve(__dirname, "../client/src/pages/Games.tsx"), "utf8");
    const appSource = readFileSync(resolve(__dirname, "../client/src/App.tsx"), "utf8");
    expect(gamesSource).toContain('title="Pick a Plan"');
    expect(gamesSource).toContain("navigate(`/pick-a-plan/${mid}`)");
    expect(appSource).toContain('path="/pick-a-plan/:matchId"');
  });

  it("reuses an active round for the same match rather than creating competing private choices", () => {
    const routerSource = readFileSync(resolve(__dirname, "./routers.ts"), "utf8");
    expect(routerSource).toContain("getActivePickPlanRoundForMatch(match.id)");
    expect(routerSource).toContain("if (activeRound) return { roundId: activeRound.id }");
  });

  it("keeps a mutual plan review-first and offers the official booking page as an explicit member action", () => {
    const pageSource = readFileSync(resolve(__dirname, "../client/src/pages/PickAPlan.tsx"), "utf8");
    expect(pageSource).toContain("navigate(`/trip-planner?${params.toString()}`)");
    expect(pageSource).toContain("Official details / book");
    expect(pageSource).toContain("no RSVP, booking, or message is created automatically");
  });
});

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const project = (path: string) => readFileSync(resolve(__dirname, "..", path), "utf8");

describe("Bulger Dash group play", () => {
  it("keeps group rounds separate from private match games and snapshots eligible voters", () => {
    const schema = project("drizzle/schema.ts");
    const router = project("server/routers/bullgerdash.ts");

    expect(schema).toContain("bullgerdash_group_games");
    expect(schema).toContain("bullgerdash_group_rounds");
    expect(schema).toContain("bullgerdash_group_votes");
    expect(schema).toContain("participantIds");
    expect(schema).toContain("bullgerdash_group_vote_unique");
    expect(router).toContain("eligibleVoterIds");
    expect(router).toContain("if (votes.length < eligibleVoterIds.length)");
    expect(router).toContain("myVote");
    expect(router).not.toContain("groupVotes:");
  });

  it("exposes Bulger Dash as a Game Lobby option and group route rather than a match-only card", () => {
    const hub = project("client/src/pages/GamesHub.tsx");
    const lobby = project("client/src/pages/GameLobby.tsx");
    const app = project("client/src/App.tsx");
    const groupPage = project("client/src/pages/BullgerdashGroup.tsx");

    expect(hub).toContain('route: "/bullgerdash"');
    expect(hub).toContain('navigate("/game-lobby")');
    expect(lobby).toContain('bullgerdash: { label: "Bulger Dash"');
    expect(lobby).toContain('"bullgerdash"] as const');
    expect(lobby).toContain('navigate(`/bullgerdash-room/${activeRoom.id}`)');
    expect(app).toContain('<Route path="/bullgerdash-room/:roomId" component={BullgerdashGroup} />');
    expect(groupPage).toContain("groupSubmitVote");
    expect(groupPage).toContain("groupNextRound");
  });
});

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Game Lobby routes", () => {
  it("limits generic room creation to types accepted by the server and keeps solo routes live", () => {
    const root = resolve(__dirname, "..");
    const lobbySource = readFileSync(resolve(root, "client/src/pages/GameLobby.tsx"), "utf8");
    const routerSource = readFileSync(resolve(root, "server/routers.ts"), "utf8");
    const appSource = readFileSync(resolve(root, "client/src/App.tsx"), "utf8");
    expect(lobbySource).toContain('const ROOM_GAME_TYPES = ["would_you_rather", "trivia", "icebreaker", "two_truths", "finish_sentence"]');
    expect(routerSource).toContain('z.enum(["would_you_rather", "trivia", "icebreaker", "two_truths", "finish_sentence"])');
    expect(lobbySource).toContain('finish_sentence: "/finish-sentence"');
    expect(appSource).toContain('path="/finish-sentence"');
  });

  it("uses the same direct solo-game handler from the dialog and every playable game card", () => {
    const root = resolve(__dirname, "..");
    const lobbySource = readFileSync(resolve(root, "client/src/pages/GameLobby.tsx"), "utf8");
    expect(lobbySource).toContain('jeopardy: "/jeopardy"');
    expect(lobbySource).toContain('trivia_pursuit: "/trivia-pursuit"');
    expect(lobbySource).toContain('would_you_rather: "/would-you-rather"');
    expect(lobbySource).toContain('trivia: "/trivia"');
    expect(lobbySource).toContain('finish_sentence: "/finish-sentence"');
    expect(lobbySource).toContain("const openSoloGame");
    expect(lobbySource).toContain("Play solo");
  });
});

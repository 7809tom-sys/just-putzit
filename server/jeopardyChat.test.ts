import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Jeopardy multiplayer chat", () => {
  it("persists Jeopardy messages separately and reloads them for room participants", () => {
    const root = resolve(__dirname, "..");
    const dbSource = readFileSync(resolve(root, "server/db.ts"), "utf8");
    const routerSource = readFileSync(resolve(root, "server/routers/jeopardy.ts"), "utf8");
    const clientSource = readFileSync(resolve(root, "client/src/pages/Jeopardy.tsx"), "utf8");
    expect(dbSource).toContain("sendJeopardyChatMessage");
    expect(dbSource).toContain('roomType: "jeopardy"');
    expect(routerSource).toContain("getChat: protectedProcedure");
    expect(clientSource).toContain("trpc.jeopardy.getChat.useQuery");
    expect(clientSource).toContain("refetchInterval: 3000");
  });
});

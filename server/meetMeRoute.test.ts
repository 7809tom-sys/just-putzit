import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

function section(source: string, startMarker: string, endMarker: string): string {
  const start = source.indexOf(startMarker);
  if (start < 0) return "";
  const end = source.indexOf(endMarker, start + startMarker.length);
  return end < 0 ? source.slice(start) : source.slice(start, end);
}

describe("Meet Me wiring", () => {
  it("mounts the router on the app router", () => {
    const routerSource = read("server/routers.ts");
    expect(routerSource).toContain('import { meetMeRouter } from "./routers/meetMe"');
    expect(routerSource).toContain("meetMe: meetMeRouter,");
  });

  it("keeps every mutation behind the server-side flag", () => {
    const source = read("server/routers/meetMe.ts");
    const mutations = source.split(".mutation(").slice(1);
    expect(mutations.length).toBeGreaterThanOrEqual(9);
    for (const mutation of mutations) {
      expect(mutation.slice(0, 260)).toContain("assertMeetMeEnabled()");
    }
    // The read used to explain the feature must stay available while it is switched off.
    const stateSection = section(source, "getState:", "listVenues:");
    expect(stateSection).not.toContain("assertMeetMeEnabled");
    expect(source).not.toContain("publicProcedure");
  });

  it("never returns a face from the polling path", () => {
    const service = read("server/meetMe/service.ts");
    const poll = section(service, "export async function pollMeetMe", "// ─── Encounter actions");
    const open = section(service, "export async function openMeetMeEncounter", "/** A one-shot doorbell");
    expect(poll.length).toBeGreaterThan(200);
    expect(poll).not.toContain("photoUrl");
    expect(poll).not.toContain("profilePhotos");
    expect(poll).not.toContain("s3Key");
    expect(open).toContain("photoUrl");
    expect(open).toContain("isBlockInEffect");
  });

  it("stores no coordinate or address for this feature", () => {
    const files = [
      "shared/meetMePolicy.ts",
      "server/meetMe/service.ts",
      "server/routers/meetMe.ts",
      "drizzle/0062_meet_me_proximity.sql",
    ];
    for (const file of files) {
      const source = read(file);
      expect(source).not.toMatch(/\blatitude\b/i);
      expect(source).not.toMatch(/\blongitude\b/i);
      expect(source).not.toMatch(/\blat\b|\blng\b/i);
    }
  });

  it("keeps an in-person encounter out of the match tables", () => {
    const service = read("server/meetMe/service.ts");
    expect(service).not.toContain("insert(matches)");
    expect(service).not.toContain("eventIntroductions");
    expect(service).not.toContain("chatMessages");
  });

  it("ships the migration and the member-facing page", () => {
    expect(existsSync(resolve(root, "drizzle/0062_meet_me_proximity.sql"))).toBe(true);
    expect(existsSync(resolve(root, "client/src/pages/MeetMe.tsx"))).toBe(true);
    const page = read("client/src/pages/MeetMe.tsx");
    expect(page).toContain("trpc.meetMe.getState");
    expect(page).toContain("trpc.meetMe.start");
    expect(page).toContain("trpc.meetMe.stop");
  });
});

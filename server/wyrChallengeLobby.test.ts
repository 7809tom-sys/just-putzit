import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readProjectFile = (relativePath: string) =>
  readFileSync(resolve(__dirname, "..", relativePath), "utf8");

describe("matched Would You Rather challenge lobby", () => {
  it("registers a parameterized private participant route before the generic challenge directory", () => {
    const source = readProjectFile("client/src/App.tsx");
    const participantRoute = source.indexOf('<Route path="/wyr-challenge/:challengeId" component={WyrChallenge} />');
    const directoryRoute = source.indexOf('<Route path="/wyr-challenge" component={WyrChallenge} />');

    expect(participantRoute).toBeGreaterThan(-1);
    expect(directoryRoute).toBeGreaterThan(participantRoute);
  });

  it("keeps the participant UI on the authorized shared-question query and delays the reveal", () => {
    const source = readProjectFile("client/src/pages/WyrChallenge.tsx");

    expect(source).toContain("trpc.wyr.getChallenge.useQuery");
    expect(source).toContain("trpc.wyr.answer.useMutation");
    expect(source).toContain("data.partnerAnsweredCount");
    expect(source).toContain("trpc.wyr.computeCompatibility.useMutation");
    expect(source).toContain("Only the two matched members on this challenge");
  });

  it("offers private challenge navigation from both a match card and the existing solo-game mode switch", () => {
    const matches = readProjectFile("client/src/pages/Matches.tsx");
    const soloGame = readProjectFile("client/src/pages/WouldYouRather.tsx");

    expect(matches).toContain("trpc.wyr.sendChallenge.useMutation");
    expect(matches).toContain("navigate(`/wyr-challenge/${data.challenge.id}`)");
    expect(soloGame).toContain("Challenge a Match");
    expect(soloGame).toContain('navigate("/wyr-challenge")');
  });

  it("requires both participants to finish every shared question before compatibility can be stored", () => {
    const source = readProjectFile("server/routers.ts");

    expect(source).toContain("getWyrChallengeAnswerProgress");
    expect(source).toContain("PRECONDITION_FAILED");
    expect(source).toContain("Compatibility unlocks after both members answer every shared question.");
  });
});

import { describe, expect, it } from "vitest";
import {
  canRevealMeetMeProfile,
  getMeetMeEncounterBlockReason,
  getMeetMeGreetingMessage,
  getMeetMeStopReason,
  isMeetMeEventEligible,
  isMeetMeVenueAllowed,
  isSafeMeetMeIcebreaker,
  MEET_ME_BANNED_COPY_TERMS,
  MEET_ME_MAX_ENCOUNTERS_PER_SESSION,
  meetMeDayKey,
  meetMeVenueKey,
  pickMeetMeIcebreaker,
  pickMeetMeNudge,
} from "../shared/meetMePolicy";

const baseGate = {
  viewerUserId: 11,
  candidateUserId: 22,
  viewerActive: true,
  candidateActive: true,
  viewerVenueKey: "partner:1",
  candidateVenueKey: "partner:1",
  isBlocked: false,
  alreadyMetToday: false,
  encountersThisSession: 0,
  lastRevealAt: null,
  lastNudgeAt: null,
  now: new Date("2026-05-01T18:00:00Z"),
};

describe("Meet Me venue scoping", () => {
  it("namespaces a venue key so a partner and a gym with the same id never collide", () => {
    expect(meetMeVenueKey("partner", 1)).toBe("partner:1");
    expect(meetMeVenueKey("gym", 1)).toBe("gym:1");
    expect(meetMeVenueKey("partner", 1)).not.toBe(meetMeVenueKey("gym", 1));
  });

  it("rejects a venue without a real id", () => {
    expect(() => meetMeVenueKey("partner", 0)).toThrow();
    expect(() => meetMeVenueKey("partner", 1.5)).toThrow();
  });

  it("only admits a partner venue an administrator marked public access", () => {
    expect(isMeetMeVenueAllowed({ venueType: "partner", isActive: true, isPublicAccess: true, venueName: "Waukesha Public Library" })).toBe(true);
    expect(isMeetMeVenueAllowed({ venueType: "partner", isActive: true, isPublicAccess: false, venueName: "Waukesha Public Library" })).toBe(false);
    expect(isMeetMeVenueAllowed({ venueType: "partner", isActive: false, isPublicAccess: true, venueName: "Waukesha Public Library" })).toBe(false);
    expect(isMeetMeVenueAllowed({ venueType: "gym", isActive: true, venueName: "Crunch Fitness" })).toBe(true);
    expect(isMeetMeVenueAllowed({ venueType: "gym", isActive: true, venueName: "   " })).toBe(false);
  });

  it("keeps member-hosted events out of Meet Me so a house party is not a location", () => {
    const event = { eventDate: new Date("2026-05-01T18:00:00Z"), venueName: "Waukesha Public Library", source: "admin" };
    const now = new Date("2026-05-01T17:55:00Z");
    expect(isMeetMeEventEligible({ ...event, postedByUserId: null, now })).toBe(true);
    expect(isMeetMeEventEligible({ ...event, postedByUserId: 7, now })).toBe(false);
    expect(isMeetMeEventEligible({ ...event, postedByUserId: null, venueName: null, now })).toBe(false);
  });

  it("only opens an event check-in near the event's own clock", () => {
    const eventDate = new Date("2026-05-01T18:00:00Z");
    const venue = { venueName: "Waukesha Public Library", source: "admin", postedByUserId: null, eventDate };
    expect(isMeetMeEventEligible({ ...venue, now: new Date("2026-05-01T17:50:00Z") })).toBe(true);
    expect(isMeetMeEventEligible({ ...venue, now: new Date("2026-05-01T09:00:00Z") })).toBe(false);
    expect(isMeetMeEventEligible({ ...venue, now: new Date("2026-05-02T01:00:00Z") })).toBe(false);
  });

  it("uses one dedupe day per venue, not per poll", () => {
    expect(meetMeDayKey(new Date("2026-05-01T23:59:59Z"))).toBe("2026-05-01");
    expect(meetMeDayKey(new Date("2026-05-02T00:00:01Z"))).toBe("2026-05-02");
  });
});

describe("Meet Me session lifecycle", () => {
  it("expires a session without anyone having to close it", () => {
    const now = new Date("2026-05-01T18:00:00Z");
    expect(getMeetMeStopReason({ expiresAt: new Date("2026-05-01T18:01:00Z"), endedAt: null }, now)).toBeNull();
    expect(getMeetMeStopReason({ expiresAt: new Date("2026-05-01T17:59:00Z"), endedAt: null }, now)).toBe("expired");
    expect(getMeetMeStopReason({ expiresAt: new Date("2026-05-01T19:00:00Z"), endedAt: new Date("2026-05-01T17:50:00Z") }, now)).toBe("closed");
  });
});

describe("Meet Me encounter gate", () => {
  it("allows the minimal honest case", () => {
    expect(getMeetMeEncounterBlockReason(baseGate)).toBeNull();
  });

  it("never surfaces a member to themselves", () => {
    expect(getMeetMeEncounterBlockReason({ ...baseGate, candidateUserId: 11 })).toBe("self");
  });

  it("lets a block outrank every other consideration", () => {
    expect(getMeetMeEncounterBlockReason({ ...baseGate, isBlocked: true })).toBe("blocked");
    expect(getMeetMeEncounterBlockReason({ ...baseGate, isBlocked: true, alreadyMetToday: true })).toBe("blocked");
  });

  it("requires both sides to still be opted in at the same venue", () => {
    expect(getMeetMeEncounterBlockReason({ ...baseGate, viewerActive: false })).toBe("viewer_inactive");
    expect(getMeetMeEncounterBlockReason({ ...baseGate, candidateActive: false })).toBe("candidate_inactive");
    expect(getMeetMeEncounterBlockReason({ ...baseGate, candidateVenueKey: "gym:9" })).toBe("venue_mismatch");
  });

  it("does not re-surface the same pair at the same venue on the same day", () => {
    expect(getMeetMeEncounterBlockReason({ ...baseGate, alreadyMetToday: true })).toBe("already_met_today");
  });

  it("caps encounters per session so a member cannot farm faces by camping", () => {
    expect(getMeetMeEncounterBlockReason({ ...baseGate, encountersThisSession: MEET_ME_MAX_ENCOUNTERS_PER_SESSION - 1 })).toBeNull();
    expect(getMeetMeEncounterBlockReason({ ...baseGate, encountersThisSession: MEET_ME_MAX_ENCOUNTERS_PER_SESSION })).toBe("encounter_limit");
  });

  it("paces reveals and nudges", () => {
    expect(getMeetMeEncounterBlockReason({ ...baseGate, lastRevealAt: new Date("2026-05-01T17:58:00Z") })).toBe("reveal_cooldown");
    expect(getMeetMeEncounterBlockReason({ ...baseGate, lastRevealAt: new Date("2026-05-01T17:50:00Z") })).toBeNull();
    expect(getMeetMeEncounterBlockReason({ ...baseGate, lastNudgeAt: new Date("2026-05-01T17:55:00Z") })).toBe("nudge_cooldown");
    expect(getMeetMeEncounterBlockReason({ ...baseGate, lastNudgeAt: new Date("2026-05-01T17:40:00Z") })).toBeNull();
  });
});

describe("Meet Me reveal bar", () => {
  it("requires a face photo, a started profile, and no open report", () => {
    expect(canRevealMeetMeProfile({ hasPrimaryPhoto: true, profileScore: 100, hasActiveReportAgainst: false })).toBe(true);
    expect(canRevealMeetMeProfile({ hasPrimaryPhoto: false, profileScore: 100, hasActiveReportAgainst: false })).toBe(false);
    expect(canRevealMeetMeProfile({ hasPrimaryPhoto: true, profileScore: 0, hasActiveReportAgainst: false })).toBe(false);
    expect(canRevealMeetMeProfile({ hasPrimaryPhoto: true, profileScore: 100, hasActiveReportAgainst: true })).toBe(false);
  });
});

describe("Meet Me copy", () => {
  it("never describes appearance or gender when naming a nearby member", () => {
    const banned = MEET_ME_BANNED_COPY_TERMS as readonly string[];
    for (const variant of [0, 1, 2, 3, 4, 5]) {
      for (const isFirstEver of [false, true]) {
        const text = pickMeetMeNudge({ displayName: "Mike", venueName: "Waukesha Public Library", variant, isFirstEver }).toLowerCase();
        for (const term of banned) {
          expect(text).not.toContain(term);
        }
        expect(text).toContain("waukesha public library");
      }
    }
  });

  it("never tells the greeted member who said hi until they open it", () => {
    const message = getMeetMeGreetingMessage({ venueName: "Crunch Fitness" });
    expect(message).toContain("Crunch Fitness");
    expect(message).not.toMatch(/\bMike\b/);
    expect(message.toLowerCase()).toContain("someone");
  });

  it("keeps the deterministic icebreaker free of banned terms", () => {
    for (const variant of [0, 1, 2, 3]) {
      const text = pickMeetMeIcebreaker({ venueName: "Waukesha Public Library", variant }).toLowerCase();
      for (const term of MEET_ME_BANNED_COPY_TERMS) {
        expect(text).not.toContain(term);
      }
    }
  });

  it("rejects a generated icebreaker that names a third party or describes appearance", () => {
    expect(isSafeMeetMeIcebreaker("Say hello to Mike, you're both at the library.", "Mike")).toBe(true);
    expect(isSafeMeetMeIcebreaker("Ask Sarah to introduce you two.", "Mike")).toBe(false);
    expect(isSafeMeetMeIcebreaker("Go talk to the cute guy by the door.", "Mike")).toBe(false);
    expect(isSafeMeetMeIcebreaker("Hi.", "Mike")).toBe(false);
  });
});

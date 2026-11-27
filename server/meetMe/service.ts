import { and, desc, eq, gt, inArray, isNull, ne, or, sql } from "drizzle-orm";
import {
  blocks,
  communityEvents,
  gyms,
  meetMeEncounters,
  meetMeNudges,
  meetMeSessions,
  profilePhotos,
  reports,
  users,
  userProfiles,
  venuePartners,
} from "../../drizzle/schema";
import {
  canRevealMeetMeProfile,
  getMeetMeEncounterBlockReason,
  getMeetMeGreetingMessage,
  getMeetMeSessionTtl,
  isMeetMeEventEligible,
  isMeetMeVenueAllowed,
  isSafeMeetMeIcebreaker,
  meetMeDayKey,
  meetMeVenueKey,
  MEET_ME_ENCOUNTER_TTL_MS,
  pickMeetMeIcebreaker,
  pickMeetMeNudge,
  type MeetMeVenueType,
} from "../../shared/meetMePolicy";
import { getProfileCompleteness } from "../../shared/profileCompleteness";
import { getDb, blockUser, createReport, getProfileByUserId, isBlockInEffect } from "../db";
import { storageGetSignedUrl } from "../storage";
import { invokeLLM } from "../_core/llm";

/** Bounded candidate scan keeps poll cheap even at a busy venue. */
const MAX_CANDIDATES = 12;

export type MeetMeSessionView = {
  id: number;
  venueType: MeetMeVenueType;
  venueId: number;
  venueKey: string;
  venueName: string;
  startedAt: Date;
  expiresAt: Date;
};

export type MeetMeState = {
  enabled: boolean;
  session: MeetMeSessionView | null;
  nearbyCount: number;
  prompt: { encounterId: number; text: string; venueName: string } | null;
  greeting: { nudgeId: number; encounterId: number; text: string } | null;
  canBeRevealed: boolean;
  revealBlocker: "no_photo" | "profile_incomplete" | "reported" | null;
};

export function isMeetMeEnabled(): boolean {
  const value = (process.env.MEET_ME_ENABLED ?? "").trim().toLowerCase();
  return value === "true" || value === "1" || value === "yes";
}

function unavailable(): never {
  throw new Error("Meet Me is unavailable right now.");
}

// ─── Venue resolution ─────────────────────────────────────────────────────────

export type ResolvedMeetMeVenue = {
  venueType: MeetMeVenueType;
  venueId: number;
  venueKey: string;
  venueName: string;
};

/**
 * Resolves a venue the member tapped. The only inputs are a type and an id from our
 * own catalogue — no address and no coordinate can reach this function. A venue that
 * is not already a named public place is rejected here, which is what keeps a home
 * address out of the feature entirely.
 */
export async function resolveMeetMeVenue(venueType: MeetMeVenueType, venueId: number): Promise<ResolvedMeetMeVenue> {
  const db = await getDb();
  if (!db) unavailable();

  const build = (venueName: string): ResolvedMeetMeVenue => ({
    venueType,
    venueId,
    venueKey: meetMeVenueKey(venueType, venueId),
    venueName: venueName.trim().slice(0, 200),
  });

  if (venueType === "partner") {
    const [row] = await db
      .select({ name: venuePartners.name, isPublicAccess: venuePartners.isPublicAccess, isActive: venuePartners.isActive })
      .from(venuePartners)
      .where(eq(venuePartners.id, venueId))
      .limit(1);
    if (!row) throw new Error("That venue could not be found.");
    if (!isMeetMeVenueAllowed({ venueType, isActive: row.isActive, isPublicAccess: row.isPublicAccess, venueName: row.name })) {
      throw new Error("Meet Me only works at public places. Choose a public venue.");
    }
    return build(row.name);
  }

  if (venueType === "gym") {
    const [row] = await db.select({ name: gyms.name }).from(gyms).where(eq(gyms.id, venueId)).limit(1);
    if (!row) throw new Error("That gym could not be found.");
    if (!isMeetMeVenueAllowed({ venueType, isActive: true, venueName: row.name })) {
      throw new Error("Meet Me only works at public places. Choose a public venue.");
    }
    return build(row.name);
  }

  const [event] = await db
    .select({
      venueName: communityEvents.venueName,
      eventDate: communityEvents.eventDate,
      isActive: communityEvents.isActive,
      postedByUserId: communityEvents.postedByUserId,
      source: communityEvents.source,
    })
    .from(communityEvents)
    .where(eq(communityEvents.id, venueId))
    .limit(1);
  if (!event) throw new Error("That event could not be found.");
  if (!event.isActive) throw new Error("That event is no longer listed.");
  if (!isMeetMeEventEligible({
    source: event.source,
    postedByUserId: event.postedByUserId,
    venueName: event.venueName,
    eventDate: new Date(event.eventDate),
  })) {
    throw new Error("Meet Me opens near an event's own start time, and only for events published by a public source.");
  }
  return build(event.venueName ?? "");
}

// ─── Session lifecycle ────────────────────────────────────────────────────────

export type MeetMeVenueOption = {
  venueType: MeetMeVenueType;
  venueId: number;
  name: string;
  city: string | null;
};

/** The only places a member can check in to: named, public, already in our data. */
export async function listMeetMeVenues(city?: string): Promise<MeetMeVenueOption[]> {
  const db = await getDb();
  if (!db) return [];
  const trimmedCity = city?.trim();

  const partnerWhere = and(
    eq(venuePartners.isPublicAccess, true),
    eq(venuePartners.isActive, true),
    ...(trimmedCity ? [eq(venuePartners.city, trimmedCity)] : []),
  );

  const [partners, gymRows] = await Promise.all([
    db
      .select({ id: venuePartners.id, name: venuePartners.name, city: venuePartners.city })
      .from(venuePartners)
      .where(partnerWhere)
      .orderBy(venuePartners.name)
      .limit(12),
    db
      .select({ id: gyms.id, name: gyms.name, city: gyms.city })
      .from(gyms)
      .where(trimmedCity ? eq(gyms.city, trimmedCity) : undefined)
      .orderBy(gyms.name)
      .limit(12),
  ]);

  return [
    ...partners.map((row) => ({ venueType: "partner" as const, venueId: row.id, name: row.name, city: row.city ?? null })),
    ...gymRows.map((row) => ({ venueType: "gym" as const, venueId: row.id, name: row.name, city: row.city ?? null })),
  ].sort((left, right) => left.name.localeCompare(right.name));
}

function toSessionView(row: typeof meetMeSessions.$inferSelect): MeetMeSessionView {
  return {
    id: row.id,
    venueType: row.venueType,
    venueId: row.venueId,
    venueKey: row.venueKey,
    venueName: row.venueName,
    startedAt: row.startedAt,
    expiresAt: row.expiresAt,
  };
}

async function loadActiveSession(userId: number): Promise<MeetMeSessionView | null> {
  const db = await getDb();
  if (!db) return null;
  const now = new Date();
  const [row] = await db
    .select()
    .from(meetMeSessions)
    .where(and(eq(meetMeSessions.userId, userId), isNull(meetMeSessions.endedAt), gt(meetMeSessions.expiresAt, now)))
    .orderBy(desc(meetMeSessions.startedAt))
    .limit(1);
  return row ? toSessionView(row) : null;
}

async function requireActiveSession(userId: number, sessionId: number): Promise<MeetMeSessionView> {
  const session = await loadActiveSession(userId);
  if (!session || session.id !== sessionId) {
    throw new Error("Your Meet Me session has ended. Turn it on again to see who is nearby.");
  }
  return session;
}

/**
 * Starts presence at one public venue. Any previous session is closed rather than
 * stacked, so a member can only ever be visible in one place at a time.
 */
export async function startMeetMeSession(
  userId: number,
  venueType: MeetMeVenueType,
  venueId: number,
): Promise<MeetMeSessionView> {
  const db = await getDb();
  if (!db) unavailable();
  const venue = await resolveMeetMeVenue(venueType, venueId);
  const now = new Date();

  await db
    .update(meetMeSessions)
    .set({ endedAt: now, endReason: "superseded" })
    .where(and(eq(meetMeSessions.userId, userId), isNull(meetMeSessions.endedAt)));

  const { startedAt, expiresAt } = getMeetMeSessionTtl(now);
  await db.insert(meetMeSessions).values({
    userId,
    venueType: venue.venueType,
    venueId: venue.venueId,
    venueKey: venue.venueKey,
    venueName: venue.venueName,
    startedAt,
    expiresAt,
  });

  const [row] = await db
    .select()
    .from(meetMeSessions)
    .where(and(eq(meetMeSessions.userId, userId), isNull(meetMeSessions.endedAt)))
    .orderBy(desc(meetMeSessions.startedAt))
    .limit(1);
  if (!row) unavailable();
  return toSessionView(row);
}

/**
 * Toggling off deletes the member's visibility immediately and withdraws any prompt
 * already sitting on the other side of a pair.
 */
export async function stopMeetMeSession(userId: number, sessionId: number): Promise<{ ended: true }> {
  const db = await getDb();
  if (!db) unavailable();
  const now = new Date();

  const [session] = await db
    .select()
    .from(meetMeSessions)
    .where(and(eq(meetMeSessions.id, sessionId), eq(meetMeSessions.userId, userId), isNull(meetMeSessions.endedAt)))
    .limit(1);
  if (!session) return { ended: true };

  await db
    .update(meetMeSessions)
    .set({ endedAt: now, endReason: "manual" })
    .where(eq(meetMeSessions.id, sessionId));

  await db
    .update(meetMeEncounters)
    .set({ status: "expired" })
    .where(and(
      eq(meetMeEncounters.venueKey, session.venueKey),
      eq(meetMeEncounters.status, "pending"),
      or(eq(meetMeEncounters.lowerUserId, userId), eq(meetMeEncounters.higherUserId, userId)),
    ));

  return { ended: true };
}

// ─── Reveal eligibility ───────────────────────────────────────────────────────

type RevealFacts = { hasPrimaryPhoto: boolean; profileScore: number; hasActiveReportAgainst: boolean };

async function loadRevealFacts(userIds: number[]): Promise<Map<number, RevealFacts>> {
  const facts = new Map<number, RevealFacts>();
  const db = await getDb();
  if (!db || userIds.length === 0) return facts;

  const [profiles, photos, openReports] = await Promise.all([
    db
      .select({
        userId: userProfiles.userId,
        bio: userProfiles.bio,
        city: userProfiles.city,
        interviewCount: userProfiles.interviewCount,
        traits: userProfiles.traits,
      })
      .from(userProfiles)
      .where(inArray(userProfiles.userId, userIds)),
    db
      .select({ userId: profilePhotos.userId })
      .from(profilePhotos)
      .where(inArray(profilePhotos.userId, userIds))
      .groupBy(profilePhotos.userId),
    db
      .select({ reportedUserId: reports.reportedUserId })
      .from(reports)
      .where(and(inArray(reports.reportedUserId, userIds), eq(reports.status, "pending")))
      .groupBy(reports.reportedUserId),
  ]);

  const profileByUser = new Map(profiles.map((profile) => [profile.userId, profile]));
  const withPhoto = new Set(photos.map((photo) => photo.userId));
  const reported = new Set(openReports.map((report) => report.reportedUserId));

  for (const userId of userIds) {
    const profile = profileByUser.get(userId);
    facts.set(userId, {
      hasPrimaryPhoto: withPhoto.has(userId),
      profileScore: getProfileCompleteness({
        bio: profile?.bio,
        aiSummary: profile?.traits?.aiSummary,
        city: profile?.city,
        interviewCount: profile?.interviewCount,
      }).score,
      hasActiveReportAgainst: reported.has(userId),
    });
  }
  return facts;
}

function revealBlockerFor(facts: RevealFacts | undefined): MeetMeState["revealBlocker"] {
  if (!facts) return "profile_incomplete";
  if (facts.hasActiveReportAgainst) return "reported";
  if (!facts.hasPrimaryPhoto) return "no_photo";
  if (!canRevealMeetMeProfile(facts)) return "profile_incomplete";
  return null;
}

// ─── Nearby scan ──────────────────────────────────────────────────────────────

type Candidate = { userId: number; startedAt: Date };

async function findCandidates(session: MeetMeSessionView, viewerUserId: number): Promise<Candidate[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({ userId: meetMeSessions.userId, startedAt: meetMeSessions.startedAt })
    .from(meetMeSessions)
    .where(and(
      eq(meetMeSessions.venueKey, session.venueKey),
      isNull(meetMeSessions.endedAt),
      gt(meetMeSessions.expiresAt, new Date()),
      ne(meetMeSessions.userId, viewerUserId),
    ))
    .orderBy(meetMeSessions.startedAt)
    .limit(MAX_CANDIDATES);
  return rows.map((row) => ({ userId: row.userId, startedAt: row.startedAt }));
}

async function countNearby(session: MeetMeSessionView, viewerUserId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(meetMeSessions)
    .where(and(
      eq(meetMeSessions.venueKey, session.venueKey),
      isNull(meetMeSessions.endedAt),
      gt(meetMeSessions.expiresAt, new Date()),
      ne(meetMeSessions.userId, viewerUserId),
    ));
  return Number(row?.count ?? 0);
}

async function findPendingEncounter(userId: number, venueKey: string) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db
    .select()
    .from(meetMeEncounters)
    .where(and(
      eq(meetMeEncounters.venueKey, venueKey),
      eq(meetMeEncounters.status, "pending"),
      gt(meetMeEncounters.expiresAt, new Date()),
      or(eq(meetMeEncounters.lowerUserId, userId), eq(meetMeEncounters.higherUserId, userId)),
    ))
    .orderBy(meetMeEncounters.surfacedAt)
    .limit(1);
  return row ?? null;
}

async function findUnseenGreeting(userId: number, since: Date) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db
    .select({ id: meetMeNudges.id, encounterId: meetMeNudges.encounterId, promptText: meetMeNudges.promptText })
    .from(meetMeNudges)
    .where(and(
      eq(meetMeNudges.userId, userId),
      eq(meetMeNudges.kind, "greeting"),
      isNull(meetMeNudges.seenAt),
      gt(meetMeNudges.createdAt, since),
    ))
    .orderBy(desc(meetMeNudges.createdAt))
    .limit(1);
  return row ? { nudgeId: row.id, encounterId: row.encounterId, text: row.promptText } : null;
}

async function findNudgeText(userId: number, encounterId: number): Promise<string> {
  const db = await getDb();
  if (!db) return "";
  const [row] = await db
    .select({ promptText: meetMeNudges.promptText })
    .from(meetMeNudges)
    .where(and(eq(meetMeNudges.userId, userId), eq(meetMeNudges.encounterId, encounterId), eq(meetMeNudges.kind, "nudge")))
    .orderBy(desc(meetMeNudges.createdAt))
    .limit(1);
  return row?.promptText ?? "";
}

// ─── State and polling ────────────────────────────────────────────────────────

export async function getMeetMeState(userId: number): Promise<MeetMeState> {
  const enabled = isMeetMeEnabled();
  const facts = (await loadRevealFacts([userId])).get(userId);
  const revealBlocker = revealBlockerFor(facts);
  const canBeRevealed = revealBlocker === null;
  const session = await loadActiveSession(userId);

  if (!session) {
    return { enabled, session: null, nearbyCount: 0, prompt: null, greeting: null, canBeRevealed, revealBlocker };
  }

  const [nearbyCount, pending, greeting] = await Promise.all([
    countNearby(session, userId),
    findPendingEncounter(userId, session.venueKey),
    findUnseenGreeting(userId, session.startedAt),
  ]);

  const prompt = pending
    ? {
      encounterId: pending.id,
      text: await findNudgeText(userId, pending.id),
      venueName: pending.venueName,
    }
    : null;

  return { enabled, session, nearbyCount, prompt, greeting, canBeRevealed, revealBlocker };
}

/**
 * The heartbeat. Returns counts and at most one prompt; it never returns a photo.
 * A reveal is created here only when both members are opted in at the same public
 * venue and every gate in the policy module passes.
 */
export async function pollMeetMe(userId: number, sessionId: number): Promise<MeetMeState> {
  const db = await getDb();
  if (!db) unavailable();
  const session = await requireActiveSession(userId, sessionId);
  const state = await getMeetMeState(userId);
  if (!state.canBeRevealed) return state;

  const existing = await findPendingEncounter(userId, session.venueKey);
  if (existing) return state;

  const candidates = await findCandidates(session, userId);
  if (candidates.length === 0) return state;

  const candidateIds = candidates.map((candidate) => candidate.userId);
  const now = new Date();
  const today = meetMeDayKey(now);

  const [blockRows, metTodayRows, lastRevealRow, lastNudgeRow, sessionEncounterRow, candidateFacts] = await Promise.all([
    db
      .select({ blockerId: blocks.blockerId, blockedUserId: blocks.blockedUserId })
      .from(blocks)
      .where(or(
        and(eq(blocks.blockerId, userId), inArray(blocks.blockedUserId, candidateIds)),
        and(eq(blocks.blockedUserId, userId), inArray(blocks.blockerId, candidateIds)),
      )),
    db
      .select({ lowerUserId: meetMeEncounters.lowerUserId, higherUserId: meetMeEncounters.higherUserId })
      .from(meetMeEncounters)
      .where(and(
        eq(meetMeEncounters.dayKey, today),
        or(eq(meetMeEncounters.lowerUserId, userId), eq(meetMeEncounters.higherUserId, userId)),
      )),
    db
      .select({ surfacedAt: meetMeEncounters.surfacedAt })
      .from(meetMeEncounters)
      .where(and(eq(meetMeEncounters.dayKey, today), or(eq(meetMeEncounters.lowerUserId, userId), eq(meetMeEncounters.higherUserId, userId))))
      .orderBy(desc(meetMeEncounters.surfacedAt))
      .limit(1),
    db
      .select({ createdAt: meetMeNudges.createdAt })
      .from(meetMeNudges)
      .where(eq(meetMeNudges.userId, userId))
      .orderBy(desc(meetMeNudges.createdAt))
      .limit(1),
    db
      .select({ id: meetMeEncounters.id })
      .from(meetMeEncounters)
      .where(and(
        eq(meetMeEncounters.dayKey, today),
        gt(meetMeEncounters.surfacedAt, session.startedAt),
        or(eq(meetMeEncounters.lowerUserId, userId), eq(meetMeEncounters.higherUserId, userId)),
      )),
    loadRevealFacts(candidateIds),
  ]);

  const blocked = new Set<number>();
  for (const row of blockRows) {
    blocked.add(row.blockerId === userId ? row.blockedUserId : row.blockerId);
  }
  const metToday = new Set<number>();
  for (const row of metTodayRows) {
    metToday.add(row.lowerUserId === userId ? row.higherUserId : row.lowerUserId);
  }

  const encountersThisSession = sessionEncounterRow.length;
  const lastRevealAt = lastRevealRow[0]?.surfacedAt ?? null;
  const lastNudgeAt = lastNudgeRow[0]?.createdAt ?? null;

  for (const candidate of candidates) {
    const blockReason = getMeetMeEncounterBlockReason({
      viewerUserId: userId,
      candidateUserId: candidate.userId,
      viewerActive: true,
      candidateActive: true,
      viewerVenueKey: session.venueKey,
      candidateVenueKey: session.venueKey,
      isBlocked: blocked.has(candidate.userId),
      alreadyMetToday: metToday.has(candidate.userId),
      encountersThisSession,
      lastRevealAt,
      lastNudgeAt,
      now,
    });
    if (blockReason) continue;
    if (revealBlockerFor(candidateFacts.get(candidate.userId)) !== null) continue;

    const [lowerUserId, higherUserId] = userId < candidate.userId
      ? [userId, candidate.userId]
      : [candidate.userId, userId];

    try {
      await db.insert(meetMeEncounters).values({
        lowerUserId,
        higherUserId,
        venueKey: session.venueKey,
        venueName: session.venueName,
        dayKey: today,
        status: "pending",
        expiresAt: new Date(now.getTime() + MEET_ME_ENCOUNTER_TTL_MS),
      });
    } catch {
      // The pair/day uniqueness boundary already exists (concurrent poll or a
      // duplicate surface). That is a normal race, not a failure.
      continue;
    }

    const [encounter] = await db
      .select({ id: meetMeEncounters.id })
      .from(meetMeEncounters)
      .where(and(
        eq(meetMeEncounters.lowerUserId, lowerUserId),
        eq(meetMeEncounters.higherUserId, higherUserId),
        eq(meetMeEncounters.venueKey, session.venueKey),
        eq(meetMeEncounters.dayKey, today),
      ))
      .limit(1);
    if (!encounter) continue;

    const [profile] = await db
      .select({ displayName: userProfiles.displayName })
      .from(userProfiles)
      .where(eq(userProfiles.userId, candidate.userId))
      .limit(1);

    const text = pickMeetMeNudge({
      displayName: profile?.displayName?.trim() || "Someone",
      venueName: session.venueName,
      variant: encounter.id,
      isFirstEver: lastNudgeAt === null,
    });

    await db.insert(meetMeNudges).values({
      userId,
      encounterId: encounter.id,
      kind: "nudge",
      promptText: text.slice(0, 240),
    });

    return {
      ...state,
      prompt: { encounterId: encounter.id, text, venueName: session.venueName },
    };
  }

  return state;
}

// ─── Encounter actions ────────────────────────────────────────────────────────

async function loadEncounterForUser(userId: number, encounterId: number) {
  const db = await getDb();
  if (!db) unavailable();
  const [encounter] = await db
    .select()
    .from(meetMeEncounters)
    .where(eq(meetMeEncounters.id, encounterId))
    .limit(1);
  if (!encounter) throw new Error("That introduction is no longer available.");
  if (encounter.lowerUserId !== userId && encounter.higherUserId !== userId) {
    throw new Error("That introduction is no longer available.");
  }
  return encounter;
}

function otherMember(encounter: { lowerUserId: number; higherUserId: number }, userId: number): number {
  return encounter.lowerUserId === userId ? encounter.higherUserId : encounter.lowerUserId;
}

async function signPhoto(s3Key: string, fallbackUrl: string): Promise<string> {
  try {
    const signed = await storageGetSignedUrl(s3Key);
    if (signed) return signed;
  } catch {
    // Storage presigning is optional; the stored URL remains readable.
  }
  return fallbackUrl;
}

/**
 * Opening a prompt is the only call that returns a face. The other member is never
 * told that their profile was viewed — only an explicit `greet` is visible to them.
 */
export async function openMeetMeEncounter(userId: number, encounterId: number) {
  const db = await getDb();
  if (!db) unavailable();
  const encounter = await loadEncounterForUser(userId, encounterId);
  if (encounter.status === "dismissed" || encounter.status === "expired" || encounter.status === "reported") {
    throw new Error("That introduction is no longer available.");
  }
  if (encounter.expiresAt.getTime() <= Date.now()) {
    await db.update(meetMeEncounters).set({ status: "expired" }).where(eq(meetMeEncounters.id, encounterId));
    throw new Error("That introduction has expired. Turn Meet Me on again to see who is nearby.");
  }

  const otherUserId = otherMember(encounter, userId);
  if (await isBlockInEffect(userId, otherUserId)) {
    throw new Error("That introduction is no longer available.");
  }

  const [photo] = await db
    .select({ s3Key: profilePhotos.s3Key, url: profilePhotos.url })
    .from(profilePhotos)
    .where(eq(profilePhotos.userId, otherUserId))
    .orderBy(desc(profilePhotos.isPrimary), desc(profilePhotos.createdAt))
    .limit(1);
  if (!photo) throw new Error("This member does not have a face photo yet.");

  const profile = await getProfileByUserId(otherUserId);
  const [account] = await db.select({ name: users.name }).from(users).where(eq(users.id, otherUserId)).limit(1);
  const displayName = profile?.displayName?.trim() || account?.name?.trim() || "Someone nearby";

  if (encounter.status === "pending") {
    await db.update(meetMeEncounters).set({ status: "opened", openedAt: new Date() }).where(eq(meetMeEncounters.id, encounterId));
  }

  return {
    encounterId,
    displayName,
    venueName: encounter.venueName,
    photoUrl: await signPhoto(photo.s3Key, photo.url),
    icebreaker: encounter.icebreaker ?? pickMeetMeIcebreaker({ venueName: encounter.venueName, variant: encounterId }),
  };
}

/** A one-shot doorbell. It is not a conversation and creates no chat thread. */
export async function greetMeetMeEncounter(userId: number, encounterId: number) {
  const db = await getDb();
  if (!db) unavailable();
  const encounter = await loadEncounterForUser(userId, encounterId);
  if (encounter.status === "dismissed" || encounter.status === "expired" || encounter.status === "reported") {
    throw new Error("That introduction is no longer available.");
  }
  const otherUserId = otherMember(encounter, userId);
  if (await isBlockInEffect(userId, otherUserId)) {
    throw new Error("That introduction is no longer available.");
  }
  if (encounter.status === "greeted") return { greeted: true };

  const venueName = encounter.venueName;

  await db
    .update(meetMeEncounters)
    .set({ status: "greeted", greetedAt: new Date() })
    .where(eq(meetMeEncounters.id, encounterId));

  // The recipient learns that somebody said hi, never who, until they open it.
  await db.insert(meetMeNudges).values({
    userId: otherUserId,
    encounterId,
    kind: "greeting",
    promptText: getMeetMeGreetingMessage({ venueName }).slice(0, 240),
  });

  return { greeted: true };
}

export async function dismissMeetMeEncounter(userId: number, encounterId: number) {
  const db = await getDb();
  if (!db) unavailable();
  await loadEncounterForUser(userId, encounterId);
  await db.update(meetMeEncounters).set({ status: "dismissed" }).where(eq(meetMeEncounters.id, encounterId));
  return { dismissed: true };
}

export async function acknowledgeMeetMeGreeting(userId: number, nudgeId: number) {
  const db = await getDb();
  if (!db) unavailable();
  await db
    .update(meetMeNudges)
    .set({ seenAt: new Date() })
    .where(and(eq(meetMeNudges.id, nudgeId), eq(meetMeNudges.userId, userId)));
  return { acknowledged: true };
}

export async function reportMeetMeEncounter(
  userId: number,
  encounterId: number,
  reason: "scammer" | "bot" | "harassment" | "fake_profile" | "inappropriate" | "other",
) {
  const db = await getDb();
  if (!db) unavailable();
  const encounter = await loadEncounterForUser(userId, encounterId);
  const otherUserId = otherMember(encounter, userId);
  await createReport(userId, otherUserId, reason, "Reported from a Meet Me in-person introduction.");
  await db.update(meetMeEncounters).set({ status: "reported" }).where(eq(meetMeEncounters.id, encounterId));
  return { reported: true };
}

export async function blockMeetMeEncounter(userId: number, encounterId: number) {
  const db = await getDb();
  if (!db) unavailable();
  const encounter = await loadEncounterForUser(userId, encounterId);
  await blockUser(userId, otherMember(encounter, userId));
  await db.update(meetMeEncounters).set({ status: "dismissed" }).where(eq(meetMeEncounters.id, encounterId));
  return { blocked: true };
}

/**
 * Optional personalised line, generated after the face is already on screen so it
 * never delays the moment two people are standing near each other. Any output that
 * is too long, describes appearance, or names a third party is discarded in favour
 * of the deterministic template.
 */
export async function generateMeetMeIcebreaker(userId: number, encounterId: number) {
  const db = await getDb();
  if (!db) unavailable();
  const encounter = await loadEncounterForUser(userId, encounterId);
  if (encounter.icebreaker) return { icebreaker: encounter.icebreaker };

  const otherUserId = otherMember(encounter, userId);
  const profile = await getProfileByUserId(otherUserId);
  const displayName = profile?.displayName?.trim() || "this member";
  const traits = profile?.traits;
  const hobbies = traits?.hobbies;
  const activities = traits?.favoriteActivities;
  const interests = [
    ...(Array.isArray(hobbies) ? hobbies : []),
    ...(Array.isArray(activities) ? activities : []),
  ].filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0).slice(0, 4).join(", ");
  const fallback = pickMeetMeIcebreaker({ venueName: encounter.venueName, variant: encounterId });

  let candidate = fallback;
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: [
            "You write one warm, plain icebreaker for two adults who are both at the same public place right now and have opted in to meeting.",
            "Rules: at most two short sentences. Never describe anyone's appearance, age, gender, or ethnicity. Never mention anyone except the named person. No hype, no emoji, no pressure, no mention of dating.",
          ].join(" "),
        },
        {
          role: "user",
          content: `Place: a public venue. Person to introduce: ${displayName}. Stated interests: ${interests || "none shared"}.`,
        },
      ],
      maxTokens: 90,
    });
    const content = response.choices?.[0]?.message?.content;
    const text = typeof content === "string" ? content.trim() : "";
    if (text && isSafeMeetMeIcebreaker(text, displayName)) candidate = text.slice(0, 240);
  } catch {
    // Model unavailable: the deterministic line is already good enough.
  }

  await db.update(meetMeEncounters).set({ icebreaker: candidate }).where(eq(meetMeEncounters.id, encounterId));
  return { icebreaker: candidate };
}

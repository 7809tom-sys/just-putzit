/**
 * Meet Me — ephemeral, venue-scoped presence for in-person introductions.
 *
 * The privacy promise of this feature is structural, not statistical: a session can
 * only attach to a venue that is already a public place in our own data, and no
 * coordinate is accepted or stored anywhere in this module. Two members are
 * therefore only ever visible to each other inside a place we can name in public.
 *
 * Nothing here talks to the database or the network. Every gate is a pure function
 * so it can be unit tested without a MySQL instance.
 */

export type MeetMeVenueType = "partner" | "gym" | "event";

export const MEET_ME_VENUE_TYPES = ["partner", "gym", "event"] as const;

/** A session dies on its own; there is no silent renewal. */
export const MEET_ME_DEFAULT_TTL_MS = 90 * 60 * 1000;
export const MEET_ME_MAX_TTL_MS = 4 * 60 * 60 * 1000;

/** An unopened prompt fades instead of lingering. */
export const MEET_ME_ENCOUNTER_TTL_MS = 20 * 60 * 1000;

/** Anti-farming: a member cannot camp a venue to collect faces. */
export const MEET_ME_MAX_ENCOUNTERS_PER_SESSION = 6;
export const MEET_ME_REVEAL_COOLDOWN_MS = 5 * 60 * 1000;
export const MEET_ME_NUDGE_MIN_GAP_MS = 10 * 60 * 1000;

/** Event check-in stays close to the event's own clock. */
export const MEET_ME_EVENT_OPEN_BEFORE_MS = 6 * 60 * 60 * 1000;
export const MEET_ME_EVENT_CLOSE_AFTER_MS = 4 * 60 * 60 * 1000;

/**
 * A member must have a face and at least one of the three profile-completeness
 * items before either side can be revealed. Revealing a face to a stranger is the
 * highest-risk surface in the product, so the bar is deliberately non-zero.
 */
export const MEET_ME_MIN_PROFILE_SCORE = 34;

export function meetMeVenueKey(venueType: MeetMeVenueType, venueId: number): string {
  if (!Number.isInteger(venueId) || venueId < 1) {
    throw new Error("Meet Me needs a real venue before a session can start");
  }
  return `${venueType}:${venueId}`;
}

/** Venue-local calendar day, used to dedupe one pair to one encounter per day. */
export function meetMeDayKey(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function getMeetMeStopReason(
  session: { expiresAt: Date; endedAt: Date | null },
  now: Date = new Date(),
): "closed" | "expired" | null {
  if (session.endedAt) return "closed";
  if (session.expiresAt.getTime() <= now.getTime()) return "expired";
  return null;
}

export function getMeetMeSessionTtl(now: Date = new Date()): { startedAt: Date; expiresAt: Date } {
  return {
    startedAt: now,
    expiresAt: new Date(now.getTime() + MEET_ME_DEFAULT_TTL_MS),
  };
}

export function isMeetMeSessionOverBudget(startedAt: Date, now: Date = new Date()): boolean {
  return now.getTime() - startedAt.getTime() >= MEET_ME_MAX_TTL_MS;
}

// ─── Venue eligibility ────────────────────────────────────────────────────────
export type MeetMeVenueCandidate = {
  venueType: MeetMeVenueType;
  isActive: boolean;
  /** venue_partners.is_public_access — the flag that makes a partner venue eligible. */
  isPublicAccess?: boolean;
  /** A named place is mandatory; an unnamed venue cannot be a public meeting point. */
  venueName?: string | null;
};

/**
 * Partner venues must have been marked public-access by an administrator. Gyms are
 * commercial public facilities by definition. Events are public when a trusted
 * source published them and they name a venue — member-hosted posts are excluded so
 * a house party can never become a Meet Me location.
 */
export function isMeetMeVenueAllowed(candidate: MeetMeVenueCandidate): boolean {
  if (!candidate.isActive) return false;
  if (!candidate.venueName?.trim()) return false;
  if (candidate.venueType === "partner") return candidate.isPublicAccess === true;
  return true;
}

export function isMeetMeEventEligible(input: {
  source: string;
  postedByUserId?: number | null;
  venueName?: string | null;
  eventDate: Date;
  now?: Date;
}): boolean {
  if (!input.venueName?.trim()) return false;
  if (input.postedByUserId) return false;
  const now = input.now ?? new Date();
  const start = input.eventDate.getTime();
  if (Number.isNaN(start)) return false;
  return now.getTime() >= start - MEET_ME_EVENT_OPEN_BEFORE_MS
    && now.getTime() <= start + MEET_ME_EVENT_CLOSE_AFTER_MS;
}

// ─── Encounter gate ───────────────────────────────────────────────────────────

export type MeetMeBlockReason =
  | "self"
  | "blocked"
  | "viewer_inactive"
  | "candidate_inactive"
  | "venue_mismatch"
  | "already_met_today"
  | "encounter_limit"
  | "reveal_cooldown"
  | "nudge_cooldown";

export type MeetMeEncounterGate = {
  viewerUserId: number;
  candidateUserId: number;
  viewerActive: boolean;
  candidateActive: boolean;
  viewerVenueKey: string;
  candidateVenueKey: string;
  isBlocked: boolean;
  alreadyMetToday: boolean;
  encountersThisSession: number;
  lastRevealAt?: Date | null;
  lastNudgeAt?: Date | null;
  now?: Date;
};

/**
 * Returns null when a prompt may be created for this pair, otherwise the first
 * reason it may not. Order is deliberate: safety outranks pacing.
 */
export function getMeetMeEncounterBlockReason(input: MeetMeEncounterGate): MeetMeBlockReason | null {
  if (input.viewerUserId === input.candidateUserId) return "self";
  if (input.isBlocked) return "blocked";
  if (!input.viewerActive) return "viewer_inactive";
  if (!input.candidateActive) return "candidate_inactive";
  if (input.viewerVenueKey !== input.candidateVenueKey) return "venue_mismatch";
  if (input.alreadyMetToday) return "already_met_today";
  if (input.encountersThisSession >= MEET_ME_MAX_ENCOUNTERS_PER_SESSION) return "encounter_limit";

  const now = (input.now ?? new Date()).getTime();
  if (input.lastRevealAt && now - input.lastRevealAt.getTime() < MEET_ME_REVEAL_COOLDOWN_MS) {
    return "reveal_cooldown";
  }
  if (input.lastNudgeAt && now - input.lastNudgeAt.getTime() < MEET_ME_NUDGE_MIN_GAP_MS) {
    return "nudge_cooldown";
  }
  return null;
}

/** Both sides of a reveal must clear the same bar. */
export function canRevealMeetMeProfile(input: {
  hasPrimaryPhoto: boolean;
  profileScore: number;
  hasActiveReportAgainst: boolean;
}): boolean {
  if (!input.hasPrimaryPhoto) return false;
  if (input.hasActiveReportAgainst) return false;
  return input.profileScore >= MEET_ME_MIN_PROFILE_SCORE;
}

// ─── Copy ─────────────────────────────────────────────────────────────────────

/**
 * Words this feature must never say. The original product brief suggested
 * "there's a young lady over there" — appearance-first and gendered description of
 * a stranger is exactly the tone that turns a neighbourly nudge into something
 * threatening. The unit test asserts nudge copy stays clear of this list.
 */
export const MEET_ME_BANNED_COPY_TERMS = [
  "young lady",
  "young man",
  "young woman",
  "over there",
  "attractive",
  "pretty",
  "cute",
  "gorgeous",
  "hot ",
  "beautiful",
  "girl",
  "boy",
  "he's",
  "she's",
  "his photo",
  "her photo",
] as const;

const NUDGE_VARIANTS = [
  "Someone at {venue} is also open to a hello right now.",
  "{name} is at {venue} too and turned Meet Me on. If you're up for it, go say hi.",
  "Two of you are open to meeting at {venue}. {name}'s profile is one tap away.",
  "{name} is here at {venue} and would welcome a hello.",
] as const;

const FIRST_NUDGE =
  "Someone nearby at {venue} turned Meet Me on. This is a real person in the room — only say hi if you'd genuinely like to.";

export function pickMeetMeNudge(input: {
  displayName: string;
  venueName: string;
  variant?: number;
  isFirstEver?: boolean;
}): string {
  const name = input.displayName.trim() || "Someone";
  const venue = input.venueName.trim() || "this venue";
  if (input.isFirstEver) {
    return FIRST_NUDGE.replace("{venue}", venue);
  }
  const index = Math.abs(input.variant ?? 0) % NUDGE_VARIANTS.length;
  return NUDGE_VARIANTS[index].replace("{venue}", venue).replace("{name}", name);
}

/** The one-shot ping the greeted member receives. It never names the greeter. */
export function getMeetMeGreetingMessage(input: { venueName: string }): string {
  const venue = input.venueName.trim() || "this venue";
  return `Someone at ${venue} said hi. Open Meet Me if you'd like to see who — there's no reply waiting and no pressure.`;
}

const ICEBREAKER_VARIANTS = [
  "You're both at {venue} right now. A simple hello is enough.",
  "Say hello and mention you're both at {venue} — that's all the opening you need.",
  "They're open to meeting, not to a script. Keep it short and see how it goes.",
] as const;

/** Deterministic fallback used instantly, before any personalised line arrives. */
export function pickMeetMeIcebreaker(input: { venueName: string; variant?: number }): string {
  const venue = input.venueName.trim() || "this venue";
  const index = Math.abs(input.variant ?? 0) % ICEBREAKER_VARIANTS.length;
  return ICEBREAKER_VARIANTS[index].replace("{venue}", venue);
}

/** Guards the optional personalised line so Sally cannot invent a biography. */
export function isSafeMeetMeIcebreaker(text: string, allowedName: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 12 || trimmed.length > 240) return false;
  const lowered = trimmed.toLowerCase();
  if (MEET_ME_BANNED_COPY_TERMS.some((term) => lowered.includes(term))) return false;

  // Sentence-initial capitalisation is not a name. Everything capitalised after that
  // must belong to the person being introduced, so the model cannot invent a
  // neighbour, partner, or friend who is supposedly standing nearby.
  const withoutSentenceStarts = trimmed.replace(/(^|[.!?]\s+)([A-Z][a-z']*)/g, (_match, lead: string) => lead);
  const capitalised = withoutSentenceStarts.match(/\b[A-Z][a-z]{2,}\b/g) ?? [];
  const allowed = new Set(allowedName.split(/\s+/).filter(Boolean).map((word) => word.toLowerCase()));
  return capitalised.every((word) => allowed.has(word.toLowerCase()));
}

export function getMeetMeEmptyState(nearbyCount: number): string | null {
  if (nearbyCount > 0) return null;
  return "No one else has Meet Me on at this venue right now. That can change while you're here.";
}

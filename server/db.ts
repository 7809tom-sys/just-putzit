import { and, desc, eq, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  chatMessages,
  gameSessions,
  interviewSessions,
  matches,
  notifications,
  userProfiles,
  users,
  reports,
  blocks,
  adminFlags,
  venuePartners,
  activityListings,
  activityRsvps,
  communityGroups,
  communityGroupMembers,
  bookings,
  conciergeRequests,
  coupleLinks,
  coupleMatches,
  campuses,
  referrals,
  wouldYouRatherQuestions,
  wouldYouRatherAnswers,
  wyrChallenges,
  type ProfileTraits,
  type InterviewMessage,
  type GameQuestion,
  type ConciergePlanItem,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users);
}

// ─── User Profiles ────────────────────────────────────────────────────────────

export async function getOrCreateProfile(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const existing = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  if (existing[0]) return existing[0];
  await db.insert(userProfiles).values({ userId, traits: {} });
  const created = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  return created[0] ?? null;
}

export async function updateProfile(userId: number, data: Partial<typeof userProfiles.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(userProfiles).set(data).where(eq(userProfiles.userId, userId));
}

export async function getProfileByUserId(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  return result[0] ?? null;
}

export async function getAllProfiles() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(userProfiles);
}

// ─── Interview Sessions ───────────────────────────────────────────────────────

export async function createInterviewSession(userId: number) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(interviewSessions).values({ userId, messages: [], extractedTraits: {} });
  const result = await db
    .select()
    .from(interviewSessions)
    .where(eq(interviewSessions.userId, userId))
    .orderBy(desc(interviewSessions.createdAt))
    .limit(1);
  return result[0] ?? null;
}

export async function getInterviewSession(sessionId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(interviewSessions).where(eq(interviewSessions.id, sessionId)).limit(1);
  return result[0] ?? null;
}

export async function updateInterviewSession(
  sessionId: number,
  data: { messages?: InterviewMessage[]; extractedTraits?: ProfileTraits; completedAt?: Date }
) {
  const db = await getDb();
  if (!db) return;
  await db.update(interviewSessions).set(data).where(eq(interviewSessions.id, sessionId));
}

export async function getLatestInterviewSession(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(interviewSessions)
    .where(eq(interviewSessions.userId, userId))
    .orderBy(desc(interviewSessions.createdAt))
    .limit(1);
  return result[0] ?? null;
}

// ─── Matches ──────────────────────────────────────────────────────────────────

export async function createMatch(user1Id: number, user2Id: number, score: number, reason: string) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(matches).values({ user1Id, user2Id, compatibilityScore: score, compatibilityReason: reason });
  const result = await db
    .select()
    .from(matches)
    .where(and(eq(matches.user1Id, user1Id), eq(matches.user2Id, user2Id)))
    .orderBy(desc(matches.createdAt))
    .limit(1);
  return result[0] ?? null;
}

export async function getMatchesForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(matches)
    .where(or(eq(matches.user1Id, userId), eq(matches.user2Id, userId)))
    .orderBy(desc(matches.createdAt));
}

export async function getMatchById(matchId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);
  return result[0] ?? null;
}

export async function existingMatch(user1Id: number, user2Id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(matches)
    .where(
      or(
        and(eq(matches.user1Id, user1Id), eq(matches.user2Id, user2Id)),
        and(eq(matches.user1Id, user2Id), eq(matches.user2Id, user1Id))
      )
    )
    .limit(1);
  return result[0] ?? null;
}

// ─── Chat Messages ────────────────────────────────────────────────────────────

export async function sendChatMessage(matchId: number, senderId: number, content: string) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(chatMessages).values({ matchId, senderId, content });
  const result = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.matchId, matchId))
    .orderBy(desc(chatMessages.createdAt))
    .limit(1);
  return result[0] ?? null;
}

export async function getChatMessages(matchId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.matchId, matchId))
    .orderBy(chatMessages.createdAt)
    .limit(limit);
}

// ─── Game Sessions ────────────────────────────────────────────────────────────

export async function createGameSession(
  matchId: number,
  gameType: "newlywed" | "two_truths" | "this_or_that",
  questions: GameQuestion[]
) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(gameSessions).values({ matchId, gameType, questions, status: "in_progress" });
  const result = await db
    .select()
    .from(gameSessions)
    .where(eq(gameSessions.matchId, matchId))
    .orderBy(desc(gameSessions.createdAt))
    .limit(1);
  return result[0] ?? null;
}

export async function updateGameSession(
  sessionId: number,
  data: Partial<typeof gameSessions.$inferInsert>
) {
  const db = await getDb();
  if (!db) return;
  await db.update(gameSessions).set(data).where(eq(gameSessions.id, sessionId));
}

export async function getGameSession(sessionId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(gameSessions).where(eq(gameSessions.id, sessionId)).limit(1);
  return result[0] ?? null;
}

export async function getGameSessionsForMatch(matchId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(gameSessions)
    .where(eq(gameSessions.matchId, matchId))
    .orderBy(desc(gameSessions.createdAt));
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function createNotification(
  userId: number,
  type: "new_match" | "game_ready" | "new_message" | "interview_reminder",
  title: string,
  body: string,
  relatedId?: number
) {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values({ userId, type, title, body, relatedId });
}

export async function getNotificationsForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(20);
}

export async function markNotificationRead(notifId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, notifId));
}

export async function markAllNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
}

// ─── Safety: Reports & Blocks ─────────────────────────────────────────────────

export async function createReport(
  reporterId: number,
  reportedUserId: number,
  reason: typeof reports.$inferInsert["reason"],
  details?: string
) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(reports).values({ reporterId, reportedUserId, reason, details });
  // Auto-flag if user has 3+ reports
  const allReports = await db.select().from(reports).where(eq(reports.reportedUserId, reportedUserId));
  if (allReports.length >= 3) {
    await db.insert(adminFlags).values({
      userId: reportedUserId,
      flagType: "multiple_reports",
      severity: "high",
      notes: `Auto-flagged: ${allReports.length} reports received`,
    });
  }
  return { success: true };
}

export async function getReportsForAdmin() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reports).orderBy(desc(reports.createdAt)).limit(100);
}

export async function updateReportStatus(
  reportId: number,
  status: typeof reports.$inferInsert["status"]
) {
  const db = await getDb();
  if (!db) return;
  await db.update(reports).set({ status, reviewedAt: new Date() }).where(eq(reports.id, reportId));
}

export async function blockUser(blockerId: number, blockedUserId: number) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(blocks)
    .where(and(eq(blocks.blockerId, blockerId), eq(blocks.blockedUserId, blockedUserId))).limit(1);
  if (!existing[0]) {
    await db.insert(blocks).values({ blockerId, blockedUserId });
  }
}

export async function getBlockedUserIds(userId: number): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(blocks).where(eq(blocks.blockerId, userId));
  return result.map(b => b.blockedUserId);
}

export async function getAdminFlags() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(adminFlags).orderBy(desc(adminFlags.createdAt)).limit(100);
}

export async function resolveAdminFlag(flagId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(adminFlags).set({ resolvedAt: new Date() }).where(eq(adminFlags.id, flagId));
}

export async function suspendUser(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role: "user" }).where(eq(users.id, userId));
  // Flag as manually reviewed
  await db.insert(adminFlags).values({
    userId,
    flagType: "manual_review",
    severity: "high",
    notes: "Account suspended by admin",
  });
}

// ─── Venue Partners ───────────────────────────────────────────────────────────

export async function getVenuePartners(city?: string) {
  const db = await getDb();
  if (!db) return [];
  if (city) {
    return db.select().from(venuePartners)
      .where(and(eq(venuePartners.isActive, true), eq(venuePartners.city, city)))
      .orderBy(desc(venuePartners.isFeatured));
  }
  return db.select().from(venuePartners)
    .where(eq(venuePartners.isActive, true))
    .orderBy(desc(venuePartners.isFeatured));
}

export async function getVenueById(venueId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(venuePartners).where(eq(venuePartners.id, venueId)).limit(1);
  return result[0] ?? null;
}

export async function createVenuePartner(data: typeof venuePartners.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(venuePartners).values(data);
  const result = await db.select().from(venuePartners).orderBy(desc(venuePartners.createdAt)).limit(1);
  return result[0] ?? null;
}

export async function recordReferralVisit(activityId: number) {
  const db = await getDb();
  if (!db) return;
  const activity = await db.select().from(activityListings).where(eq(activityListings.id, activityId)).limit(1);
  if (activity[0]) {
    await db.update(activityListings)
      .set({ totalReferrals: (activity[0].totalReferrals ?? 0) + 1 })
      .where(eq(activityListings.id, activityId));
  }
}

// ─── Activity Listings ────────────────────────────────────────────────────────

export async function getActivityListings(city?: string, category?: string) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(activityListings)
    .where(eq(activityListings.isActive, true))
    .orderBy(desc(activityListings.createdAt))
    .limit(100);
  if (category && category !== "all") {
    return rows.filter(r => r.category === category);
  }
  return rows.slice(0, 50);
}

export async function getActivityById(activityId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(activityListings).where(eq(activityListings.id, activityId)).limit(1);
  return result[0] ?? null;
}

export async function createActivityListing(data: typeof activityListings.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(activityListings).values(data);
  const result = await db.select().from(activityListings).orderBy(desc(activityListings.createdAt)).limit(1);
  return result[0] ?? null;
}

export async function rsvpToActivity(activityId: number, userId: number, matchId?: number) {
  const db = await getDb();
  if (!db) return null;
  const existing = await db.select().from(activityRsvps)
    .where(and(eq(activityRsvps.activityId, activityId), eq(activityRsvps.userId, userId))).limit(1);
  if (existing[0]) return existing[0];
  await db.insert(activityRsvps).values({ activityId, userId, matchId, status: "going" });
  const result = await db.select().from(activityRsvps)
    .where(and(eq(activityRsvps.activityId, activityId), eq(activityRsvps.userId, userId))).limit(1);
  return result[0] ?? null;
}

export async function getRsvpsForActivity(activityId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(activityRsvps).where(eq(activityRsvps.activityId, activityId));
}

export async function checkInToActivity(activityId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(activityRsvps)
    .set({ checkedIn: true, checkedInAt: new Date() })
    .where(and(eq(activityRsvps.activityId, activityId), eq(activityRsvps.userId, userId)));
  await recordReferralVisit(activityId);
}

// ─── Community Groups ─────────────────────────────────────────────────────────

export async function getCommunityGroups(city?: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(communityGroups)
    .where(eq(communityGroups.isPublic, true))
    .orderBy(desc(communityGroups.createdAt))
    .limit(50);
}

export async function createCommunityGroup(data: typeof communityGroups.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(communityGroups).values(data);
  const result = await db.select().from(communityGroups).orderBy(desc(communityGroups.createdAt)).limit(1);
  return result[0] ?? null;
}

export async function joinCommunityGroup(groupId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(communityGroupMembers)
    .where(and(eq(communityGroupMembers.groupId, groupId), eq(communityGroupMembers.userId, userId))).limit(1);
  if (!existing[0]) {
    await db.insert(communityGroupMembers).values({ groupId, userId, role: "member" });
  }
}

export async function getGroupMembers(groupId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(communityGroupMembers).where(eq(communityGroupMembers.groupId, groupId));
}

// ─── Bookings (marketplace) ─────────────────────────────────────────────────────

function genCode(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export async function createBooking(data: typeof bookings.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(bookings).values(data);
  const result = await db.select().from(bookings)
    .where(and(eq(bookings.userId, data.userId), eq(bookings.confirmationCode, data.confirmationCode)))
    .limit(1);
  return result[0] ?? null;
}

export async function getBookingsForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bookings)
    .where(eq(bookings.userId, userId))
    .orderBy(desc(bookings.createdAt));
}

export async function getBookingById(bookingId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
  return result[0] ?? null;
}

export async function cancelBooking(bookingId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(bookings).set({ status: "cancelled" })
    .where(and(eq(bookings.id, bookingId), eq(bookings.userId, userId)));
}

export async function getBookingsForVenue(venueId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bookings)
    .where(eq(bookings.venueId, venueId))
    .orderBy(desc(bookings.createdAt));
}

export { genCode };

// ─── Concierge Requests ─────────────────────────────────────────────────────────

export async function createConciergeRequest(data: typeof conciergeRequests.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(conciergeRequests).values(data);
  const result = await db.select().from(conciergeRequests)
    .where(eq(conciergeRequests.userId, data.userId))
    .orderBy(desc(conciergeRequests.createdAt))
    .limit(1);
  return result[0] ?? null;
}

export async function updateConciergeRequest(id: number, data: Partial<typeof conciergeRequests.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(conciergeRequests).set(data).where(eq(conciergeRequests.id, id));
}

export async function getConciergeRequestById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(conciergeRequests).where(eq(conciergeRequests.id, id)).limit(1);
  return result[0] ?? null;
}

export async function getConciergeRequestsForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(conciergeRequests)
    .where(eq(conciergeRequests.userId, userId))
    .orderBy(desc(conciergeRequests.createdAt));
}

// ─── Vendor Portal ──────────────────────────────────────────────────────────────

export async function getVenuesByOwner(ownerUserId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(venuePartners)
    .where(eq(venuePartners.ownerUserId, ownerUserId))
    .orderBy(desc(venuePartners.createdAt));
}

export async function updateVenuePartner(venueId: number, data: Partial<typeof venuePartners.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(venuePartners).set(data).where(eq(venuePartners.id, venueId));
}

export async function getListingsByVenue(venueId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(activityListings)
    .where(eq(activityListings.venueId, venueId))
    .orderBy(desc(activityListings.createdAt));
}

export async function getListingsForOwner(ownerUserId: number) {
  const db = await getDb();
  if (!db) return [];
  const venues = await getVenuesByOwner(ownerUserId);
  if (venues.length === 0) return [];
  const venueIds = venues.map(v => v.id);
  const all = await db.select().from(activityListings).orderBy(desc(activityListings.createdAt));
  return all.filter(a => venueIds.includes(a.venueId));
}

export async function updateActivityListing(id: number, data: Partial<typeof activityListings.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(activityListings).set(data).where(eq(activityListings.id, id));
}

// ─── Couples Network ────────────────────────────────────────────────────────────

export async function getCoupleLinkForUser(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(coupleLinks)
    .where(and(eq(coupleLinks.userId, userId), eq(coupleLinks.isActive, true)))
    .limit(1);
  return result[0] ?? null;
}

export async function upsertCoupleLink(userId: number, data: Partial<typeof coupleLinks.$inferInsert>) {
  const db = await getDb();
  if (!db) return null;
  const existing = await getCoupleLinkForUser(userId);
  if (existing) {
    await db.update(coupleLinks).set(data).where(eq(coupleLinks.id, existing.id));
    return getCoupleLinkForUser(userId);
  }
  await db.insert(coupleLinks).values({
    userId,
    partnerName: data.partnerName ?? "My Partner",
    ...data,
  });
  return getCoupleLinkForUser(userId);
}

export async function getAllCoupleLinks() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(coupleLinks).where(eq(coupleLinks.isActive, true));
}

export async function existingCoupleMatch(user1Id: number, user2Id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(coupleMatches)
    .where(or(
      and(eq(coupleMatches.couple1UserId, user1Id), eq(coupleMatches.couple2UserId, user2Id)),
      and(eq(coupleMatches.couple1UserId, user2Id), eq(coupleMatches.couple2UserId, user1Id)),
    ))
    .limit(1);
  return result[0] ?? null;
}

export async function createCoupleMatch(user1Id: number, user2Id: number, score: number, reason: string) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(coupleMatches).values({
    couple1UserId: user1Id, couple2UserId: user2Id, compatibilityScore: score, compatibilityReason: reason,
  });
  const result = await db.select().from(coupleMatches)
    .where(and(eq(coupleMatches.couple1UserId, user1Id), eq(coupleMatches.couple2UserId, user2Id)))
    .orderBy(desc(coupleMatches.createdAt))
    .limit(1);
  return result[0] ?? null;
}

export async function getCoupleMatchesForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(coupleMatches)
    .where(or(eq(coupleMatches.couple1UserId, userId), eq(coupleMatches.couple2UserId, userId)))
    .orderBy(desc(coupleMatches.createdAt));
}

// ─── Would You Rather helpers (low AI cost) ─────────────────────────────────────
export async function getWyrAnsweredQuestionIds(userId: number): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({ questionId: wouldYouRatherAnswers.questionId })
    .from(wouldYouRatherAnswers)
    .where(eq(wouldYouRatherAnswers.userId, userId));
  return rows.map((r) => r.questionId);
}

export async function getWyrQuestions(category?: string) {
  const db = await getDb();
  if (!db) return [];
  if (category && category !== "all") {
    return db
      .select()
      .from(wouldYouRatherQuestions)
      .where(
        and(
          eq(wouldYouRatherQuestions.isActive, true),
          eq(wouldYouRatherQuestions.category, category as never),
        ),
      );
  }
  return db
    .select()
    .from(wouldYouRatherQuestions)
    .where(eq(wouldYouRatherQuestions.isActive, true));
}

export async function getWyrQuestionById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(wouldYouRatherQuestions)
    .where(eq(wouldYouRatherQuestions.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function recordWyrAnswer(userId: number, questionId: number, choice: "A" | "B") {
  const db = await getDb();
  if (!db) return;
  // One answer per user per question: remove any prior answer, then insert.
  await db
    .delete(wouldYouRatherAnswers)
    .where(
      and(
        eq(wouldYouRatherAnswers.userId, userId),
        eq(wouldYouRatherAnswers.questionId, questionId),
      ),
    );
  await db.insert(wouldYouRatherAnswers).values({ userId, questionId, choice });
}

export async function getWyrSplit(questionId: number): Promise<{ a: number; b: number }> {
  const db = await getDb();
  if (!db) return { a: 0, b: 0 };
  const rows = await db
    .select({ choice: wouldYouRatherAnswers.choice })
    .from(wouldYouRatherAnswers)
    .where(eq(wouldYouRatherAnswers.questionId, questionId));
  let a = 0;
  let b = 0;
  for (const r of rows) {
    if (r.choice === "A") a += 1;
    else b += 1;
  }
  return { a, b };
}

export async function getWyrAnswerCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db
    .select({ id: wouldYouRatherAnswers.id })
    .from(wouldYouRatherAnswers)
    .where(eq(wouldYouRatherAnswers.userId, userId));
  return rows.length;
}

// ─── Admin Stats ──────────────────────────────────────────────────────────────

export async function getAdminStats() {
  const db = await getDb();
  if (!db) return { totalUsers: 0, newThisWeek: 0, verifiedCount: 0, interviewedCount: 0, totalMatches: 0, totalMessages: 0 };

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [allUsers, newUsers, allMatches, allMessages, allInterviews] = await Promise.all([
    db.select({ id: users.id, role: users.role }).from(users),
    db.select({ id: users.id }).from(users).where(sql`${users.createdAt} >= ${oneWeekAgo}`),
    db.select({ id: matches.id }).from(matches),
    db.select({ id: chatMessages.id }).from(chatMessages),
    db.select({ id: interviewSessions.id, userId: interviewSessions.userId })
      .from(interviewSessions)
      .where(sql`${interviewSessions.completedAt} IS NOT NULL`),
  ]);

  const verifiedProfiles = await db
    .select({ id: userProfiles.id })
    .from(userProfiles)
    .where(eq(userProfiles.isVerified, true));

  return {
    totalUsers: allUsers.length,
    newThisWeek: newUsers.length,
    verifiedCount: verifiedProfiles.length,
    interviewedCount: allInterviews.length,
    totalMatches: allMatches.length,
    totalMessages: allMessages.length,
  };
}

export async function searchUsers(query: string, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  const baseQuery = db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);

  if (!query) return baseQuery;
  const like = `%${query}%`;
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(or(sql`${users.name} LIKE ${like}`, sql`${users.email} LIKE ${like}`))
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getUserWithProfile(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!u) return null;
  const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  const matchCount = await db.select({ id: matches.id }).from(matches)
    .where(or(eq(matches.user1Id, userId), eq(matches.user2Id, userId)));
  const msgCount = await db.select({ id: chatMessages.id }).from(chatMessages)
    .where(eq(chatMessages.senderId, userId));
  return { user: u, profile: profile ?? null, matchCount: matchCount.length, messageCount: msgCount.length };
}

// ─── WYR 2-Player Challenges ──────────────────────────────────────────────────

export async function createWyrChallenge(
  challengerId: number,
  challengedId: number,
  questionIds: number[],
  matchId?: number
) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(wyrChallenges).values({
    challengerId,
    challengedId,
    questionIds,
    matchId: matchId ?? null,
    status: "pending",
  });
  const id = (result as unknown as { insertId: number }).insertId;
  const [row] = await db.select().from(wyrChallenges).where(eq(wyrChallenges.id, id)).limit(1);
  return row ?? null;
}

export async function getWyrChallenge(challengeId: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(wyrChallenges).where(eq(wyrChallenges.id, challengeId)).limit(1);
  return row ?? null;
}

export async function getWyrChallengesForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(wyrChallenges)
    .where(or(eq(wyrChallenges.challengerId, userId), eq(wyrChallenges.challengedId, userId)))
    .orderBy(desc(wyrChallenges.createdAt));
}

export async function updateWyrChallengeStatus(
  challengeId: number,
  status: "pending" | "active" | "completed",
  compatibilityPct?: number
) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(wyrChallenges)
    .set({
      status,
      ...(compatibilityPct !== undefined ? { compatibilityPct } : {}),
      ...(status === "completed" ? { completedAt: new Date() } : {}),
    })
    .where(eq(wyrChallenges.id, challengeId));
}

/** Compare answers between two users for a set of question IDs and return a compatibility % */
export async function computeWyrCompatibility(
  userId1: number,
  userId2: number,
  questionIds: number[]
): Promise<number> {
  if (questionIds.length === 0) return 0;
  const db = await getDb();
  if (!db) return 0;

  const answers1 = await db
    .select()
    .from(wouldYouRatherAnswers)
    .where(and(eq(wouldYouRatherAnswers.userId, userId1), sql`${wouldYouRatherAnswers.questionId} IN (${sql.join(questionIds.map((id) => sql`${id}`), sql`, `)})`));
  const answers2 = await db
    .select()
    .from(wouldYouRatherAnswers)
    .where(and(eq(wouldYouRatherAnswers.userId, userId2), sql`${wouldYouRatherAnswers.questionId} IN (${sql.join(questionIds.map((id) => sql`${id}`), sql`, `)})`));

  const map1 = new Map(answers1.map((a) => [a.questionId, a.choice]));
  const map2 = new Map(answers2.map((a) => [a.questionId, a.choice]));

  let matches = 0;
  let compared = 0;
  for (const qid of questionIds) {
    const c1 = map1.get(qid);
    const c2 = map2.get(qid);
    if (c1 && c2) {
      compared++;
      if (c1 === c2) matches++;
    }
  }
  if (compared === 0) return 0;
  return Math.round((matches / compared) * 100);
}

// ─── Campus Growth Engine ─────────────────────────────────────────────────────

export async function getCampusById(campusId: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(campuses).where(eq(campuses.id, campusId)).limit(1);
  return row ?? null;
}

export async function getCampusBySlug(slug: string) {
  const db = await getDb();
  if (!db) return null;
  // Match by lowercased name or emailDomain
  const all = await db.select().from(campuses);
  return all.find(
    (c) => c.name.toLowerCase().replace(/\s+/g, "-") === slug || c.emailDomains === slug
  ) ?? null;
}

export async function getCampusStats(campusId: number) {
  const db = await getDb();
  if (!db) return { total: 0, threshold: 100, isLive: false };
  const [campus] = await db.select().from(campuses).where(eq(campuses.id, campusId)).limit(1);
  if (!campus) return { total: 0, threshold: 100, isLive: false };

  const [countRow] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(userProfiles)
    .where(eq(userProfiles.campusId, campusId));

  const total = Number(countRow?.count ?? 0);
  return {
    campusId,
    name: campus.name,
    city: campus.city,
    state: campus.state,
    total,
    threshold: campus.launchThreshold,
    isLive: campus.isLive,
    pct: Math.min(100, Math.round((total / campus.launchThreshold) * 100)),
  };
}

export async function getCampusLeaderboard(campusId: number, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  // Count referrals per inviter for this campus
  const rows = await db
    .select({
      inviterUserId: referrals.inviterUserId,
      referralCount: sql<number>`COUNT(*)`,
    })
    .from(referrals)
    .where(and(eq(referrals.campusId, campusId), eq(referrals.status, "joined")))
    .groupBy(referrals.inviterUserId)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(limit);

  // Enrich with profile info
  const enriched = await Promise.all(
    rows.map(async (r) => {
      const profile = await getProfileByUserId(r.inviterUserId);
      return {
        userId: r.inviterUserId,
        referralCount: Number(r.referralCount),
        displayName: profile?.displayName ?? "Anonymous",
        avatarEmoji: profile?.avatarEmoji ?? "😊",
        avatarColor: profile?.avatarColor ?? "#f97316",
        isAmbassador: profile?.isAmbassador ?? false,
      };
    })
  );
  return enriched;
}

export async function generateInviteCode(userId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  // Check if user already has a code
  const [profile] = await db.select({ inviteCode: userProfiles.inviteCode }).from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  if (profile?.inviteCode) return profile.inviteCode;
  // Generate a short unique code
  const code = `JP-${userId}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  await db.update(userProfiles).set({ inviteCode: code }).where(eq(userProfiles.userId, userId));
  return code;
}

export async function recordReferral(inviteCode: string, inviteeUserId: number) {
  const db = await getDb();
  if (!db) return null;
  // Find the inviter by invite code
  const [inviterProfile] = await db.select().from(userProfiles).where(eq(userProfiles.inviteCode, inviteCode)).limit(1);
  if (!inviterProfile) return null;
  // Avoid duplicate referral records
  const existing = await db
    .select()
    .from(referrals)
    .where(and(eq(referrals.inviterUserId, inviterProfile.userId), eq(referrals.inviteeUserId, inviteeUserId)))
    .limit(1);
  if (existing.length > 0) return existing[0];

  await db.insert(referrals).values({
    inviterUserId: inviterProfile.userId,
    inviteeUserId,
    inviteCode,
    campusId: inviterProfile.campusId ?? undefined,
    status: "joined",
  });
  // Promote to ambassador if they now have >= 5 referrals
  const [countRow] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(referrals)
    .where(and(eq(referrals.inviterUserId, inviterProfile.userId), eq(referrals.status, "joined")));
  if (Number(countRow?.count ?? 0) >= 5) {
    await db.update(userProfiles).set({ isAmbassador: true }).where(eq(userProfiles.userId, inviterProfile.userId));
  }
  return { success: true };
}

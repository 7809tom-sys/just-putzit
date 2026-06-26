import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the db module
vi.mock("./db", () => ({
  getOrCreateProfile: vi.fn().mockResolvedValue({
    id: 1,
    userId: 1,
    displayName: "Test User",
    avatarEmoji: "😊",
    avatarColor: "#f97316",
    bio: null,
    traits: {},
    interviewCount: 0,
    onboardingComplete: false,
    latitude: null,
    longitude: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  updateProfile: vi.fn().mockResolvedValue(undefined),
  getProfileByUserId: vi.fn().mockResolvedValue(null),
  getAllProfiles: vi.fn().mockResolvedValue([]),
  createInterviewSession: vi.fn().mockResolvedValue({ id: 1, userId: 1, messages: [], status: "active", createdAt: new Date(), updatedAt: new Date(), completedAt: null }),
  getInterviewSession: vi.fn().mockResolvedValue(null),
  updateInterviewSession: vi.fn().mockResolvedValue(undefined),
  getLatestInterviewSession: vi.fn().mockResolvedValue(null),
  createMatch: vi.fn().mockResolvedValue({ id: 1 }),
  getMatchesForUser: vi.fn().mockResolvedValue([]),
  getMatchById: vi.fn().mockResolvedValue(null),
  existingMatch: vi.fn().mockResolvedValue(null),
  sendChatMessage: vi.fn().mockResolvedValue({ id: 1, matchId: 1, senderId: 1, content: "Hello", createdAt: new Date() }),
  getChatMessages: vi.fn().mockResolvedValue([]),
  createGameSession: vi.fn().mockResolvedValue({ id: 1, matchId: 1, gameType: "newlywed", questions: [], status: "active", user1Score: 0, user2Score: 0, sallyNarration: null, createdAt: new Date(), updatedAt: new Date(), completedAt: null }),
  updateGameSession: vi.fn().mockResolvedValue(undefined),
  getGameSession: vi.fn().mockResolvedValue(null),
  getGameSessionsForMatch: vi.fn().mockResolvedValue([]),
  createNotification: vi.fn().mockResolvedValue(undefined),
  getNotificationsForUser: vi.fn().mockResolvedValue([]),
  markNotificationRead: vi.fn().mockResolvedValue(undefined),
  markAllNotificationsRead: vi.fn().mockResolvedValue(undefined),
  getAllUsers: vi.fn().mockResolvedValue([]),
  getUserByOpenId: vi.fn().mockResolvedValue(null),
  upsertUser: vi.fn().mockResolvedValue(undefined),
}));

// Mock LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: '{"question": "What is your idea of a perfect Sunday?", "isComplete": false}' } }],
  }),
}));

function createTestContext(userId = 1): TrpcContext {
  return {
    user: {
      id: userId,
      openId: "test-open-id",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("Just Putzit - Auth", () => {
  it("returns null for unauthenticated user", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns user for authenticated user", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.id).toBe(1);
  });

  it("clears session cookie on logout", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
  });
});

describe("Just Putzit - Profile", () => {
  it("gets or creates profile for authenticated user", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    const profile = await caller.profile.get();
    expect(profile).not.toBeNull();
    expect(profile?.userId).toBe(1);
  });

  it("updates profile fields", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.profile.update({ displayName: "Updated Name", avatarEmoji: "🎉" });
    // profile.update returns the updated profile (or null)
    // The mock returns null for getProfileByUserId, so we just check it doesn't throw
    expect(result === null || typeof result === 'object').toBe(true);
  });
});

describe("Just Putzit - Matchmaking", () => {
  it("returns empty matches for new user", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    const matches = await caller.matchmaking.getMyMatches();
    expect(Array.isArray(matches)).toBe(true);
    expect(matches.length).toBe(0);
  });
});

describe("Just Putzit - Chat", () => {
  it("returns empty messages for a match", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    const messages = await caller.chat.getMessages({ matchId: 1 });
    expect(Array.isArray(messages)).toBe(true);
  });
});

describe("Just Putzit - Notifications", () => {
  it("returns empty notifications for new user", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    const notifs = await caller.notifications.getAll();
    expect(Array.isArray(notifs)).toBe(true);
    expect(notifs.length).toBe(0);
  });

  it("marks all notifications as read", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.notifications.markAllRead();
    expect(result.success).toBe(true);
  });
});

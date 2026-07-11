import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { z } from "zod";
import {
  getOrCreateProfile,
  updateProfile,
  getProfileByUserId,
  getAllProfiles,
  createInterviewSession,
  getInterviewSession,
  updateInterviewSession,
  getLatestInterviewSession,
  createMatch,
  getMatchesForUser,
  getMatchById,
  existingMatch,
  sendChatMessage,
  getChatMessages,
  createGameSession,
  updateGameSession,
  getGameSession,
  getGameSessionsForMatch,
  createNotification,
  getNotificationsForUser,
  markNotificationRead,
  markAllNotificationsRead,
  getAllUsers,
  getUserByOpenId,
  createReport,
  getReportsForAdmin,
  updateReportStatus,
  blockUser,
  getBlockedUserIds,
  getAdminFlags,
  resolveAdminFlag,
  suspendUser,
  getVenuePartners,
  getVenueById,
  createVenuePartner,
  getActivityListings,
  getActivityById,
  createActivityListing,
  rsvpToActivity,
  getRsvpsForActivity,
  checkInToActivity,
  recordReferralVisit,
  getCommunityGroups,
  createCommunityGroup,
  joinCommunityGroup,
  getGroupMembers,
  createBooking,
  getBookingsForUser,
  getBookingById,
  cancelBooking,
  getBookingsForVenue,
  genCode,
  createConciergeRequest,
  updateConciergeRequest,
  getConciergeRequestById,
  getConciergeRequestsForUser,
  getVenuesByOwner,
  updateVenuePartner,
  getListingsByVenue,
  getListingsForOwner,
  updateActivityListing,
  getCoupleLinkForUser,
  upsertCoupleLink,
  getAllCoupleLinks,
  existingCoupleMatch,
  createCoupleMatch,
  getCoupleMatchesForUser,
  getWyrQuestions,
  getWyrQuestionById,
  getWyrAnsweredQuestionIds,
  recordWyrAnswer,
  getWyrSplit,
  getWyrAnswerCount,
  getAdminStats,
  searchUsers,
  getUserWithProfile,
} from "./db";
import type { ProfileTraits, InterviewMessage, GameQuestion, ConciergePlanItem } from "../drizzle/schema";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Profile ──────────────────────────────────────────────────────────────
  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return getOrCreateProfile(ctx.user.id);
    }),

    getById: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return getProfileByUserId(input.userId);
      }),

    update: protectedProcedure
      .input(
        z.object({
          avatarEmoji: z.string().optional(),
          avatarColor: z.string().optional(),
          displayName: z.string().optional(),
          bio: z.string().optional(),
          networkType: z.enum(["singles", "couples", "community"]).optional(),
          onboardingComplete: z.boolean().optional(),
          latitude: z.string().optional(),
          longitude: z.string().optional(),
          city: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await getOrCreateProfile(ctx.user.id);
        await updateProfile(ctx.user.id, input);
        return getProfileByUserId(ctx.user.id);
      }),

    completeOnboarding: protectedProcedure
      .input(
        z.object({
          avatarEmoji: z.string(),
          avatarColor: z.string(),
          displayName: z.string(),
          networkType: z.enum(["singles", "couples", "community"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await getOrCreateProfile(ctx.user.id);
        await updateProfile(ctx.user.id, { ...input, onboardingComplete: true });
        return getProfileByUserId(ctx.user.id);
      }),
  }),

  // ─── Interview ────────────────────────────────────────────────────────────
  interview: router({
    start: protectedProcedure.mutation(async ({ ctx }) => {
      const profile = await getOrCreateProfile(ctx.user.id);
      const session = await createInterviewSession(ctx.user.id);
      if (!session) throw new Error("Failed to create session");

      const existingTraits = profile?.traits as ProfileTraits ?? {};
      const interviewCount = profile?.interviewCount ?? 0;
      const userName = profile?.displayName || ctx.user.name || "friend";

      // Generate opening question from Sally
      const systemPrompt = `You are Sally, a warm, friendly, and enthusiastic AI host for Just Putzit — a social platform that connects people for real-life activities and relationships. You conduct short 90-second profile-building interviews.

Your personality: cheerful, curious, empathetic, and encouraging. You feel like a best friend who genuinely wants to know someone better.

Current user profile data: ${JSON.stringify(existingTraits)}
Interview count: ${interviewCount}

Rules:
- Ask ONE engaging question at a time
- Questions should be fun, open-ended, and personality-revealing
- Each session should explore NEW aspects not already in the profile
- Keep questions warm and conversational, not clinical
- For first interview: ask about passions, ideal weekend, or what makes them laugh
- For return users: dive deeper or explore new areas (travel dreams, quirky habits, values)
- Never repeat questions from previous sessions
- Always address the user by name warmly`;

      const greeting = interviewCount === 0
        ? `Hi ${userName}! I'm Sally, and I'm SO excited to meet you! 🎉 I'm here to get to know the real you — the fun stuff, the quirky stuff, all of it! Let's kick things off: **What's your idea of a perfect Sunday?** Tell me everything! ☀️`
        : `Welcome back, ${userName}! 🌟 I've missed you! I already know a few things about you, but there's always more to discover. Today I want to ask you something a little different: **${await generateFollowUpQuestion(existingTraits, interviewCount)}**`;

      const messages: InterviewMessage[] = [
        { role: "assistant", content: greeting, timestamp: Date.now() },
      ];

      await updateInterviewSession(session.id, { messages });
      return { sessionId: session.id, message: greeting };
    }),

    chat: protectedProcedure
      .input(
        z.object({
          sessionId: z.number(),
          userMessage: z.string().max(500),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const session = await getInterviewSession(input.sessionId);
        if (!session) throw new Error("Session not found");

        const profile = await getProfileByUserId(ctx.user.id);
        const existingTraits = profile?.traits as ProfileTraits ?? {};
        const userName = profile?.displayName || ctx.user.name || "friend";

        const messages = (session.messages as InterviewMessage[]) || [];
        messages.push({ role: "user", content: input.userMessage, timestamp: Date.now() });

        const llmMessages = [
          {
            role: "system" as const,
            content: `You are Sally, a warm and enthusiastic AI host for Just Putzit. You're conducting a 90-second profile-building interview with ${userName}.

Existing profile traits: ${JSON.stringify(existingTraits)}

Rules:
- Respond warmly to their answer (1-2 sentences acknowledging what they said)
- Then ask ONE new follow-up question to dig deeper OR pivot to a new topic
- Keep it conversational and fun
- After 4-5 exchanges, wrap up warmly saying you've learned so much and will update their profile
- Use emojis sparingly but naturally
- Never be clinical or robotic`,
          },
          ...messages.map(m => ({ role: m.role as "assistant" | "user", content: m.content })),
        ];

        const response = await invokeLLM({ messages: llmMessages });
        const sallyReply = (response.choices[0]?.message?.content as string) || "That's so interesting! Tell me more!";

        messages.push({ role: "assistant", content: sallyReply, timestamp: Date.now() });

        // Check if interview should end (after ~5 exchanges or Sally says wrap-up)
        const userTurns = messages.filter(m => m.role === "user").length;
        const isComplete = userTurns >= 5 || (typeof sallyReply === 'string' && sallyReply.toLowerCase().includes("update your profile"));

        await updateInterviewSession(input.sessionId, {
          messages,
          ...(isComplete ? { completedAt: new Date() } : {}),
        });

        if (isComplete) {
          // Extract traits from the conversation
          const extractedTraits = await extractTraitsFromInterview(messages, existingTraits);
          await updateInterviewSession(input.sessionId, { extractedTraits });

          // Merge traits into profile
          const mergedTraits = { ...existingTraits, ...extractedTraits };
          const aiSummary = await generateProfileSummary(mergedTraits, userName);
          mergedTraits.aiSummary = aiSummary;

          await updateProfile(ctx.user.id, {
            traits: mergedTraits,
            interviewCount: (profile?.interviewCount ?? 0) + 1,
          });
        }

        return { message: sallyReply, isComplete };
      }),

    complete: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const session = await getInterviewSession(input.sessionId);
        if (!session) throw new Error("Session not found");

        const profile = await getProfileByUserId(ctx.user.id);
        const existingTraits = profile?.traits as ProfileTraits ?? {};
        const messages = session.messages as InterviewMessage[];

        const extractedTraits = await extractTraitsFromInterview(messages, existingTraits);
        const mergedTraits = { ...existingTraits, ...extractedTraits };
        const userName = profile?.displayName || ctx.user.name || "friend";
        mergedTraits.aiSummary = await generateProfileSummary(mergedTraits, userName);

        await updateInterviewSession(input.sessionId, { extractedTraits, completedAt: new Date() });
        await updateProfile(ctx.user.id, {
          traits: mergedTraits,
          interviewCount: (profile?.interviewCount ?? 0) + 1,
        });

        return { success: true, traits: mergedTraits };
      }),
  }),

  // ─── Matchmaking ──────────────────────────────────────────────────────────
  matchmaking: router({
    getMyMatches: protectedProcedure.query(async ({ ctx }) => {
      const myMatches = await getMatchesForUser(ctx.user.id);
      const enriched = await Promise.all(
        myMatches.map(async match => {
          const otherUserId = match.user1Id === ctx.user.id ? match.user2Id : match.user1Id;
          const otherProfile = await getProfileByUserId(otherUserId);
          const otherUser = await getUserByOpenId("").catch(() => null);
          return { ...match, otherProfile, otherUserId };
        })
      );
      return enriched;
    }),

    findMatches: protectedProcedure.mutation(async ({ ctx }) => {
      const myProfile = await getProfileByUserId(ctx.user.id);
      if (!myProfile) throw new Error("Complete your profile first");

      const allProfiles = await getAllProfiles();
      const candidates = allProfiles.filter(
        p => p.userId !== ctx.user.id && p.onboardingComplete && p.interviewCount > 0
      );

      if (candidates.length === 0) return { matches: [] };

      const newMatches = [];
      for (const candidate of candidates.slice(0, 5)) {
        const already = await existingMatch(ctx.user.id, candidate.userId);
        if (already) continue;

        const result = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are a matchmaking AI for Just Putzit. Analyze two user profiles and determine compatibility.`,
            },
            {
              role: "user",
              content: `User A profile: ${JSON.stringify(myProfile.traits)}
User B profile: ${JSON.stringify(candidate.traits)}

Return a JSON object with:
- score: number 0-100 (compatibility percentage)
- reason: string (1-2 warm, encouraging sentences explaining why they'd connect well)`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "match_result",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  score: { type: "number" },
                  reason: { type: "string" },
                },
                required: ["score", "reason"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = result.choices[0]?.message?.content;
        const parsed = JSON.parse(typeof content === "string" ? content : "{}");
        const score = Math.min(100, Math.max(0, Math.round(parsed.score ?? 75)));
        const reason = parsed.reason ?? "You two seem like a great match!";

        if (score >= 60) {
          const match = await createMatch(ctx.user.id, candidate.userId, score, reason);
          if (match) {
            await createNotification(candidate.userId, "new_match", "You have a new match! 🎉", `Sally found someone special for you!`, match.id);
            newMatches.push({ ...match, otherProfile: candidate });
          }
        }
      }

      return { matches: newMatches };
    }),

    getMatchDetails: protectedProcedure
      .input(z.object({ matchId: z.number() }))
      .query(async ({ ctx, input }) => {
        const match = await getMatchById(input.matchId);
        if (!match) throw new Error("Match not found");
        const otherUserId = match.user1Id === ctx.user.id ? match.user2Id : match.user1Id;
        const otherProfile = await getProfileByUserId(otherUserId);
        return { match, otherProfile, otherUserId };
      }),
  }),

  // ─── Chat ─────────────────────────────────────────────────────────────────
  chat: router({
    getMessages: protectedProcedure
      .input(z.object({ matchId: z.number() }))
      .query(async ({ input }) => {
        return getChatMessages(input.matchId);
      }),

    send: protectedProcedure
      .input(z.object({ matchId: z.number(), content: z.string().max(1000) }))
      .mutation(async ({ ctx, input }) => {
        const msg = await sendChatMessage(input.matchId, ctx.user.id, input.content);
        // Notify the other user
        const match = await getMatchById(input.matchId);
        if (match) {
          const otherId = match.user1Id === ctx.user.id ? match.user2Id : match.user1Id;
          await createNotification(otherId, "new_message", "New message! 💬", "Your match sent you a message", input.matchId);
        }
        return msg;
      }),
  }),

  // ─── Games ────────────────────────────────────────────────────────────────
  games: router({
    startNewlywed: protectedProcedure
      .input(z.object({ matchId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const match = await getMatchById(input.matchId);
        if (!match) throw new Error("Match not found");

        const user1Profile = await getProfileByUserId(match.user1Id);
        const user2Profile = await getProfileByUserId(match.user2Id);

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are Sally, the warm and fun AI host of Just Putzit's Newlywed Game. Generate 6 personalized quiz questions based on the two users' profiles. Each question asks one person to guess what the other person answered about themselves.`,
            },
            {
              role: "user",
              content: `User 1 profile: ${JSON.stringify(user1Profile?.traits)}
User 2 profile: ${JSON.stringify(user2Profile?.traits)}

Generate 6 questions in this JSON format. Alternate between asking about User 1 and User 2.`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "newlywed_questions",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  questions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        question: { type: "string" },
                        targetUserId: { type: "number" },
                        targetUserName: { type: "string" },
                        correctAnswer: { type: "string" },
                      },
                      required: ["id", "question", "targetUserId", "targetUserName", "correctAnswer"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["questions"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices[0]?.message?.content;
        const parsed = JSON.parse(typeof content === "string" ? content : '{"questions":[]}');
        const questions: GameQuestion[] = parsed.questions || [];

        const session = await createGameSession(input.matchId, "newlywed", questions);
        await createNotification(
          match.user1Id === ctx.user.id ? match.user2Id : match.user1Id,
          "game_ready",
          "Game time! 🎮",
          "Your match wants to play the Newlywed Game with you!",
          session?.id
        );
        return session;
      }),

    startTwoTruths: protectedProcedure
      .input(z.object({ matchId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const match = await getMatchById(input.matchId);
        if (!match) throw new Error("Match not found");

        const user1Profile = await getProfileByUserId(match.user1Id);
        const user2Profile = await getProfileByUserId(match.user2Id);

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are Sally, generating Two Truths and a Lie statements for a fun icebreaker game on Just Putzit. Generate 3 statements per user — 2 truths and 1 lie — based on their profile. Make the lie plausible but subtly off.`,
            },
            {
              role: "user",
              content: `User 1 profile: ${JSON.stringify(user1Profile?.traits)}
User 2 profile: ${JSON.stringify(user2Profile?.traits)}

Return JSON with questions array, each having statements array (3 items) and lieIndex (0, 1, or 2).`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "two_truths",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  questions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        question: { type: "string" },
                        targetUserId: { type: "number" },
                        targetUserName: { type: "string" },
                        statements: { type: "array", items: { type: "string" } },
                        lieIndex: { type: "number" },
                        correctAnswer: { type: "string" },
                      },
                      required: ["id", "question", "targetUserId", "targetUserName", "statements", "lieIndex", "correctAnswer"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["questions"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices[0]?.message?.content;
        const parsed = JSON.parse(typeof content === "string" ? content : '{"questions":[]}');
        const session = await createGameSession(input.matchId, "two_truths", parsed.questions || []);
        return session;
      }),

    startThisOrThat: protectedProcedure
      .input(z.object({ matchId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const match = await getMatchById(input.matchId);
        if (!match) throw new Error("Match not found");

        const user1Profile = await getProfileByUserId(match.user1Id);
        const user2Profile = await getProfileByUserId(match.user2Id);

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are Sally, generating This or That rapid-fire questions for Just Putzit. Create 10 fun either/or questions tailored to the two users' shared interests and personalities.`,
            },
            {
              role: "user",
              content: `User 1 profile: ${JSON.stringify(user1Profile?.traits)}
User 2 profile: ${JSON.stringify(user2Profile?.traits)}

Return JSON with questions array, each having optionA and optionB.`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "this_or_that",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  questions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        question: { type: "string" },
                        optionA: { type: "string" },
                        optionB: { type: "string" },
                        correctAnswer: { type: "string" },
                        targetUserId: { type: "number" },
                        targetUserName: { type: "string" },
                      },
                      required: ["id", "question", "optionA", "optionB", "correctAnswer", "targetUserId", "targetUserName"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["questions"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices[0]?.message?.content;
        const parsed = JSON.parse(typeof content === "string" ? content : '{"questions":[]}');
        const session = await createGameSession(input.matchId, "this_or_that", parsed.questions || []);
        return session;
      }),

    submitAnswer: protectedProcedure
      .input(
        z.object({
          sessionId: z.number(),
          questionId: z.string(),
          answer: z.string(),
          isUser1: z.boolean(),
        })
      )
      .mutation(async ({ input }) => {
        const session = await getGameSession(input.sessionId);
        if (!session) throw new Error("Session not found");

        const questions = session.questions as GameQuestion[];
        const qIndex = questions.findIndex(q => q.id === input.questionId);
        if (qIndex === -1) throw new Error("Question not found");

        const q = questions[qIndex]!;
        if (input.isUser1) {
          q.user1Answer = input.answer;
          q.user1Correct = input.answer.toLowerCase() === q.correctAnswer?.toLowerCase();
        } else {
          q.user2Answer = input.answer;
          q.user2Correct = input.answer.toLowerCase() === q.correctAnswer?.toLowerCase();
        }
        questions[qIndex] = q;

        const user1Score = questions.filter(q => q.user1Correct).length;
        const user2Score = questions.filter(q => q.user2Correct).length;
        const allAnswered = questions.every(q => q.user1Answer && q.user2Answer);

        // For This or That: match % = how often both picked the same option
        const bothAnswered = questions.filter(q => q.user1Answer && q.user2Answer);
        const sameChoices = bothAnswered.filter(
          q => q.user1Answer?.toLowerCase() === q.user2Answer?.toLowerCase()
        ).length;
        const matchPercent = bothAnswered.length > 0
          ? Math.round((sameChoices / bothAnswered.length) * 100)
          : 0;

        let sallyNarration: string | undefined;
        if (allAnswered) {
          const narrationResponse = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `You are Sally, the warm and enthusiastic AI host of Just Putzit. Narrate the game results in a fun, game-show style. Be encouraging and highlight funny or sweet moments from the answers.`,
              },
              {
                role: "user",
                content: session.gameType === "this_or_that"
                  ? `This or That results: the pair matched on ${sameChoices}/${bothAnswered.length} questions (${matchPercent}% match). Questions and answers: ${JSON.stringify(questions)}. Write a 2-3 sentence warm, celebratory narration that highlights the match percentage.`
                  : `Game results: User 1 scored ${user1Score}/${questions.length}, User 2 scored ${user2Score}/${questions.length}. Questions and answers: ${JSON.stringify(questions)}. Write a 2-3 sentence warm, celebratory narration.`,
              },
            ],
          });
          sallyNarration = (narrationResponse.choices[0]?.message?.content as string) || "What a fantastic game!";
        }

        await updateGameSession(input.sessionId, {
          questions,
          user1Score,
          user2Score,
          ...(allAnswered ? { status: "completed", completedAt: new Date(), sallyNarration } : {}),
        });

        return { questions, user1Score, user2Score, isComplete: allAnswered, sallyNarration, matchPercent };
      }),

    getSession: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ input }) => {
        return getGameSession(input.sessionId);
      }),

    getSessionsForMatch: protectedProcedure
      .input(z.object({ matchId: z.number() }))
      .query(async ({ input }) => {
        return getGameSessionsForMatch(input.matchId);
      }),
  }),

  // ─── Safety ─────────────────────────────────────────────────────────────
  safety: router({
    report: protectedProcedure
      .input(z.object({
        reportedUserId: z.number(),
        reason: z.enum(["scammer", "bot", "harassment", "fake_profile", "inappropriate", "other"]),
        details: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await createReport(ctx.user.id, input.reportedUserId, input.reason, input.details);
        return { success: true };
      }),

    block: protectedProcedure
      .input(z.object({ blockedUserId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await blockUser(ctx.user.id, input.blockedUserId);
        return { success: true };
      }),

    getBlockedIds: protectedProcedure.query(async ({ ctx }) => {
      return getBlockedUserIds(ctx.user.id);
    }),

    getReports: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      return getReportsForAdmin();
    }),

    getFlags: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      return getAdminFlags();
    }),

    resolveFlag: protectedProcedure
      .input(z.object({ flagId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        await resolveAdminFlag(input.flagId);
        return { success: true };
      }),

    updateReport: protectedProcedure
      .input(z.object({
        reportId: z.number(),
        status: z.enum(["pending", "reviewed", "actioned", "dismissed"]),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        await updateReportStatus(input.reportId, input.status);
        return { success: true };
      }),

    suspendUser: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        await suspendUser(input.userId);
        return { success: true };
      }),

    getAllUsers: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      return getAllUsers();
    }),

    getStats: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      return getAdminStats();
    }),

    searchUsers: protectedProcedure
      .input(z.object({ query: z.string().default(""), limit: z.number().max(100).default(50), offset: z.number().default(0) }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        return searchUsers(input.query, input.limit, input.offset);
      }),

    getUserDetail: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        return getUserWithProfile(input.userId);
      }),
  }),

  // ─── Venues & Activities ──────────────────────────────────────────────────
  venues: router({
    getAll: protectedProcedure
      .input(z.object({ city: z.string().optional() }))
      .query(async ({ input }) => {
        return getVenuePartners(input.city);
      }),

    getById: protectedProcedure
      .input(z.object({ venueId: z.number() }))
      .query(async ({ input }) => {
        return getVenueById(input.venueId);
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        category: z.enum(["bowling","mini_golf","kayaking","movies","dining","coffee","cooking_class","escape_room","wine_tasting","hiking","park","library","church","community_center","sports","arts","other"]),
        description: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        phone: z.string().optional(),
        website: z.string().optional(),
        referralFeePerVisit: z.number().default(100),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        return createVenuePartner(input);
      }),
  }),

  activityBoard: router({
    getAll: protectedProcedure
      .input(z.object({ city: z.string().optional(), category: z.string().optional() }))
      .query(async ({ input }) => {
        return getActivityListings(input.city, input.category);
      }),

    getById: protectedProcedure
      .input(z.object({ activityId: z.number() }))
      .query(async ({ input }) => {
        return getActivityById(input.activityId);
      }),

    create: protectedProcedure
      .input(z.object({
        venueId: z.number(),
        title: z.string(),
        description: z.string().optional(),
        category: z.enum(["bowling","mini_golf","kayaking","movies","dining","coffee","cooking_class","escape_room","wine_tasting","hiking","park","library","church","community_center","sports","arts","other"]),
        eventDate: z.string().optional(),
        durationMinutes: z.number().optional(),
        maxGroupSize: z.number().optional(),
        isRecurring: z.boolean().optional(),
        recurringSchedule: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        return createActivityListing({
          ...input,
          eventDate: input.eventDate ? new Date(input.eventDate) : undefined,
        });
      }),

    rsvp: protectedProcedure
      .input(z.object({ activityId: z.number(), matchId: z.number().optional() }))
      .mutation(async ({ ctx, input }) => {
        return rsvpToActivity(input.activityId, ctx.user.id, input.matchId);
      }),

    checkIn: protectedProcedure
      .input(z.object({ activityId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await checkInToActivity(input.activityId, ctx.user.id);
        return { success: true };
      }),

    getRsvps: protectedProcedure
      .input(z.object({ activityId: z.number() }))
      .query(async ({ input }) => {
        return getRsvpsForActivity(input.activityId);
      }),

    getSallyRecommendations: protectedProcedure
      .input(z.object({ matchId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        const profile = await getProfileByUserId(ctx.user.id);
        const allActivities = await getActivityListings();

        if (allActivities.length === 0) {
          return {
            sallyMessage: "Hey there! I'm scouting your area for amazing activities right now! Check back soon — I'll have personalized picks just for you. In the meantime, explore the map below! 🗺️",
            activities: [],
          };
        }

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are Sally from Just Putzit. Based on a user's profile, recommend activities and write a warm 1-2 sentence message suggesting what they should do this weekend.`,
            },
            {
              role: "user",
              content: `User profile: ${JSON.stringify(profile?.traits)}\nAvailable activities: ${JSON.stringify(allActivities.slice(0, 10))}\n\nReturn JSON: { sallyMessage: string, recommendedActivityIds: number[] }`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "sally_recs",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  sallyMessage: { type: "string" },
                  recommendedActivityIds: { type: "array", items: { type: "number" } },
                },
                required: ["sallyMessage", "recommendedActivityIds"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices[0]?.message?.content;
        const parsed = JSON.parse(typeof content === "string" ? content : "{}");
        const recommended = allActivities.filter((a: { id: number }) => parsed.recommendedActivityIds?.includes(a.id));
        return {
          sallyMessage: parsed.sallyMessage || "I found some great activities for you this weekend!",
          activities: recommended.length > 0 ? recommended : allActivities.slice(0, 4),
        };
      }),
  }),

  // ─── Community Groups ─────────────────────────────────────────────────────
  community: router({
    getGroups: protectedProcedure
      .input(z.object({ city: z.string().optional() }))
      .query(async ({ input }) => {
        return getCommunityGroups(input.city);
      }),

    createGroup: protectedProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        category: z.enum(["book_club","hiking","cooking","sports","arts","music","gaming","travel","fitness","social","other"]),
        city: z.string().optional(),
        maxMembers: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const group = await createCommunityGroup({ ...input, createdByUserId: ctx.user.id });
        if (group) await joinCommunityGroup(group.id, ctx.user.id);
        return group;
      }),

    joinGroup: protectedProcedure
      .input(z.object({ groupId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await joinCommunityGroup(input.groupId, ctx.user.id);
        return { success: true };
      }),

    getMembers: protectedProcedure
      .input(z.object({ groupId: z.number() }))
      .query(async ({ input }) => {
        return getGroupMembers(input.groupId);
      }),
  }),

  // ─── Marketplace (ticket booking) ─────────────────────────────────────────
  marketplace: router({
    browse: protectedProcedure
      .input(z.object({ category: z.string().optional(), ticketsOnly: z.boolean().optional() }))
      .query(async ({ input }) => {
        const listings = await getActivityListings(undefined, input.category);
        const enriched = await Promise.all(
          listings.map(async (l) => {
            const venue = await getVenueById(l.venueId);
            return { ...l, venue };
          })
        );
        return input.ticketsOnly ? enriched.filter(l => l.hasTickets) : enriched;
      }),

    getListing: protectedProcedure
      .input(z.object({ activityId: z.number() }))
      .query(async ({ input }) => {
        const listing = await getActivityById(input.activityId);
        if (!listing) return null;
        const venue = await getVenueById(listing.venueId);
        return { ...listing, venue };
      }),

    book: protectedProcedure
      .input(z.object({
        activityId: z.number(),
        partySize: z.number().min(1).max(20),
        matchId: z.number().optional(),
        scheduledFor: z.string().optional(),
        notes: z.string().max(500).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const listing = await getActivityById(input.activityId);
        if (!listing) throw new Error("Activity not found");
        const venue = await getVenueById(listing.venueId);

        // Users are ALWAYS FREE. priceCents is what the venue charges; we track
        // commission + referral as what the VENDOR owes the platform.
        const unit = listing.priceCents ?? 0;
        const total = unit * input.partySize;
        const commissionPct = venue?.commissionPct ?? 12;
        const commission = Math.round((total * commissionPct) / 100);
        const referralFee = (venue?.referralFeePerVisit ?? 100) * input.partySize;
        const bookingType = listing.hasTickets ? "ticket" : (unit > 0 ? "reservation" : "rsvp_free");

        const booking = await createBooking({
          userId: ctx.user.id,
          activityId: listing.id,
          venueId: listing.venueId,
          matchId: input.matchId,
          partySize: input.partySize,
          unitPriceCents: unit,
          totalPriceCents: total,
          commissionCents: commission,
          referralFeeCents: referralFee,
          bookingType,
          confirmationCode: genCode("JP"),
          scheduledFor: input.scheduledFor ? new Date(input.scheduledFor) : undefined,
          notes: input.notes,
        });
        await recordReferralVisit(listing.id);
        await createNotification(
          ctx.user.id, "new_match", "Booking confirmed! 🎟️",
          `You're all set for ${listing.title}. Show up and have fun!`, booking?.id
        );
        return booking;
      }),

    myBookings: protectedProcedure.query(async ({ ctx }) => {
      const myBookings = await getBookingsForUser(ctx.user.id);
      return Promise.all(myBookings.map(async (b) => {
        const activity = await getActivityById(b.activityId);
        const venue = await getVenueById(b.venueId);
        return { ...b, activity, venue };
      }));
    }),

    cancel: protectedProcedure
      .input(z.object({ bookingId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await cancelBooking(input.bookingId, ctx.user.id);
        return { success: true };
      }),
  }),

  // ─── Sally Date Concierge ─────────────────────────────────────────────────
  concierge: router({
    plan: protectedProcedure
      .input(z.object({
        occasion: z.string().max(120),
        vibe: z.string().max(200),
        location: z.string().max(200),
        budgetDollars: z.number().min(0).max(2000),
        partySize: z.number().min(1).max(20),
        preferredDate: z.string().optional(),
        dietaryNotes: z.string().max(300).optional(),
        matchId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const profile = await getProfileByUserId(ctx.user.id);
        const budgetCents = Math.round(input.budgetDollars * 100);
        const venues = await getVenuePartners(profile?.city ?? undefined);

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are Sally, the warm AI date concierge for Just Putzit. You design delightful, realistic real-world outings (picnics, park dates, food deliveries to a location, fun activities). You arrange everything: Sally contacts local vendors and coordinates food/supplies delivery to the spot. Keep it warm, specific, and doable within budget. Users never pay Just Putzit — local vendors do.`,
            },
            {
              role: "user",
              content: `Plan a ${input.occasion}. Vibe: ${input.vibe}. Location/area: ${input.location}. Budget: $${input.budgetDollars} for ${input.partySize} people. Preferred date: ${input.preferredDate ?? "flexible"}. Dietary notes: ${input.dietaryNotes ?? "none"}. User profile: ${JSON.stringify(profile?.traits ?? {})}. Nearby partner venues (optional to use): ${JSON.stringify(venues.slice(0, 8).map(v => ({ name: v.name, category: v.category })))}.\n\nReturn JSON: { title: string, summary: string (2-3 warm sentences from Sally), items: [{ label, detail, estCostCents, vendorName }] (3-5 items), estTotalCents: number }. Keep estTotalCents within budget.`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "concierge_plan",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  summary: { type: "string" },
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        label: { type: "string" },
                        detail: { type: "string" },
                        estCostCents: { type: "number" },
                        vendorName: { type: "string" },
                      },
                      required: ["label", "detail", "estCostCents", "vendorName"],
                      additionalProperties: false,
                    },
                  },
                  estTotalCents: { type: "number" },
                },
                required: ["title", "summary", "items", "estTotalCents"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices[0]?.message?.content;
        const parsed = JSON.parse(typeof content === "string" ? content : "{}");
        const items: ConciergePlanItem[] = parsed.items ?? [];

        const reqRow = await createConciergeRequest({
          userId: ctx.user.id,
          matchId: input.matchId,
          occasion: input.occasion,
          vibe: input.vibe,
          location: input.location,
          budgetCents,
          partySize: input.partySize,
          preferredDate: input.preferredDate ? new Date(input.preferredDate) : undefined,
          dietaryNotes: input.dietaryNotes,
          sallyPlanTitle: parsed.title ?? "Your Sally-planned outing",
          sallyPlanSummary: parsed.summary ?? "",
          sallyPlanItems: items,
          estTotalCents: parsed.estTotalCents ?? 0,
          status: "proposed",
        });
        return reqRow;
      }),

    confirm: protectedProcedure
      .input(z.object({ requestId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const reqRow = await getConciergeRequestById(input.requestId);
        if (!reqRow || reqRow.userId !== ctx.user.id) throw new Error("Not found");
        await updateConciergeRequest(input.requestId, { status: "arranged" });
        await createNotification(
          ctx.user.id, "new_match", "Sally is on it! 🌟",
          `I'm arranging "${reqRow.sallyPlanTitle}" and coordinating with local vendors. I'll confirm details soon!`, reqRow.id
        );
        return { success: true };
      }),

    myRequests: protectedProcedure.query(async ({ ctx }) => {
      return getConciergeRequestsForUser(ctx.user.id);
    }),
  }),

  // ─── Vendor Partner Portal ────────────────────────────────────────────────
  vendor: router({
    myVenues: protectedProcedure.query(async ({ ctx }) => {
      const venues = await getVenuesByOwner(ctx.user.id);
      return Promise.all(venues.map(async (v) => {
        const listings = await getListingsByVenue(v.id);
        const venueBookings = await getBookingsForVenue(v.id);
        const totalReferrals = listings.reduce((s, l) => s + (l.totalReferrals ?? 0), 0);
        const referralRevenueCents = venueBookings.reduce((s, b) => s + (b.referralFeeCents ?? 0), 0);
        const commissionPaidCents = venueBookings.reduce((s, b) => s + (b.commissionCents ?? 0), 0);
        return { ...v, listings, bookingCount: venueBookings.length, totalReferrals, referralRevenueCents, commissionPaidCents };
      }));
    }),

    registerVenue: protectedProcedure
      .input(z.object({
        name: z.string().min(2).max(200),
        category: z.enum(["bowling","mini_golf","kayaking","movies","dining","coffee","cooking_class","escape_room","wine_tasting","hiking","park","library","church","community_center","sports","arts","other"]),
        description: z.string().max(1000).optional(),
        address: z.string().max(300).optional(),
        city: z.string().max(100).optional(),
        phone: z.string().max(30).optional(),
        website: z.string().max(300).optional(),
        contactEmail: z.string().max(320).optional(),
        referralFeePerVisit: z.number().min(0).max(5000),
      }))
      .mutation(async ({ ctx, input }) => {
        return createVenuePartner({ ...input, ownerUserId: ctx.user.id });
      }),

    addListing: protectedProcedure
      .input(z.object({
        venueId: z.number(),
        title: z.string().min(2).max(200),
        description: z.string().max(1000).optional(),
        category: z.enum(["bowling","mini_golf","kayaking","movies","dining","coffee","cooking_class","escape_room","wine_tasting","hiking","park","library","church","community_center","sports","arts","other"]),
        priceDollars: z.number().min(0).max(2000),
        hasTickets: z.boolean(),
        imageEmoji: z.string().max(10).optional(),
        maxGroupSize: z.number().min(1).max(100).optional(),
        recurringSchedule: z.string().max(100).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const venue = await getVenueById(input.venueId);
        if (!venue || venue.ownerUserId !== ctx.user.id) throw new Error("You do not own this venue");
        return createActivityListing({
          venueId: input.venueId,
          title: input.title,
          description: input.description,
          category: input.category,
          priceCents: Math.round(input.priceDollars * 100),
          hasTickets: input.hasTickets,
          imageEmoji: input.imageEmoji || "🎉",
          maxGroupSize: input.maxGroupSize,
          recurringSchedule: input.recurringSchedule,
          isRecurring: !!input.recurringSchedule,
        });
      }),

    venueBookings: protectedProcedure
      .input(z.object({ venueId: z.number() }))
      .query(async ({ ctx, input }) => {
        const venue = await getVenueById(input.venueId);
        if (!venue || venue.ownerUserId !== ctx.user.id) throw new Error("Forbidden");
        return getBookingsForVenue(input.venueId);
      }),

    myListings: protectedProcedure.query(async ({ ctx }) => {
      return getListingsForOwner(ctx.user.id);
    }),
  }),

  // ─── Couples Network (couple-to-couple) ───────────────────────────────────
  couples: router({
    getMyCouple: protectedProcedure.query(async ({ ctx }) => {
      return getCoupleLinkForUser(ctx.user.id);
    }),

    saveCouple: protectedProcedure
      .input(z.object({
        partnerName: z.string().min(1).max(100),
        partnerEmail: z.string().max(320).optional(),
        relationshipLength: z.string().max(60).optional(),
        sharedInterests: z.array(z.string()).optional(),
        lookingFor: z.string().max(500).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await getOrCreateProfile(ctx.user.id);
        await updateProfile(ctx.user.id, { networkType: "couples" });
        return upsertCoupleLink(ctx.user.id, input);
      }),

    findCoupleMatches: protectedProcedure.mutation(async ({ ctx }) => {
      const mine = await getCoupleLinkForUser(ctx.user.id);
      if (!mine) throw new Error("Create your couple profile first");
      const all = await getAllCoupleLinks();
      const candidates = all.filter(c => c.userId !== ctx.user.id);
      const newMatches = [];
      for (const cand of candidates.slice(0, 5)) {
        const already = await existingCoupleMatch(ctx.user.id, cand.userId);
        if (already) continue;
        const result = await invokeLLM({
          messages: [
            { role: "system", content: "You are Sally, matching couples for couple-to-couple friendships and double dates on Just Putzit. Score compatibility for shared activities and vibe." },
            { role: "user", content: `Couple A: ${JSON.stringify({ interests: mine.sharedInterests, lookingFor: mine.lookingFor, relationshipLength: mine.relationshipLength })}\nCouple B: ${JSON.stringify({ interests: cand.sharedInterests, lookingFor: cand.lookingFor, relationshipLength: cand.relationshipLength })}\n\nReturn JSON: { score: number 0-100, reason: string (1-2 warm sentences) }` },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "couple_match", strict: true,
              schema: { type: "object", properties: { score: { type: "number" }, reason: { type: "string" } }, required: ["score", "reason"], additionalProperties: false },
            },
          },
        });
        const content = result.choices[0]?.message?.content;
        const parsed = JSON.parse(typeof content === "string" ? content : "{}");
        const score = Math.min(100, Math.max(0, Math.round(parsed.score ?? 70)));
        if (score >= 55) {
          const m = await createCoupleMatch(ctx.user.id, cand.userId, score, parsed.reason ?? "You two couples would have a blast together!");
          if (m) newMatches.push({ ...m, otherCouple: cand });
        }
      }
      return { matches: newMatches };
    }),

    getMyCoupleMatches: protectedProcedure.query(async ({ ctx }) => {
      const ms = await getCoupleMatchesForUser(ctx.user.id);
      return Promise.all(ms.map(async (m) => {
        const otherUserId = m.couple1UserId === ctx.user.id ? m.couple2UserId : m.couple1UserId;
        const otherCouple = await getCoupleLinkForUser(otherUserId);
        const otherProfile = await getProfileByUserId(otherUserId);
        return { ...m, otherCouple, otherProfile, otherUserId };
      }));
    }),
  }),

  // ─── Would You Rather (low AI cost: questions pre-written in DB) ───────────
  wyr: router({
    // Returns a shuffled batch of questions the user hasn't answered yet.
    getBatch: protectedProcedure
      .input(z.object({ category: z.string().optional(), limit: z.number().min(1).max(30).optional() }))
      .query(async ({ ctx, input }) => {
        const all = await getWyrQuestions(input.category ?? "all");
        const answered = new Set(await getWyrAnsweredQuestionIds(ctx.user.id));
        const unanswered = all.filter((q) => !answered.has(q.id));
        // Shuffle (Fisher-Yates) so order varies each session.
        for (let i = unanswered.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [unanswered[i], unanswered[j]] = [unanswered[j], unanswered[i]];
        }
        const limit = input.limit ?? 10;
        return {
          questions: unanswered.slice(0, limit),
          totalAnswered: answered.size,
          totalAvailable: all.length,
        };
      }),

    // Records the answer and returns the honest crowd split for that question.
    // NOTE: No AI call here -> zero token cost per play.
    answer: protectedProcedure
      .input(z.object({ questionId: z.number(), choice: z.enum(["A", "B"]) }))
      .mutation(async ({ ctx, input }) => {
        await recordWyrAnswer(ctx.user.id, input.questionId, input.choice);
        const split = await getWyrSplit(input.questionId);
        const total = split.a + split.b;
        return {
          yourChoice: input.choice,
          countA: split.a,
          countB: split.b,
          percentA: total === 0 ? 0 : Math.round((split.a / total) * 100),
          percentB: total === 0 ? 0 : Math.round((split.b / total) * 100),
          totalVotes: total,
        };
      }),

    stats: protectedProcedure.query(async ({ ctx }) => {
      const count = await getWyrAnswerCount(ctx.user.id);
      return { answered: count };
    }),
  }),

  // ─── Notifications ────────────────────────────────────────────────────────
  notifications: router({
    getAll: protectedProcedure.query(async ({ ctx }) => {
      return getNotificationsForUser(ctx.user.id);
    }),

    markRead: protectedProcedure
      .input(z.object({ notifId: z.number() }))
      .mutation(async ({ input }) => {
        await markNotificationRead(input.notifId);
        return { success: true };
      }),

    markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
      await markAllNotificationsRead(ctx.user.id);
      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;

// ─── Helper functions ─────────────────────────────────────────────────────────

async function generateFollowUpQuestion(traits: ProfileTraits, interviewCount: number): Promise<string> {
  const covered = Object.keys(traits);
  const topics = ["travel dreams", "childhood memories", "bucket list", "quirky habits", "values", "friendship style", "sense of humor"];
  const uncovered = topics.filter(t => !covered.some(c => c.toLowerCase().includes(t.split(" ")[0]!)));
  const topic = uncovered[interviewCount % uncovered.length] || topics[0]!;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are Sally from Just Putzit. Generate ONE fun, open-ended interview question about the given topic. Keep it warm and conversational. Return just the question text.",
      },
      { role: "user", content: `Topic: ${topic}. Existing profile: ${JSON.stringify(traits)}` },
    ],
  });
  return (response.choices[0]?.message?.content as string) || "What's something that always makes you smile?";
}

async function extractTraitsFromInterview(messages: InterviewMessage[], existingTraits: ProfileTraits): Promise<ProfileTraits> {
  const conversation = messages.map(m => `${m.role}: ${m.content}`).join("\n");

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `Extract personality traits and preferences from this interview conversation. Return a JSON object with relevant fields like hobbies, favoriteActivities, personalityKeywords, dreamVacation, favoriteFood, morningOrNight, biggestPetPeeve, guiltPleasure, idealWeekend, funFact, lookingFor, idealDate, perfectSunday. Only include fields that were actually discussed.`,
      },
      { role: "user", content: conversation },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "profile_traits",
        strict: false,
        schema: {
          type: "object",
          properties: {
            hobbies: { type: "array", items: { type: "string" } },
            favoriteActivities: { type: "array", items: { type: "string" } },
            personalityKeywords: { type: "array", items: { type: "string" } },
            dreamVacation: { type: "string" },
            favoriteFood: { type: "string" },
            morningOrNight: { type: "string" },
            biggestPetPeeve: { type: "string" },
            guiltPleasure: { type: "string" },
            idealWeekend: { type: "string" },
            funFact: { type: "string" },
            lookingFor: { type: "string" },
            idealDate: { type: "string" },
            perfectSunday: { type: "string" },
          },
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content as string | undefined;
  try {
    return JSON.parse(typeof content === "string" ? content : "{}");
  } catch {
    return {};
  }
}

async function generateProfileSummary(traits: ProfileTraits, userName: string): Promise<string> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are Sally from Just Putzit. Write a warm, 2-3 sentence personality summary for ${userName} based on their profile traits. Make it feel like a glowing introduction from a best friend. Be specific and genuine.`,
      },
      { role: "user", content: JSON.stringify(traits) },
    ],
  });
  return (response.choices[0]?.message?.content as string) || `${userName} is a wonderful person with a great personality!`;
}

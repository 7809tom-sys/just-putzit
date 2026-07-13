import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { triviaPursuitRooms, triviaPursuitRoomPlayers, triviaPursuitAnswers, triviaPursuitQuestions } from "../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";

// Generate a unique game code
function generateGameCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export const triviaPursuitRouter = router({
  // Create a new Trivia Pursuit room
  createRoom: protectedProcedure
    .input(z.object({
      categoryIds: z.array(z.number()).min(1).max(5),
      maxPlayers: z.number().min(1).max(10).default(10),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const gameCode = generateGameCode();
      await db.insert(triviaPursuitRooms).values({
        gameCode,
        hostUserId: ctx.user.id,
        status: "waiting",
        maxPlayers: input.maxPlayers,
        categoryIds: input.categoryIds,
        currentQuestionIndex: 0,
        questionIds: [],
      });

      // Get the created room
      const rooms = await db.select().from(triviaPursuitRooms).where(eq(triviaPursuitRooms.gameCode, gameCode)).limit(1);
      const roomId = rooms[0]?.id;

      if (!roomId) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create room" });
      }

      // Host joins automatically
      await db.insert(triviaPursuitRoomPlayers).values({
        roomId,
        userId: ctx.user.id,
        score: 0,
        correctAnswers: 0,
        isReady: true,
      });

      return { gameCode, roomId };
    }),

  // Join an existing room
  joinRoom: protectedProcedure
    .input(z.object({ gameCode: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const rooms = await db.select().from(triviaPursuitRooms).where(eq(triviaPursuitRooms.gameCode, input.gameCode)).limit(1);
      const room = rooms[0];

      if (!room) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Game not found" });
      }

      if (room.status !== "waiting") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Game already started" });
      }

      // Check if user already in room
      const existing = await db.select().from(triviaPursuitRoomPlayers)
        .where(and(eq(triviaPursuitRoomPlayers.roomId, room.id), eq(triviaPursuitRoomPlayers.userId, ctx.user.id)))
        .limit(1);

      if (existing.length > 0) {
        return { success: true, roomId: room.id };
      }

      // Check player count
      const playerCount = await db.select().from(triviaPursuitRoomPlayers).where(eq(triviaPursuitRoomPlayers.roomId, room.id));

      if (playerCount.length >= room.maxPlayers) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Room is full" });
      }

      await db.insert(triviaPursuitRoomPlayers).values({
        roomId: room.id,
        userId: ctx.user.id,
        score: 0,
        correctAnswers: 0,
        isReady: false,
      });

      return { success: true, roomId: room.id };
    }),

  // Get room details
  getRoom: protectedProcedure
    .input(z.object({ roomId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const rooms = await db.select().from(triviaPursuitRooms).where(eq(triviaPursuitRooms.id, input.roomId)).limit(1);
      const room = rooms[0];

      if (!room) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });
      }

      const players = await db.select().from(triviaPursuitRoomPlayers).where(eq(triviaPursuitRoomPlayers.roomId, room.id));

      // Get questions for the selected categories
      const categoryIds = room.categoryIds as number[];
      const questions = categoryIds.length > 0
        ? await db.select().from(triviaPursuitQuestions).where(
            sql`${triviaPursuitQuestions.categoryId} IN (${sql.join(categoryIds.map((id) => sql`${id}`), sql`, `)})`
          )
        : [];

      return {
        id: room.id,
        gameCode: room.gameCode,
        status: room.status,
        players: players.map((p) => ({ userId: p.userId, score: p.score, correctAnswers: p.correctAnswers, isReady: p.isReady })),
        questions: questions.map((q) => ({ id: q.id, categoryId: q.categoryId, question: q.question, answered: false })),
        currentQuestionIndex: room.currentQuestionIndex,
      };
    }),

  // Get next question
  nextQuestion: protectedProcedure
    .input(z.object({ roomId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const rooms = await db.select().from(triviaPursuitRooms).where(eq(triviaPursuitRooms.id, input.roomId)).limit(1);
      const room = rooms[0];

      if (!room) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });
      }

      // Get questions for the selected categories
      const categoryIds = room.categoryIds as number[];
      const questions = categoryIds.length > 0
        ? await db.select().from(triviaPursuitQuestions).where(
            sql`${triviaPursuitQuestions.categoryId} IN (${sql.join(categoryIds.map((id) => sql`${id}`), sql`, `)})`
          )
        : [];

      const nextIndex = room.currentQuestionIndex + 1;
      if (nextIndex >= questions.length) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No more questions" });
      }

      const question = questions[nextIndex];

      // Update room
      await db.update(triviaPursuitRooms)
        .set({ currentQuestionIndex: nextIndex })
        .where(eq(triviaPursuitRooms.id, room.id));

      return {
        questionId: question.id,
        question: question.question,
        optionA: question.optionA,
        optionB: question.optionB,
        optionC: question.optionC,
        optionD: question.optionD,
        // Client will use TTS on this question text
        ttsText: question.question,
      };
    }),

  // Submit an answer
  submitAnswer: protectedProcedure
    .input(z.object({
      roomId: z.number(),
      questionId: z.number(),
      answer: z.enum(["A", "B", "C", "D"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const questions = await db.select().from(triviaPursuitQuestions).where(eq(triviaPursuitQuestions.id, input.questionId)).limit(1);
      const question = questions[0];

      if (!question) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Question not found" });
      }

      const isCorrect = input.answer === question.correctAnswer;
      const pointsAwarded = isCorrect ? 100 : 0;

      // Save answer
      await db.insert(triviaPursuitAnswers).values({
        roomId: input.roomId,
        userId: ctx.user.id,
        questionId: input.questionId,
        answer: input.answer,
        isCorrect,
        answeredAtMs: Date.now(),
      });

      // Update player score
      if (isCorrect) {
        const players = await db.select().from(triviaPursuitRoomPlayers)
          .where(and(eq(triviaPursuitRoomPlayers.roomId, input.roomId), eq(triviaPursuitRoomPlayers.userId, ctx.user.id)))
          .limit(1);
        const player = players[0];

        if (player) {
          await db.update(triviaPursuitRoomPlayers)
            .set({
              score: player.score + pointsAwarded,
              correctAnswers: player.correctAnswers + 1,
            })
            .where(eq(triviaPursuitRoomPlayers.id, player.id));
        }
      }

      return { isCorrect, pointsAwarded, correctAnswer: question.correctAnswer };
    }),

  // Send chat message
  chat: protectedProcedure
    .input(z.object({ roomId: z.number(), message: z.string().max(500) }))
    .mutation(async ({ ctx, input }) => {
      // TODO: Save to gameChatMessages table
      return { success: true };
    }),

  // Get scoreboard
  getScoreboard: protectedProcedure
    .input(z.object({ roomId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const players = await db.select().from(triviaPursuitRoomPlayers).where(eq(triviaPursuitRoomPlayers.roomId, input.roomId));

      return {
        players: players
          .sort((a, b) => b.score - a.score)
          .map((p, idx) => ({
            rank: idx + 1,
            userId: p.userId,
            score: p.score,
            correctAnswers: p.correctAnswers,
          })),
      };
    }),

  // Start the game
  startGame: protectedProcedure
    .input(z.object({ roomId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const rooms = await db.select().from(triviaPursuitRooms).where(eq(triviaPursuitRooms.id, input.roomId)).limit(1);
      const room = rooms[0];

      if (!room) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });
      }

      if (room.hostUserId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only host can start game" });
      }

      await db.update(triviaPursuitRooms)
        .set({ status: "in_progress", startedAt: new Date() })
        .where(eq(triviaPursuitRooms.id, room.id));

      return { success: true };
    }),

  // End the game
  endGame: protectedProcedure
    .input(z.object({ roomId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const rooms = await db.select().from(triviaPursuitRooms).where(eq(triviaPursuitRooms.id, input.roomId)).limit(1);
      const room = rooms[0];

      if (!room) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });
      }

      if (room.hostUserId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only host can end game" });
      }

      await db.update(triviaPursuitRooms)
        .set({ status: "completed", completedAt: new Date() })
        .where(eq(triviaPursuitRooms.id, room.id));

      return { success: true };
    }),
});

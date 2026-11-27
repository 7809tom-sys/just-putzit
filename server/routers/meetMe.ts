import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { MEET_ME_VENUE_TYPES } from "../../shared/meetMePolicy";
import { protectedProcedure, router } from "../_core/trpc";
import {
  acknowledgeMeetMeGreeting,
  blockMeetMeEncounter,
  dismissMeetMeEncounter,
  generateMeetMeIcebreaker,
  getMeetMeState,
  greetMeetMeEncounter,
  isMeetMeEnabled,
  listMeetMeVenues,
  openMeetMeEncounter,
  pollMeetMe,
  reportMeetMeEncounter,
  startMeetMeSession,
  stopMeetMeSession,
} from "../meetMe/service";

/**
 * Meet Me is behind a server-side flag. The client toggle cannot force it on: every
 * mutation below refuses before it touches the database when the flag is off.
 */
function assertMeetMeEnabled() {
  if (!isMeetMeEnabled()) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Meet Me is not available yet." });
  }
}

const venueType = z.enum(MEET_ME_VENUE_TYPES);
const reportReason = z.enum(["scammer", "bot", "harassment", "fake_profile", "inappropriate", "other"]);

export const meetMeRouter = router({
  /** Reads the flag even when Meet Me is off so the UI can explain itself. */
  getState: protectedProcedure.query(async ({ ctx }) => getMeetMeState(ctx.user.id)),

  listVenues: protectedProcedure
    .input(z.object({ city: z.string().max(100).optional() }).optional())
    .query(async ({ input }) => listMeetMeVenues(input?.city)),

  start: protectedProcedure
    .input(z.object({ venueType, venueId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      assertMeetMeEnabled();
      const session = await startMeetMeSession(ctx.user.id, input.venueType, input.venueId);
      return { session };
    }),

  stop: protectedProcedure
    .input(z.object({ sessionId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      assertMeetMeEnabled();
      return stopMeetMeSession(ctx.user.id, input.sessionId);
    }),

  /** Writes are intentional: this is where a reveal is created and nudge text is stored. */
  poll: protectedProcedure
    .input(z.object({ sessionId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      assertMeetMeEnabled();
      return pollMeetMe(ctx.user.id, input.sessionId);
    }),

  open: protectedProcedure
    .input(z.object({ encounterId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      assertMeetMeEnabled();
      return openMeetMeEncounter(ctx.user.id, input.encounterId);
    }),

  icebreaker: protectedProcedure
    .input(z.object({ encounterId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      assertMeetMeEnabled();
      return generateMeetMeIcebreaker(ctx.user.id, input.encounterId);
    }),

  greet: protectedProcedure
    .input(z.object({ encounterId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      assertMeetMeEnabled();
      return greetMeetMeEncounter(ctx.user.id, input.encounterId);
    }),

  dismiss: protectedProcedure
    .input(z.object({ encounterId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      assertMeetMeEnabled();
      return dismissMeetMeEncounter(ctx.user.id, input.encounterId);
    }),

  block: protectedProcedure
    .input(z.object({ encounterId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      assertMeetMeEnabled();
      return blockMeetMeEncounter(ctx.user.id, input.encounterId);
    }),

  report: protectedProcedure
    .input(z.object({ encounterId: z.number().int().positive(), reason: reportReason }))
    .mutation(async ({ ctx, input }) => {
      assertMeetMeEnabled();
      return reportMeetMeEncounter(ctx.user.id, input.encounterId, input.reason);
    }),

  acknowledgeGreeting: protectedProcedure
    .input(z.object({ nudgeId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      assertMeetMeEnabled();
      return acknowledgeMeetMeGreeting(ctx.user.id, input.nudgeId);
    }),
});

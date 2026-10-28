import { z } from "zod";
import { ORGANIZER_KINDS } from "../../shared/localDiscovery/model";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import { getHappeningNearYou } from "../localDiscovery/service";
import { addFeed, listFeeds, listOverrides, removeFeed, removeVenueOverride, setVenueOverride } from "../localDiscovery/store";

const matchType = z.enum(["date", "friends", "gym_buddy"]);

export const localDiscoveryRouter = router({
  happeningNearYou: protectedProcedure
    .input(z.object({
      city: z.string().max(100).optional(),
      state: z.string().max(32).optional(),
      postalCode: z.string().max(16).optional(),
      lat: z.number().min(-90).max(90).optional(),
      lng: z.number().min(-180).max(180).optional(),
      radiusMiles: z.number().min(1).max(50).optional(),
      matchType: matchType.optional(),
      interests: z.array(z.string().max(80)).max(20).optional(),
    }))
    .query(async ({ ctx, input }) => getHappeningNearYou({ ...input, userId: ctx.user.id })),

  listFeeds: adminProcedure
    .input(z.object({ areaKey: z.string().min(3).max(160) }))
    .query(async ({ input }) => listFeeds([input.areaKey])),

  addFeed: adminProcedure
    .input(z.object({
      areaKey: z.string().min(3).max(160),
      url: z.string().url().max(500),
      feedKind: z.enum(["ics", "rss", "jsonld", "html"]),
      label: z.string().min(1).max(160),
      organizerKind: z.enum(ORGANIZER_KINDS),
    }))
    .mutation(async ({ input }) => {
      await addFeed(input);
      return { success: true };
    }),

  removeFeed: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      await removeFeed(input.id);
      return { success: true };
    }),

  listOverrides: adminProcedure.query(async () => listOverrides()),

  setVenueOverride: adminProcedure
    .input(z.object({
      displayName: z.string().min(1).max(255),
      city: z.string().max(100).optional(),
      classification: z.enum(["local", "chain"]),
      note: z.string().max(280).optional(),
    }))
    .mutation(async ({ input }) => {
      await setVenueOverride(input);
      return { success: true };
    }),

  removeVenueOverride: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      await removeVenueOverride(input.id);
      return { success: true };
    }),
});

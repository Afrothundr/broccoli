import { z } from "zod";
import type { NotificationSettings } from "@prisma/client";
import { router, protectedProcedure } from "./trpc";
import { prisma } from "./db";

// Push registration + nudge preferences (PRD Pillar 4). The app registers its
// Expo push token after sign-in; users tune quiet hours and can turn nudges
// off entirely. Actual sending lives in nudges.ts (internal.sendNudges).

const HOUR = z.number().int().min(0).max(23);

async function ensureSettings(
  userId: string,
  timezone?: string
): Promise<NotificationSettings> {
  return prisma.notificationSettings.upsert({
    where: { userId },
    create: { userId, ...(timezone ? { timezone } : {}) },
    update: timezone ? { timezone } : {},
  });
}

export const pushRouter = router({
  // Called by the app whenever it has a fresh Expo token. Upserting by token
  // also re-homes a device that switched accounts. The device's IANA timezone
  // rides along so quiet hours mean *their* evening.
  register: protectedProcedure
    .input(z.object({ token: z.string().min(10), timezone: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      await prisma.pushToken.upsert({
        where: { token: input.token },
        create: { token: input.token, userId: ctx.user.id },
        update: { userId: ctx.user.id },
      });
      await ensureSettings(ctx.user.id, input.timezone);
      return { ok: true as const };
    }),

  // Sign-out / notifications disabled on the device.
  unregister: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await prisma.pushToken.deleteMany({
        where: { token: input.token, userId: ctx.user.id },
      });
      return { ok: true as const };
    }),

  getSettings: protectedProcedure.query(
    async ({ ctx }): Promise<NotificationSettings> => ensureSettings(ctx.user.id)
  ),

  updateSettings: protectedProcedure
    .input(
      z.object({
        nudgesEnabled: z.boolean().optional(),
        quietHoursStart: HOUR.optional(),
        quietHoursEnd: HOUR.optional(),
        timezone: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }): Promise<NotificationSettings> => {
      await ensureSettings(ctx.user.id);
      return prisma.notificationSettings.update({
        where: { userId: ctx.user.id },
        data: input,
      });
    }),
});

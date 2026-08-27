import { z } from "zod";
import type { MealName, MealWindow, NotificationSettings } from "@prisma/client";
import { router, protectedProcedure } from "./trpc";
import { prisma } from "./db";
import {
  AT_RISK_HOURS,
  WEEK_AHEAD_HOURS,
  composeNudge,
  composeWeekAheadNudge,
  localDay,
  localDayBit,
  localMinuteOfDay,
  sendToExpo,
  type PushMessage,
} from "./nudges";

// Meal-time prompts (PRD Pillar 4): up to three opt-in daily pushes at
// user-set times (breakfast / lunch / dinner, configurable per day of week)
// recommending what to eat first. Sending is idempotent per local day via
// MealWindow.lastSentAt, so a missed or repeated tick self-heals. The
// scheduler calls internal.sendMealNudges on a 5-minute cron.

const MEALS = ["BREAKFAST", "LUNCH", "DINNER"] as const;

type Prefs = Pick<NotificationSettings, "timezone">;

// Is this window scheduled to fire within the current tick? A window matches
// when its local minutes-of-day falls in (now - windowMinutes, now]. The
// modulo handles the midnight wrap (tick spanning 00:00).
function dueInTick(window: { minutes: number }, nowMin: number, windowMinutes: number): boolean {
  const diff = (nowMin - window.minutes + 1440) % 1440;
  return diff < windowMinutes;
}

function mealLabel(meal: MealName): string {
  return meal.charAt(0) + meal.slice(1).toLowerCase(); // BREAKFAST → Breakfast
}

// Same tiers and voice as the risk nudge, framed as a meal prompt:
// "Breakfast — Eat these soon: Bananas, Eggs".
function composeMealNudge(
  meal: MealName,
  composed: { title: string; body: string }
): { title: string; body: string } {
  return { title: `${mealLabel(meal)} — ${composed.title}`, body: composed.body };
}

export async function sendMealNudges(
  now = new Date(),
  windowMinutes = 6 // covers the 5-minute cron tick plus scheduling drift
) {
  const windows = await prisma.mealWindow.findMany({
    where: { enabled: true },
    include: {
      user: {
        select: {
          pushTokens: { select: { token: true } },
          notificationSettings: { select: { timezone: true } },
        },
      },
    },
  });

  const messages: PushMessage[] = [];
  const sentWindows: { id: string }[] = [];

  for (const window of windows) {
    const tz = window.user.notificationSettings?.timezone ?? "UTC";
    if ((window.daysMask & (1 << localDayBit(tz, now))) === 0) continue;
    if (!dueInTick(window, localMinuteOfDay(tz, now), windowMinutes)) continue;
    if (window.lastSentAt && localDay(tz, window.lastSentAt) === localDay(tz, now)) {
      continue; // already fired today — idempotency guard
    }

    // Same ranked logic as the risk nudge: what to eat first, else the
    // week-ahead plan. A kitchen with nothing to act on earns silence.
    const atRisk = await prisma.item.findMany({
      where: {
        userId: window.userId,
        receipt: { status: "SAVED" },
        OR: [
          { status: "EXPIRED" },
          {
            status: "ACTIVE",
            expiresAt: { lte: new Date(now.getTime() + AT_RISK_HOURS * 3_600_000) },
          },
        ],
      },
      orderBy: { expiresAt: "asc" },
      select: { name: true },
    });

    let composed: { title: string; body: string } | null = null;
    if (atRisk.length) {
      composed = composeMealNudge(window.meal, composeNudge(atRisk.map((i) => i.name)));
    } else {
      const weekAhead = await prisma.item.findMany({
        where: {
          userId: window.userId,
          receipt: { status: "SAVED" },
          status: "ACTIVE",
          expiresAt: {
            gt: new Date(now.getTime() + AT_RISK_HOURS * 3_600_000),
            lte: new Date(now.getTime() + WEEK_AHEAD_HOURS * 3_600_000),
          },
        },
        orderBy: { expiresAt: "asc" },
        select: { name: true },
      });
      if (weekAhead.length) {
        composed = composeMealNudge(
          window.meal,
          composeWeekAheadNudge(weekAhead.map((i) => i.name))
        );
      }
    }
    if (!composed) continue;

    for (const { token } of window.user.pushTokens) {
      messages.push({ to: token, title: composed.title, body: composed.body, sound: "default" });
    }
    sentWindows.push({ id: window.id });
  }

  let tokensPruned = 0;
  if (messages.length) {
    const tickets = await sendToExpo(messages);
    const dead = messages
      .filter((_, i) => tickets[i]?.details?.error === "DeviceNotRegistered")
      .map((m) => m.to);
    if (dead.length) {
      const { count } = await prisma.pushToken.deleteMany({
        where: { token: { in: dead } },
      });
      tokensPruned = count;
    }
  }

  // Stamp every window that fired, even if the user has no push tokens —
  // without the stamp a token-less user would be re-evaluated every tick.
  await Promise.all(
    sentWindows.map(({ id }) =>
      prisma.mealWindow.update({ where: { id }, data: { lastSentAt: now } })
    )
  );

  return {
    mealsFired: sentWindows.length,
    messagesSent: messages.length,
    tokensPruned,
  };
}

// ---------------------------------------------------------------------------
// tRPC surface for the settings UI.
// ---------------------------------------------------------------------------

const DAYS = z.array(z.number().int().min(0).max(6)); // 0 = Sunday … 6 = Saturday

function toDaysMask(days: number[]): number {
  return days.reduce((mask, d) => mask | (1 << d), 0);
}

export function daysMaskToList(mask: number): number[] {
  return [0, 1, 2, 3, 4, 5, 6].filter((i) => (mask & (1 << i)) !== 0);
}

export type MealWindowView = {
  meal: MealName;
  enabled: boolean;
  hour: number; // local hour, 0-23 (the UI steppers move in whole hours)
  days: number[]; // indexes into DAY_LABELS
};

function toView(window: MealWindow): MealWindowView {
  return {
    meal: window.meal,
    enabled: window.enabled,
    hour: Math.floor(window.minutes / 60) % 24,
    days: daysMaskToList(window.daysMask),
  };
}

export const mealWindowsRouter = router({
  // All three meal rows for the settings screen. Rows are created lazily on
  // first upsert; missing rows render as the defaults (off, 8/12:30/18:30,
  // every day).
  list: protectedProcedure.query(async ({ ctx }): Promise<MealWindowView[]> => {
    const rows = await prisma.mealWindow.findMany({ where: { userId: ctx.user.id } });
    return MEALS.map((meal) => {
      const row = rows.find((r) => r.meal === meal);
      if (row) return toView(row);
      const defaultHour = meal === "BREAKFAST" ? 8 : meal === "LUNCH" ? 12 : 18;
      return { meal, enabled: false, hour: defaultHour, days: [0, 1, 2, 3, 4, 5, 6] };
    });
  }),

  // Upsert keyed on (user, meal) — one call covers toggling, time, and days.
  upsert: protectedProcedure
    .input(
      z.object({
        meal: z.enum(MEALS),
        enabled: z.boolean(),
        hour: z.number().int().min(0).max(23).optional(),
        days: DAYS.optional(),
      })
    )
    .mutation(async ({ ctx, input }): Promise<MealWindowView> => {
      const existing = await prisma.mealWindow.findUnique({
        where: { userId_meal: { userId: ctx.user.id, meal: input.meal } },
      });
      const hour =
        input.hour ?? (existing ? Math.floor(existing.minutes / 60) % 24 : 8);
      const daysMask =
        input.days !== undefined ? toDaysMask(input.days) : (existing?.daysMask ?? 127);
      if (input.enabled && daysMask === 0) {
        throw new Error("A meal reminder needs at least one day of the week.");
      }
      const row = await prisma.mealWindow.upsert({
        where: { userId_meal: { userId: ctx.user.id, meal: input.meal } },
        create: {
          userId: ctx.user.id,
          meal: input.meal,
          enabled: input.enabled,
          minutes: hour * 60,
          daysMask,
        },
        update: { enabled: input.enabled, minutes: hour * 60, daysMask },
      });
      return toView(row);
    }),
});
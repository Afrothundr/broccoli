import type { NotificationSettings } from "@prisma/client";
import { prisma } from "./db";

// The just-in-time nudge (PRD Pillar 4): at most ONE grouped push per user
// per local day, outside their quiet hours, leading with what to eat first.
// Called by broccoli-scheduler via internal.sendNudges on an hourly cron —
// the hourly tick plus the once-per-day guard means each user gets nudged at
// the first eligible hour after their quiet window ends.

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const AT_RISK_HOURS = 48;
// The planning horizon (beta feedback): 48h alone meant the only push a user
// ever saw was "this is about to die" — the app never taught what was AT RISK
// while there was still time to plan a meal around it. When nothing is urgent,
// the daily nudge looks a week out instead of staying silent.
const WEEK_AHEAD_HOURS = 7 * 24;
const CHUNK_SIZE = 100;

const DEFAULTS = {
  nudgesEnabled: true,
  quietHoursStart: 21,
  quietHoursEnd: 8,
  timezone: "UTC",
  lastNudgeAt: null as Date | null,
};

type Prefs = Pick<
  NotificationSettings,
  "nudgesEnabled" | "quietHoursStart" | "quietHoursEnd" | "timezone"
> & { lastNudgeAt: Date | null };

type PushMessage = { to: string; title: string; body: string; sound: "default" };
type ExpoTicket = { status: "ok" | "error"; details?: { error?: string } };

// Hour-of-day / calendar date in the user's timezone. Invalid timezone
// strings fall back to UTC rather than breaking the whole sweep.
function localHour(timezone: string, now: Date): number {
  try {
    return Number(
      new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        hour12: false,
        timeZone: timezone,
      }).format(now)
    );
  } catch {
    return now.getUTCHours();
  }
}

function localDay(timezone: string, at: Date): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(at);
  } catch {
    return at.toISOString().slice(0, 10);
  }
}

// Quiet window may wrap midnight (21 → 8). Start inclusive, end exclusive.
function inQuietHours(prefs: Prefs, now: Date): boolean {
  const hour = localHour(prefs.timezone, now);
  const { quietHoursStart: start, quietHoursEnd: end } = prefs;
  if (start === end) return false; // degenerate window = no quiet hours
  return start < end ? hour >= start && hour < end : hour >= start || hour < end;
}

function nudgedToday(prefs: Prefs, now: Date): boolean {
  if (!prefs.lastNudgeAt) return false;
  return localDay(prefs.timezone, prefs.lastNudgeAt) === localDay(prefs.timezone, now);
}

// Title: "Eat these soon: Bananas, Eggs"
// Body: "Bananas, Eggs and 3 more are nearing their expiration — use them
// first so nothing goes to waste."
// Same voice as the app (PR #25): named items over counts, kitchen framing,
// and the "so nothing goes to waste" line the empty state uses.
function composeNudge(names: string[]): { title: string; body: string } {
  const count = names.length;
  const rest = count - Math.min(count, 2);
  // "and" between exactly two names — receipt names often carry commas
  // ("Eggs, dozen"), and a comma join reads like three items.
  const lead = names.slice(0, 2).join(rest > 0 ? ", " : " and ");
  const one = count === 1;
  return {
    title: `Eat ${one ? "this" : "these"} soon: ${lead}`,
    body: `${lead}${rest > 0 ? ` and ${rest} more` : ""} ${one ? "is" : "are"} nearing ${
      one ? "its" : "their"
    } expiration — use ${one ? "it" : "them"} first so nothing goes to waste.`,
  };
}

// The planning tier — nothing is urgent, but the week ahead has expirations.
// Softer verb on purpose: "plan around" invites a check-in where "eat these
// soon" demands action. Same named-items-over-counts voice.
function composeWeekAheadNudge(names: string[]): { title: string; body: string } {
  const count = names.length;
  const rest = count - Math.min(count, 2);
  const lead = names.slice(0, 2).join(rest > 0 ? ", " : " and ");
  const one = count === 1;
  return {
    title: `This week in your kitchen: ${lead}`,
    body: `${lead}${rest > 0 ? ` and ${rest} more` : ""} ${
      one ? "expires" : "expire"
    } this week — a meal planned now keeps ${one ? "it" : "them"} out of the trash.`,
  };
}

async function sendToExpo(messages: PushMessage[]): Promise<ExpoTicket[]> {
  const tickets: ExpoTicket[] = [];
  for (let i = 0; i < messages.length; i += CHUNK_SIZE) {
    const chunk = messages.slice(i, i + CHUNK_SIZE);
    const res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(chunk),
    });
    if (!res.ok) throw new Error(`Expo push API failed: ${res.status}`);
    const body = (await res.json()) as { data: ExpoTicket[] };
    tickets.push(...body.data);
  }
  return tickets;
}

export async function sendNudges(now = new Date()) {
  const users = await prisma.user.findMany({
    where: { pushTokens: { some: {} } },
    select: {
      id: true,
      pushTokens: { select: { token: true } },
      notificationSettings: true,
    },
  });

  const messages: PushMessage[] = [];
  const nudgedUserIds: string[] = [];

  for (const user of users) {
    const prefs: Prefs = user.notificationSettings ?? DEFAULTS;
    if (!prefs.nudgesEnabled) continue;
    if (inQuietHours(prefs, now)) continue;
    if (nudgedToday(prefs, now)) continue;

    // Tier 1 — what to eat first: already expired, or inside the at-risk window.
    const atRisk = await prisma.item.findMany({
      where: {
        userId: user.id,
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

    // Tier 2 — nothing urgent: teach the week ahead instead of staying
    // silent. Strictly beyond the at-risk window so the two tiers never
    // describe the same item two days in a row with different verbs.
    let composed: { title: string; body: string } | null = null;
    if (atRisk.length) {
      composed = composeNudge(atRisk.map((i) => i.name));
    } else {
      const weekAhead = await prisma.item.findMany({
        where: {
          userId: user.id,
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
        composed = composeWeekAheadNudge(weekAhead.map((i) => i.name));
      }
    }
    // A kitchen with nothing expiring for a week earns silence, not a push.
    if (!composed) continue;

    for (const { token } of user.pushTokens) {
      messages.push({ to: token, title: composed.title, body: composed.body, sound: "default" });
    }
    nudgedUserIds.push(user.id);
  }

  let tokensPruned = 0;
  if (messages.length) {
    const tickets = await sendToExpo(messages);
    // Tickets align with messages; drop tokens Expo says are gone.
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

  // Upsert (not updateMany): a token registered before settings existed must
  // still get stamped, or the hourly cron would re-nudge every run.
  await Promise.all(
    nudgedUserIds.map((userId) =>
      prisma.notificationSettings.upsert({
        where: { userId },
        create: { userId, lastNudgeAt: now },
        update: { lastNudgeAt: now },
      })
    )
  );

  return {
    usersNudged: nudgedUserIds.length,
    messagesSent: messages.length,
    tokensPruned,
  };
}

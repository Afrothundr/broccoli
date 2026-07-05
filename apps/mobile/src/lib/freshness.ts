import type { InventoryItem } from '@/hooks/use-inventory';

// A displayable freshness estimate. Since Phase 3 the api stamps items with
// expiresAt + a source at save time; that's the truth we render. Items saved
// before Phase 3 have no expiresAt, so we fall back to the old client-side
// derivation from the catalog lifespan. `null` when nothing is known.
export type Freshness = {
  daysLeft: number; // negative = past the estimated window
  level: 'good' | 'warn' | 'bad';
  chip: string | null; // short label for the list row; null = not worth a chip
  detail: string; // sentence for the expanded row, names the source when notable
  sourceLabel: string | null; // "set by you" | "AI estimate"; null = system estimate
};

const DAY_MS = 24 * 60 * 60 * 1000;
// "Use soon" once the estimate says two days or fewer remain.
const WARN_DAYS = 2;
// Beyond this the item is effectively shelf-stable ("~535d" on canned tuna is
// noise, not signal) — keep the detail but skip the chip.
const CHIP_MAX_DAYS = 30;

// Only sources worth calling out get a label. The system's own estimate
// (currently the curated FOODKEEPER catalog) is presented generically — the
// phrase "typical shelf life" is the reason; the dataset name stays in the
// database for auditing, not in the UI.
const SOURCE_LABELS: Record<string, string> = {
  LLM: 'AI estimate',
  USER: 'set by you',
};

export function storageLabel(location: InventoryItem['storageLocation']): string | null {
  if (!location) return null;
  return { PANTRY: 'Pantry', FRIDGE: 'Fridge', FREEZER: 'Freezer' }[location];
}

export function estimateFreshness(item: InventoryItem, now = Date.now()): Freshness | null {
  const expiresAtMs = expirationMs(item);
  if (expiresAtMs === null) return null;

  const sourceLabel = item.expiresAt
    ? (SOURCE_LABELS[item.expirationSource ?? ''] ?? null)
    : null;
  const suffix = sourceLabel ? ` (${sourceLabel})` : '';
  const daysLeft = Math.ceil((expiresAtMs - now) / DAY_MS);

  // The scheduler said so — stronger than our arithmetic.
  if (item.status === 'EXPIRED') {
    return {
      daysLeft: Math.min(daysLeft, -1),
      level: 'bad',
      chip: 'expired',
      detail: `Past its expiration${suffix} — check before using, then swipe it.`,
      sourceLabel,
    };
  }

  if (daysLeft < 0) {
    return {
      daysLeft,
      level: 'bad',
      chip: 'check it',
      detail: `Past its typical shelf life${suffix} — check before using.`,
      sourceLabel,
    };
  }
  if (daysLeft <= WARN_DAYS) {
    return {
      daysLeft,
      level: 'warn',
      chip: 'use soon',
      detail: `About ${Math.max(daysLeft, 1)} ${daysLeft === 1 ? 'day' : 'days'} left${suffix}.`,
      sourceLabel,
    };
  }
  return {
    daysLeft,
    level: 'good',
    chip: daysLeft <= CHIP_MAX_DAYS ? `~${daysLeft}d` : null,
    detail: `About ${daysLeft} days left${suffix}.`,
    sourceLabel,
  };
}

// Server-stamped date first; legacy client-side derivation (purchase date +
// catalog lifespan) for pre-Phase-3 items. Dates are ISO strings at runtime
// over plain-JSON tRPC.
function expirationMs(item: InventoryItem): number | null {
  if (item.expiresAt) {
    const ms = new Date(item.expiresAt).getTime();
    return Number.isNaN(ms) ? null : ms;
  }
  if (item.estimatedLifeSpanSeconds == null) return null;
  const basis = new Date(item.receipt.purchasedAt ?? item.createdAt).getTime();
  if (Number.isNaN(basis)) return null;
  return basis + item.estimatedLifeSpanSeconds * 1000;
}

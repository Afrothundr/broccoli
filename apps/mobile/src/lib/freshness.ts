import type { InventoryItem } from '@/hooks/use-inventory';

// A displayable freshness estimate, derived client-side from the FoodKeeper
// lifespan the api attaches to each item. Everything here is explicitly an
// estimate (location-agnostic, no user adjustment) — real expiration advice
// lands in Phase 3. `null` when the item's category has no catalog match.
export type Freshness = {
  daysLeft: number; // negative = past the estimated window
  level: 'good' | 'warn' | 'bad';
  chip: string | null; // short label for the list row; null = not worth a chip
  detail: string; // sentence for the expanded row, names the source
};

const DAY_MS = 24 * 60 * 60 * 1000;
// "Use soon" once the estimate says two days or fewer remain.
const WARN_DAYS = 2;
// Beyond this the item is effectively shelf-stable ("~535d" on canned tuna is
// noise, not signal) — keep the detail but skip the chip.
const CHIP_MAX_DAYS = 30;

export function estimateFreshness(item: InventoryItem, now = Date.now()): Freshness | null {
  if (item.estimatedLifeSpanSeconds == null) return null;

  // Shelf life runs from purchase; fall back to when we first saw the item.
  // (Dates are ISO strings at runtime over plain-JSON tRPC.)
  const basis = new Date(item.receipt.purchasedAt ?? item.createdAt).getTime();
  if (Number.isNaN(basis)) return null;

  const expiresAt = basis + item.estimatedLifeSpanSeconds * 1000;
  const daysLeft = Math.ceil((expiresAt - now) / DAY_MS);

  if (daysLeft < 0) {
    return {
      daysLeft,
      level: 'bad',
      chip: 'check it',
      detail: 'Past its estimated shelf life (FoodKeeper estimate) — check before using.',
    };
  }
  if (daysLeft <= WARN_DAYS) {
    return {
      daysLeft,
      level: 'warn',
      chip: 'use soon',
      detail: `About ${Math.max(daysLeft, 1)} ${daysLeft === 1 ? 'day' : 'days'} left (FoodKeeper estimate).`,
    };
  }
  return {
    daysLeft,
    level: 'good',
    chip: daysLeft <= CHIP_MAX_DAYS ? `~${daysLeft}d` : null,
    detail: `About ${daysLeft} days left (FoodKeeper estimate).`,
  };
}

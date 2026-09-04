import { Feather } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';
import { InventoryItem } from '@/hooks/use-inventory';
import { useTheme } from '@/hooks/use-theme';
import { estimateFreshness } from '@/lib/freshness';
import { trpc } from '@/lib/trpc';

// The daily check-in (PRD Pillar 5): flip through your items like cards —
// swipe right for "ate it", left for "tossed it", down for "still have it"
// (most items on a given day are simply still in the kitchen — that's not a
// terminal status, so it's a purely local skip: no api call, the item stays
// in inventory and just leaves this session's deck). Eaten/tossed swipes are
// one item.resolve call each; undo is item.unresolve. Swipes commit
// optimistically so the deck never waits on the network; a failed save puts
// the card back at the end of the deck with a note.

type Outcome = 'EATEN' | 'TOSSED' | 'KEPT';
type SwipeRecord = { item: InventoryItem; outcome: Outcome };

const SWIPE_THRESHOLD = 110;

// Most urgent first — same freshness estimate the inventory list uses. Items
// the scheduler already marked EXPIRED lead outright (they're the ones the
// check-in exists to settle); items without an estimate go last.
function orderDeck(items: InventoryItem[]): InventoryItem[] {
  const rank = (item: InventoryItem) => {
    const f = estimateFreshness(item);
    const base = f ? f.daysLeft : Number.MAX_SAFE_INTEGER;
    return item.status === 'EXPIRED' ? base - 1_000_000 : base;
  };
  return [...items].sort((a, b) => rank(a) - rank(b));
}

// purchasedAt is typed Date but arrives as an ISO string over plain-JSON tRPC
// (same note as the inventory list's formatDate).
function formatPurchased(value: Date | string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `Bought ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}

export function CheckInDeck({
  items,
  onClose,
}: {
  items: InventoryItem[];
  onClose: () => void;
}) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const reduceMotion = useReducedMotion();

  const initialDeck = useMemo(() => orderDeck(items), [items]);
  const [deck, setDeck] = useState(initialDeck);
  const [records, setRecords] = useState<SwipeRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  const top = deck[0] ?? null;
  const total = deck.length + records.length;
  const eaten = records.filter((r) => r.outcome === 'EATEN').length;
  const tossed = records.filter((r) => r.outcome === 'TOSSED').length;
  const kept = records.filter((r) => r.outcome === 'KEPT').length;
  // The end-state payoff: what this session kept out of the trash. Eaten and
  // still-have items both count — the money only leaves when something is
  // tossed. Null when no swiped item carried a price.
  const keptValue = records.reduce(
    (sum: number | null, r) =>
      r.outcome !== 'TOSSED' && r.item.price != null ? (sum ?? 0) + r.item.price : sum,
    null as number | null
  );

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const commit = (outcome: Outcome) => {
    const item = deck[0];
    if (!item) return;
    setError(null);
    setDeck((d) => d.slice(1));
    setRecords((r) => [...r, { item, outcome }]);
    translateX.value = 0;
    translateY.value = 0;

    // "Still have it" is not a status change — nothing to save.
    if (outcome === 'KEPT') return;

    // Optimistic: the deck moves on immediately. A failed save rejoins the
    // deck at the back so the outcome is never silently lost.
    trpc.item.resolve.mutate({ id: item.id, outcome }).catch(() => {
      setRecords((r) => r.filter((rec) => rec.item.id !== item.id));
      setDeck((d) => [...d, item]);
      setError(`Couldn't save ${item.name} — it's back in the deck.`);
    });
  };

  const undo = () => {
    const last = records[records.length - 1];
    if (!last) return;
    setError(null);
    setRecords((r) => r.slice(0, -1));
    setDeck((d) => [last.item, ...d]);
    if (last.outcome === 'KEPT') return; // local skip — nothing to unwind
    trpc.item.unresolve.mutate({ id: last.item.id }).catch(() => {
      setError(`Couldn't undo ${last.item.name}. Pull to refresh and try again.`);
    });
  };

  // Fly the card off-screen, then commit. Shared by the swipe gesture and the
  // tap-target fallback buttons: right = eaten, left = tossed, down = kept.
  const flyOut = (outcome: Outcome) => {
    if (reduceMotion) {
      commit(outcome);
      return;
    }
    if (outcome === 'KEPT') {
      translateY.value = withTiming(width * 1.2, { duration: 180 }, () =>
        runOnJS(commit)('KEPT')
      );
      return;
    }
    const direction = outcome === 'EATEN' ? 1 : -1;
    translateX.value = withTiming(direction * width * 1.2, { duration: 180 }, () =>
      runOnJS(commit)(outcome)
    );
  };

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
      // Only downward drag matters; upward drags spring back.
      translateY.value = Math.max(0, e.translationY);
    })
    .onEnd((e) => {
      const horizontal = Math.abs(e.translationX);
      const vertical = e.translationY;
      if (horizontal > SWIPE_THRESHOLD && horizontal >= vertical) {
        const direction = e.translationX > 0 ? 1 : -1;
        const outcome: Outcome = direction === 1 ? 'EATEN' : 'TOSSED';
        translateX.value = withTiming(direction * width * 1.2, { duration: 180 }, () =>
          runOnJS(commit)(outcome)
        );
      } else if (vertical > SWIPE_THRESHOLD) {
        translateY.value = withTiming(width * 1.2, { duration: 180 }, () =>
          runOnJS(commit)('KEPT')
        );
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${translateX.value / 18}deg` },
    ],
  }));
  const ateOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [30, SWIPE_THRESHOLD], [0, 1], 'clamp'),
  }));
  const tossedOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, -30], [1, 0], 'clamp'),
  }));
  const keptOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [30, SWIPE_THRESHOLD], [0, 1], 'clamp'),
  }));

  const freshness = top ? estimateFreshness(top) : null;
  const last = records[records.length - 1] ?? null;

  return (
    // Prototype 04: the whole check-in sits on the stalk green; cards are
    // paper on top of it. Every ink/fill on that surface uses the FIXED
    // onStalk paper — `background` flips to near-black in dark mode, which
    // made this text unreadable (dark-mode audit 2026-09-04).
    <ThemedView style={[styles.container, { backgroundColor: theme.stalk }]}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={{ color: theme.onStalk }}>
          Daily check-in
        </ThemedText>
        <Pressable
          onPress={onClose}
          hitSlop={Spacing.three}
          accessibilityRole="button"
          accessibilityLabel="Close check-in"
          style={({ pressed }) => pressed && styles.pressed}>
          <Feather name="x" size={22} color={`${theme.onStalk}B3`} />
        </Pressable>
      </ThemedView>

      {error && (
        <ThemedText
          type="small"
          accessibilityRole="alert"
          style={[styles.error, { color: theme.statusBad }]}>
          {error}
        </ThemedText>
      )}

      {top ? (
        <>
          <ThemedView style={styles.progressRow}>
            <ThemedView style={[styles.progressTrack, { backgroundColor: `${theme.onStalk}26` }]}>
              <ThemedView
                style={[
                  styles.progressFill,
                  { width: `${(records.length / total) * 100}%`, backgroundColor: theme.floret },
                ]}
              />
            </ThemedView>
            <ThemedText
              type="small"
              style={[styles.progressCount, { color: `${theme.onStalk}66` }]}>
              {records.length + 1} of {total}
            </ThemedText>
          </ThemedView>
          <ThemedText
            type="small"
            style={[styles.hint, { color: `${theme.onStalk}B3` }]}>
            What happened to each item this week? Swipe right for ate it, left
            for tossed it, down if it&apos;s still around — or tap a button.
          </ThemedText>

          <ThemedView style={styles.deckArea}>
            {deck[1] && (
              // Prototype 04's stacked look: the next card peeks out tilted.
              <ThemedView
                style={[
                  styles.card,
                  styles.cardBehind,
                  { backgroundColor: theme.backgroundElement },
                ]}
              />
            )}
            <GestureDetector gesture={pan}>
              <Animated.View key={top.id} style={[styles.cardWrap, cardStyle]}>
                {/* One VoiceOver stop per card: name, state, freshness, price
                    in a single summary instead of four separate swipes. The
                    action buttons below remain the accessible way to commit. */}
                <ThemedView
                  style={[styles.card, { backgroundColor: theme.background }]}
                  accessible
                  accessibilityLabel={[
                    top.name,
                    top.status === 'EXPIRED' ? 'expired' : null,
                    freshness?.detail ?? null,
                    formatPurchased(top.receipt.purchasedAt),
                    top.price != null ? `$${top.price.toFixed(2)}` : null,
                  ]
                    .filter(Boolean)
                    .join(', ')}>
                  <Animated.View style={[styles.overlay, styles.overlayLeft, ateOverlayStyle]}>
                    <ThemedText type="smallBold" style={{ color: theme.statusGood }}>
                      ATE IT
                    </ThemedText>
                  </Animated.View>
                  <Animated.View style={[styles.overlay, styles.overlayRight, tossedOverlayStyle]}>
                    <ThemedText type="smallBold" style={{ color: theme.statusBad }}>
                      TOSSED
                    </ThemedText>
                  </Animated.View>
                  <Animated.View style={[styles.overlay, styles.overlayBottom, keptOverlayStyle]}>
                    <ThemedText type="smallBold" themeColor="textSecondary">
                      STILL HAVE IT
                    </ThemedText>
                  </Animated.View>

                  {top.status === 'EXPIRED' && (
                    <ThemedText type="smallBold" style={{ color: theme.statusBad }}>
                      EXPIRED — did you eat it or toss it?
                    </ThemedText>
                  )}
                  <ThemedText type="default" style={styles.cardName}>
                    {top.name}
                  </ThemedText>
                  {top.category && (
                    <ThemedText type="small" themeColor="textSecondary">
                      {top.category}
                    </ThemedText>
                  )}
                  {freshness && (
                    <ThemedText
                      type="small"
                      style={{
                        color:
                          freshness.level === 'bad'
                            ? theme.statusBad
                            : freshness.level === 'warn'
                              ? theme.statusWarn
                              : theme.statusGood,
                      }}>
                      {freshness.detail}
                    </ThemedText>
                  )}
                  {/* Store name hidden for now (beta feedback) — purchase date
                      is what a keep-or-toss decision actually leans on. */}
                  <ThemedText type="small" themeColor="textSecondary">
                    {formatPurchased(top.receipt.purchasedAt) ?? 'Receipt'}
                    {top.price != null ? ` · $${top.price.toFixed(2)}` : ''}
                  </ThemedText>
                </ThemedView>
              </Animated.View>
            </GestureDetector>
          </ThemedView>

          <ThemedView style={styles.actions}>
            <Pressable
              onPress={() => flyOut('TOSSED')}
              accessibilityRole="button"
              accessibilityLabel={`Tossed ${top.name}`}
              style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}>
              <ThemedView style={[styles.action, { backgroundColor: `${theme.onStalk}33` }]}>
                <Feather name="x" size={16} color={`${theme.onStalk}EB`} />
                <ThemedText type="smallBold" style={{ color: `${theme.onStalk}EB` }}>
                  Tossed
                </ThemedText>
              </ThemedView>
            </Pressable>
            <Pressable
              onPress={() => flyOut('KEPT')}
              accessibilityRole="button"
              accessibilityLabel={`Still have ${top.name}`}
              style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}>
              <ThemedView style={[styles.action, { backgroundColor: `${theme.onStalk}2E` }]}>
                <ThemedText type="smallBold" style={{ color: `${theme.onStalk}EB` }}>
                  Still have it
                </ThemedText>
              </ThemedView>
            </Pressable>
            <Pressable
              onPress={() => flyOut('EATEN')}
              accessibilityRole="button"
              accessibilityLabel={`Ate ${top.name}`}
              style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}>
              <ThemedView style={[styles.action, { backgroundColor: `${theme.floret}26` }]}>
                <Feather name="check" size={16} color={theme.floret2} />
                <ThemedText type="smallBold" style={{ color: theme.floret2 }}>
                  Ate it
                </ThemedText>
              </ThemedView>
            </Pressable>
          </ThemedView>
        </>
      ) : (
        <ThemedView style={styles.doneArea}>
          <ThemedText type="title" style={[styles.doneTitle, { color: theme.onStalk }]}>
            All caught up
          </ThemedText>
          {/* Peak-end: close on what the session kept in play, not a tally of
              failures. Tosses read as the thing the nudges exist to shrink. */}
          {keptValue != null && keptValue > 0 && (
            <ThemedText type="smallBold" style={{ color: theme.floret2 }}>
              ${keptValue.toFixed(2)} kept in play
            </ThemedText>
          )}
          <ThemedText
            type="small"
            style={[styles.doneSummary, { color: `${theme.onStalk}B3` }]}>
            {eaten} eaten{kept > 0 ? ` · ${kept} still in your kitchen` : ''}
            {tossed > 0
              ? ` · ${tossed} tossed — the nudges are here to catch the next ones sooner`
              : ''}
          </ThemedText>
          <Button title="Done" onPress={onClose} style={styles.doneButton} />
        </ThemedView>
      )}

      {/* The undo bar outlives the deck on purpose: the last swipe is the one
          most likely to be a slip (the deck vanishes mid-gesture), and it used
          to be the only unrecoverable one. */}
      {last && (
        <ThemedView style={[styles.undoBar, { backgroundColor: `${theme.onStalk}1A` }]}>
          <ThemedText type="small" style={[styles.undoText, { color: `${theme.onStalk}B3` }]} numberOfLines={1}>
            {last.item.name} —{' '}
            {last.outcome === 'EATEN'
              ? 'eaten'
              : last.outcome === 'TOSSED'
                ? 'tossed'
                : 'still have it'}
          </ThemedText>
          <Pressable
            onPress={undo}
            hitSlop={Spacing.three}
            accessibilityRole="button"
            accessibilityLabel={`Undo ${last.item.name}`}
            style={({ pressed }) => pressed && styles.pressed}>
            <ThemedText type="linkPrimary" style={{ color: theme.floret2 }}>
              Undo
            </ThemedText>
          </Pressable>
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // ThemedView defaults to paper — these sit on the stalk surface, so opt out.
    backgroundColor: 'transparent',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: 'transparent',
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  progressCount: {
    fontVariant: ['tabular-nums'],
  },
  hint: {
    textAlign: 'center',
  },
  deckArea: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  cardWrap: {
    zIndex: 1,
  },
  card: {
    borderRadius: 14, // prototype 04's card radius
    padding: Spacing.four,
    gap: Spacing.two,
    minHeight: 260,
    justifyContent: 'center',
    // Paper card floating on the stalk background (prototype 04).
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  cardBehind: {
    position: 'absolute',
    left: Spacing.two,
    right: Spacing.two,
    // Match the front card's footprint instead of stretching with the deck
    // area (absolute top+bottom stretched it into a full-height slab).
    height: 300,
    top: '50%',
    opacity: 0.4,
    transform: [{ translateY: -140 }, { translateX: 8 }, { rotate: '4deg' }],
    shadowOpacity: 0,
    elevation: 0,
  },
  cardName: {
    fontWeight: '700',
    fontSize: 22,
    lineHeight: 28,
  },
  overlay: {
    position: 'absolute',
    top: Spacing.three,
  },
  overlayLeft: {
    left: Spacing.three,
  },
  overlayRight: {
    right: Spacing.three,
  },
  overlayBottom: {
    top: undefined,
    bottom: Spacing.three,
    alignSelf: 'center',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.three,
    backgroundColor: 'transparent',
  },
  actionButton: {
    flex: 1,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.four,
  },
  doneArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  doneTitle: {
    textAlign: 'center',
  },
  doneSummary: {
    textAlign: 'center',
  },
  doneButton: {
    alignSelf: 'stretch',
    marginTop: Spacing.three,
  },
  undoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  undoText: {
    flex: 1,
  },
  error: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
});

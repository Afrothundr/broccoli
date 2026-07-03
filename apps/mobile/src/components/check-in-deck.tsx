import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { InventoryItem } from '@/hooks/use-inventory';
import { useTheme } from '@/hooks/use-theme';
import { estimateFreshness } from '@/lib/freshness';
import { trpc } from '@/lib/trpc';

// The daily check-in (PRD Pillar 5): flip through your items like cards —
// swipe right for "ate it", left for "tossed it". Every swipe is one
// item.resolve call; undo is item.unresolve. Swipes commit optimistically so
// the deck never waits on the network; a failed save puts the card back at
// the end of the deck with a note.

type Outcome = 'EATEN' | 'TOSSED';
type SwipeRecord = { item: InventoryItem; outcome: Outcome };

const SWIPE_THRESHOLD = 110;

// Most urgent first — same freshness estimate the inventory list uses. Items
// without an estimate go last.
function orderDeck(items: InventoryItem[]): InventoryItem[] {
  const rank = (item: InventoryItem) => {
    const f = estimateFreshness(item);
    if (!f) return Number.MAX_SAFE_INTEGER;
    return f.daysLeft;
  };
  return [...items].sort((a, b) => rank(a) - rank(b));
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

  const initialDeck = useMemo(() => orderDeck(items), [items]);
  const [deck, setDeck] = useState(initialDeck);
  const [records, setRecords] = useState<SwipeRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  const top = deck[0] ?? null;
  const total = deck.length + records.length;
  const eaten = records.filter((r) => r.outcome === 'EATEN').length;
  const tossed = records.length - eaten;

  const translateX = useSharedValue(0);

  const commit = (outcome: Outcome) => {
    const item = deck[0];
    if (!item) return;
    setError(null);
    setDeck((d) => d.slice(1));
    setRecords((r) => [...r, { item, outcome }]);
    translateX.value = 0;

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
    trpc.item.unresolve.mutate({ id: last.item.id }).catch(() => {
      setError(`Couldn't undo ${last.item.name}. Pull to refresh and try again.`);
    });
  };

  // Fly the card out in `direction` (1 = right/eaten, -1 = left/tossed), then
  // commit. Shared by the swipe gesture and the tap-target fallback buttons.
  const flyOut = (direction: 1 | -1) => {
    const outcome: Outcome = direction === 1 ? 'EATEN' : 'TOSSED';
    translateX.value = withTiming(direction * width * 1.2, { duration: 180 }, () =>
      runOnJS(commit)(outcome)
    );
  };

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
    })
    .onEnd((e) => {
      if (Math.abs(e.translationX) > SWIPE_THRESHOLD) {
        const direction = e.translationX > 0 ? 1 : -1;
        const outcome: Outcome = direction === 1 ? 'EATEN' : 'TOSSED';
        translateX.value = withTiming(direction * width * 1.2, { duration: 180 }, () =>
          runOnJS(commit)(outcome)
        );
      } else {
        translateX.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { rotate: `${translateX.value / 18}deg` },
    ],
  }));
  const ateOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [30, SWIPE_THRESHOLD], [0, 1], 'clamp'),
  }));
  const tossedOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, -30], [1, 0], 'clamp'),
  }));

  const freshness = top ? estimateFreshness(top) : null;
  const last = records[records.length - 1] ?? null;

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="subtitle">Daily check-in</ThemedText>
        <Pressable onPress={onClose} hitSlop={Spacing.three}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            ✕
          </ThemedText>
        </Pressable>
      </ThemedView>

      {error && (
        <ThemedText type="small" style={[styles.error, { color: theme.statusBad }]}>
          {error}
        </ThemedText>
      )}

      {top ? (
        <>
          <ThemedText type="small" themeColor="textSecondary" style={styles.progress}>
            {records.length + 1} of {total} · swipe right if you ate it, left if you tossed it
          </ThemedText>

          <ThemedView style={styles.deckArea}>
            {deck[1] && (
              <ThemedView type="backgroundElement" style={[styles.card, styles.cardBehind]} />
            )}
            <GestureDetector gesture={pan}>
              <Animated.View key={top.id} style={[styles.cardWrap, cardStyle]}>
                <ThemedView type="backgroundElement" style={styles.card}>
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
                  <ThemedText type="small" themeColor="textSecondary">
                    {top.receipt.storeName ?? 'Receipt'}
                    {top.price != null ? ` · $${top.price.toFixed(2)}` : ''}
                  </ThemedText>
                </ThemedView>
              </Animated.View>
            </GestureDetector>
          </ThemedView>

          <ThemedView style={styles.actions}>
            <Pressable onPress={() => flyOut(-1)} style={styles.actionButton}>
              <ThemedView type="backgroundElement" style={styles.action}>
                <ThemedText type="smallBold" style={{ color: theme.statusBad }}>
                  ✗ Tossed
                </ThemedText>
              </ThemedView>
            </Pressable>
            <Pressable onPress={() => flyOut(1)} style={styles.actionButton}>
              <ThemedView type="backgroundElement" style={styles.action}>
                <ThemedText type="smallBold" style={{ color: theme.statusGood }}>
                  ✓ Ate it
                </ThemedText>
              </ThemedView>
            </Pressable>
          </ThemedView>
        </>
      ) : (
        <ThemedView style={styles.doneArea}>
          <ThemedText type="subtitle" style={styles.doneTitle}>
            Check-in complete
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {eaten} eaten · {tossed} tossed
          </ThemedText>
          <Pressable onPress={onClose} style={styles.doneButton}>
            <ThemedView type="backgroundSelected" style={styles.action}>
              <ThemedText type="smallBold">Done</ThemedText>
            </ThemedView>
          </Pressable>
        </ThemedView>
      )}

      {last && top && (
        <ThemedView type="backgroundElement" style={styles.undoBar}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.undoText} numberOfLines={1}>
            {last.item.name} — {last.outcome === 'EATEN' ? 'eaten' : 'tossed'}
          </ThemedText>
          <Pressable onPress={undo} hitSlop={Spacing.two}>
            <ThemedText type="linkPrimary">Undo</ThemedText>
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
  },
  progress: {
    textAlign: 'center',
  },
  deckArea: {
    flex: 1,
    justifyContent: 'center',
  },
  cardWrap: {
    zIndex: 1,
  },
  card: {
    borderRadius: Spacing.four,
    padding: Spacing.five,
    gap: Spacing.two,
    minHeight: 260,
    justifyContent: 'center',
  },
  cardBehind: {
    position: 'absolute',
    left: Spacing.two,
    right: Spacing.two,
    top: Spacing.three,
    bottom: -Spacing.three,
    opacity: 0.5,
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
  actions: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  actionButton: {
    flex: 1,
  },
  action: {
    alignItems: 'center',
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
});

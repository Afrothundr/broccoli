import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CheckInDeck } from '@/components/check-in-deck';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { BottomTabInset, FontFamilies, MaxContentWidth, Spacing } from '@/constants/theme';
import { useBackHandler } from '@/hooks/use-back-handler';
import { InventoryItem, useInventory } from '@/hooks/use-inventory';
import { useTheme } from '@/hooks/use-theme';
import { estimateFreshness, Freshness, storageLabel } from '@/lib/freshness';
import { trpc } from '@/lib/trpc';

// purchasedAt is typed Date but arrives as an ISO string over plain-JSON tRPC.
function formatDate(value: Date | string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

type Row = { item: InventoryItem; freshness: Freshness | null };
type Section = { key: string; title: string; data: Row[] };

// Urgent items ("use soon" or past their estimate) get lifted into a single
// section on top, most urgent first; everything else stays grouped by receipt
// ("Whole Foods Market · Jun 28"), newest receipt first.
function toSections(items: InventoryItem[]): Section[] {
  const rows: Row[] = items.map((item) => ({ item, freshness: estimateFreshness(item) }));

  const urgent = rows
    .filter((r) => r.freshness !== null && r.freshness.level !== 'good')
    .sort((a, b) => a.freshness!.daysLeft - b.freshness!.daysLeft);
  const urgentIds = new Set(urgent.map((r) => r.item.id));

  const sections: Section[] = urgent.length
    ? [{ key: 'use-first', title: 'Use these first', data: urgent }]
    : [];

  for (const row of rows) {
    if (urgentIds.has(row.item.id)) continue;
    const last = sections[sections.length - 1];
    if (last?.key === row.item.receiptId) {
      last.data.push(row);
      continue;
    }
    // Store name hidden for now (beta feedback: noise, no decision value).
    // Still parsed and stored — it may come back for analytics.
    const date = formatDate(row.item.receipt.purchasedAt);
    sections.push({
      key: row.item.receiptId,
      title: date ? `Bought ${date}` : 'Receipt',
      data: [row],
    });
  }
  return sections;
}

const LOCATIONS = ['PANTRY', 'FRIDGE', 'FREEZER'] as const;
// Compact prototype labels on the card (− / + / +1w); the accessible names
// spell them out so no one needs a key to read the control.
const ADJUSTMENTS: { label: string; days: number; a11y: string }[] = [
  { label: '−', days: -1, a11y: 'Move expiration up by 1 day' },
  { label: '+', days: 1, a11y: 'Extend expiration by 1 day' },
  { label: '+1w', days: 7, a11y: 'Extend expiration by 1 week' },
];

function ItemRow({ item, freshness, onChanged }: Row & { onChanged: () => void }) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);
  const quantity = item.quantity > 1 || item.unit ? `${item.quantity} ${item.unit}`.trim() : null;

  // Nudge the expiration date ("fine until Friday"): USER-sourced, relative to
  // the current estimate (or today when the item has none).
  const adjustBy = async (days: number) => {
    if (busy) return;
    setBusy(true);
    setRowError(null);
    const base = item.expiresAt ? new Date(item.expiresAt) : new Date();
    const expiresAt = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
    try {
      await trpc.item.adjustExpiration.mutate({ id: item.id, expiresAt });
      onChanged();
    } catch {
      setRowError("Couldn't save the new date. Try again.");
    } finally {
      setBusy(false);
    }
  };

  // "I froze that" — recomputes the estimate for the new location server-side.
  const setLocation = async (storageLocation: (typeof LOCATIONS)[number]) => {
    if (busy || item.storageLocation === storageLocation) return;
    setBusy(true);
    setRowError(null);
    try {
      await trpc.item.setStorageLocation.mutate({ id: item.id, storageLocation });
      onChanged();
    } catch {
      setRowError("Couldn't change the location. Try again.");
    } finally {
      setBusy(false);
    }
  };

  // Prototype 03: check-in without the deck — one tap on the card, right here.
  const resolve = async (outcome: 'EATEN' | 'TOSSED') => {
    if (busy) return;
    setBusy(true);
    setRowError(null);
    try {
      await trpc.item.resolve.mutate({ id: item.id, outcome });
      onChanged();
    } catch {
      setRowError("Couldn't save that. Try again.");
    } finally {
      setBusy(false);
    }
  };

  // Two-line hierarchy: the name leads in the display serif; everything else
  // is one quiet meta line. Actions sit right on the card — no expansion
  // needed for the common "ate it / tossed it" decision.
  const metaLine = [
    item.price != null ? `$${item.price.toFixed(2)}` : null,
    quantity,
    storageLabel(item.storageLocation),
  ]
    .filter(Boolean)
    .join(' · ');
  const expiresOn = item.expiresAt ? formatDate(item.expiresAt) : null;
  const freshnessColor =
    freshness == null
      ? theme.textSecondary
      : freshness.level === 'bad'
        ? theme.statusBadInk
        : freshness.level === 'warn'
          ? theme.statusWarnInk
          : theme.statusGood;
  // Short urgency callout on the EXP row, prototype tone. Only when it
  // changes what you do today — calm items get no label.
  const statusLabel =
    freshness == null || freshness.level === 'good'
      ? null
      : freshness.daysLeft < 0
        ? 'CHECK IT'
        : freshness.daysLeft === 0
          ? 'EXPIRING TODAY'
          : 'USE SOON';

  // The toggle Pressable wraps only the header lines. It used to wrap the
  // expanded controls too — a button role containing seven more buttons, which
  // VoiceOver flattens into an unreachable subtree (the classic RN trap).
  return (
    <ThemedView type="backgroundElement" style={styles.row}>
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityHint={expanded ? 'Collapses item details' : 'Shows item details and controls'}
        style={({ pressed }) => pressed && styles.pressed}>
        <ThemedView type="backgroundElement" style={styles.rowMain}>
          <ThemedText style={styles.rowName} numberOfLines={expanded ? undefined : 1}>
            {item.name}
          </ThemedText>
          {/* Status dot carries the freshness level — color-only is backed up
              by the reason line and the EXP row below. */}
          {freshness && (
            <ThemedView
              accessibilityLabel={`Freshness: ${freshness.chip ?? 'fine'}`}
              style={[styles.statusDot, { backgroundColor: freshnessColor }]}
            />
          )}
        </ThemedView>
        {metaLine.length > 0 && (
          <ThemedText type="small" themeColor="textSecondary">
            {metaLine}
          </ThemedText>
        )}
        {/* The reason only earns its line when it asks something of you. */}
        {!expanded && freshness && freshness.level !== 'good' && (
          <ThemedText type="small" themeColor="textSecondary" style={styles.reason}>
            {freshness.detail}
          </ThemedText>
        )}
      </Pressable>

      {/* EXP row: date chip left, urgency callout + date nudges right. */}
      {(expiresOn || statusLabel) && (
        <ThemedView type="backgroundElement" style={styles.controlRow}>
          {expiresOn && (
            <ThemedView type="backgroundSelected" style={styles.expChip}>
              <ThemedText type="small" themeColor="textSecondary">
                EXP
              </ThemedText>
              <ThemedText type="smallBold">{expiresOn}</ThemedText>
            </ThemedView>
          )}
          {statusLabel && (
            <ThemedText type="smallBold" style={{ color: freshnessColor }}>
              {statusLabel}
            </ThemedText>
          )}
          <ThemedView type="backgroundElement" style={styles.flexSpacer} />
          {ADJUSTMENTS.map(({ label, days, a11y }) => (
            <Pressable
              key={label}
              onPress={() => adjustBy(days)}
              disabled={busy}
              hitSlop={Spacing.two}
              accessibilityRole="button"
              accessibilityLabel={a11y}
              accessibilityState={{ disabled: busy }}
              style={({ pressed }) => [busy && styles.dim, pressed && styles.pressed]}>
              <ThemedView type="backgroundSelected" style={styles.controlChip}>
                <ThemedText type="smallBold">{label}</ThemedText>
              </ThemedView>
            </Pressable>
          ))}
        </ThemedView>
      )}

      {/* Action row — the card's whole point: resolve it here, in one tap. */}
      <ThemedView type="backgroundElement" style={styles.actionRow}>
        <Pressable
          onPress={() => resolve('EATEN')}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={`Mark ${item.name} as eaten`}
          accessibilityState={{ disabled: busy }}
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor: theme.primary },
            busy && styles.dim,
            pressed && styles.pressed,
          ]}>
          <Feather name="check" size={14} color={theme.primaryForeground} />
          <ThemedText type="smallBold" style={{ color: theme.primaryForeground }}>
            ATE IT
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={() => resolve('TOSSED')}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={`Mark ${item.name} as tossed`}
          accessibilityState={{ disabled: busy }}
          style={({ pressed }) => [
            styles.actionButton,
            { borderColor: theme.border },
            busy && styles.dim,
            pressed && styles.pressed,
          ]}>
          <Feather name="x" size={14} color={theme.text} />
          <ThemedText type="smallBold">TOSSED</ThemedText>
        </Pressable>
      </ThemedView>

      {expanded && (
        <ThemedView
          type="backgroundElement"
          style={[styles.rowDetail, { borderTopColor: theme.border }]}>
            {freshness && (
              <ThemedView type="backgroundElement" style={styles.detailRow}>
                <Feather name="clock" size={14} color={freshnessColor} style={styles.rowIcon} />
                <ThemedText type="small" themeColor="textSecondary" style={styles.detailText}>
                  {freshness.detail}
                </ThemedText>
              </ThemedView>
            )}

            <ThemedView type="backgroundElement" style={styles.controlRow}>
              <Feather name="map-pin" size={14} color={theme.textSecondary} />
              {LOCATIONS.map((location) => {
                const selected = item.storageLocation === location;
                return (
                  <Pressable
                    key={location}
                    onPress={() => setLocation(location)}
                    disabled={busy}
                    hitSlop={Spacing.two}
                    accessibilityRole="button"
                    accessibilityLabel={`Move to ${location.toLowerCase()}`}
                    accessibilityState={{ disabled: busy, selected }}
                    style={({ pressed }) => [busy && styles.dim, pressed && styles.pressed]}>
                    <ThemedView
                      type={selected ? 'backgroundSelected' : 'backgroundElement'}
                      style={[styles.controlChip, !selected && styles.controlChipGhost]}>
                      <ThemedText
                        type="small"
                        themeColor={selected ? 'text' : 'textSecondary'}>
                        {storageLabel(location)}
                      </ThemedText>
                    </ThemedView>
                  </Pressable>
                );
              })}
            </ThemedView>

            {rowError && (
              <ThemedText
                type="small"
                accessibilityRole="alert"
                style={{ color: theme.statusBad }}>
                {rowError}
              </ThemedText>
            )}
        </ThemedView>
      )}
    </ThemedView>
  );
}

export default function InventoryScreen() {
  const theme = useTheme();
  const { items, error, refreshing, refresh, reload } = useInventory();
  const [checkingIn, setCheckingIn] = useState(false);
  // Prototype 03's badge: anything not `good` is "needs attention" — the same
  // set that lifts into the "Use these first" section.
  const attentionCount =
    items?.filter((item) => {
      const f = estimateFreshness(item);
      return f !== null && f.level !== 'good';
    }).length ?? 0;
  // Prototype 03's pill is money, not a count: the price of everything that
  // needs attention. Falls back to the count when prices are missing.
  const atRisk =
    items
      ?.filter((item) => {
        const f = estimateFreshness(item);
        return f !== null && f.level !== 'good';
      })
      .reduce((sum, item) => sum + (item.price ?? 0), 0) ?? 0;

  // Android hardware back dismisses the deck instead of exiting the app.
  const closeCheckIn = useCallback(() => {
    setCheckingIn(false);
    refresh();
  }, [refresh]);
  useBackHandler(checkingIn, closeCheckIn);

  // The daily check-in takes over the screen (same pattern as capture →
  // review); closing it refetches so resolved items drop out of the list.
  // The stalk surface must wrap the SafeAreaView too — the deck paints its
  // own background, and a paper shell would show around it.
  if (checkingIn && items && items.length > 0) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: theme.stalk }]}>
        <SafeAreaView style={[styles.safeArea, { backgroundColor: 'transparent' }]}>
          <CheckInDeck items={items} onClose={closeCheckIn} />
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.titleRow}>
          {/* Prototype 03: the screen h1 — Fraunces display, not UI weight. */}
          <ThemedText type="title">Your kitchen</ThemedText>
          {/* Prototype 03: the pill beside the h1 carries the money at stake.
              Falls back to a count when prices are missing. */}
          {items !== null && attentionCount > 0 && (
            <ThemedView
              accessibilityLabel={
                atRisk > 0
                  ? `$${atRisk.toFixed(2)} of food at risk of going to waste`
                  : `${attentionCount} items need attention`
              }
              style={[styles.attentionBadge, { backgroundColor: `${theme.statusBad}26` }]}>
              <ThemedText type="smallBold" style={{ color: theme.statusBadInk }}>
                {atRisk > 0
                  ? `$${atRisk.toFixed(2)} at risk`
                  : `${attentionCount} need attention`}
              </ThemedText>
            </ThemedView>
          )}
        </ThemedView>

        {items !== null && items.length > 0 && (
          <Button title="Daily check-in" onPress={() => setCheckingIn(true)} />
        )}

        {error && (
          <ThemedText
            type="small"
            accessibilityRole="alert"
            style={[styles.error, { color: theme.destructive }]}>
            {error}
          </ThemedText>
        )}

        {items === null ? (
          <ThemedView style={styles.center}>
            <ActivityIndicator />
          </ThemedView>
        ) : items.length === 0 ? (
          <ThemedView style={styles.center}>
            <ThemedView
              style={[styles.emptyIcon, { backgroundColor: `${theme.primary}1A` }]}>
              <Feather name="shopping-bag" size={28} color={theme.primary} />
            </ThemedView>
            <ThemedText type="smallBold" style={styles.emptyTitle}>
              Your kitchen is empty
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
              Snap a receipt and everything you bought lands here, with freshness
              estimates so nothing goes to waste.
            </ThemedText>
            <Button
              title="Snap a receipt"
              onPress={() => router.push('/capture')}
              style={styles.emptyButton}
            />
          </ThemedView>
        ) : (
          <SectionList
            sections={toSections(items)}
            keyExtractor={(row) => row.item.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
            renderSectionHeader={({ section }) => (
              <ThemedView style={styles.sectionHeader}>
                <ThemedText
                  type="small"
                  themeColor="textSecondary"
                  style={styles.sectionLabel}>
                  {section.title}
                </ThemedText>
              </ThemedView>
            )}
            renderItem={({ item: row }) => <ItemRow {...row} onChanged={() => void reload()} />}
            stickySectionHeadersEnabled={false}
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    alignSelf: 'stretch',
    width: '100%',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  centerText: {
    textAlign: 'center',
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    lineHeight: 24,
  },
  emptyButton: {
    alignSelf: 'stretch',
    marginTop: Spacing.two,
  },
  list: {
    alignSelf: 'stretch',
  },
  listContent: {
    gap: Spacing.two,
    paddingBottom: BottomTabInset + Spacing.three,
  },
  sectionHeader: {
    paddingTop: Spacing.three,
    paddingBottom: Spacing.one,
  },
  // Prototype header pattern: 11px uppercase, tracked, ink-2 metadata.
  sectionLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 2.4, // ~0.22em at 11px
    fontVariant: ['tabular-nums'],
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  attentionBadge: {
    borderRadius: 999,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  row: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + Spacing.one,
    gap: Spacing.half,
  },
  rowMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  rowName: {
    flex: 1,
    // Prototype 03: item names set in the display serif, like the h1.
    fontFamily: FontFamilies.frauncesSemiBold,
    fontSize: 20,
    lineHeight: 26,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  expChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  flexSpacer: {
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.two + Spacing.one,
    borderRadius: Spacing.two,
    minHeight: 44,
  },
  reason: {
    fontSize: 12,
    lineHeight: 18,
  },
  rowDetail: {
    gap: Spacing.two,
    marginTop: Spacing.one,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.one,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  detailRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'flex-start',
  },
  rowIcon: {
    marginTop: 3, // optically centers the 14px icon on the first 20px text line
  },
  detailText: {
    flex: 1,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  controlChip: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  controlChipGhost: {
    opacity: 0.7,
  },
  error: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
  dim: {
    opacity: 0.5,
  },
});

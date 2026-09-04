import { Feather } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BottomTabInset, Spacing } from '@/constants/theme';
import type { ParsedReceipt } from '@/hooks/use-receipt-parse';
import { useTheme } from '@/hooks/use-theme';
import { trpc } from '@/lib/trpc';

// One row under edit. `id` is only present for parser-produced items — new
// rows the user adds by hand don't have one (receipt.confirm treats those as
// manual additions). `price` stays a string while editing; it's parsed once
// on save.
type EditableItem = {
  localKey: string;
  id?: string;
  name: string;
  price: string;
  category: string | null;
  // Parser's self-assessed extraction confidence (0-1). Only parser-produced
  // rows have one — hand-added rows don't, and the chip stays hidden for them.
  confidence?: number | null;
};

// "$12.98" / "1,234.5" -> number, anything unparseable -> null.
function parsePrice(raw: string): number | null {
  const match = raw.replace(/,/g, '').match(/\d+(\.\d+)?/);
  if (!match) return null;
  const value = Number.parseFloat(match[0]);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

let nextLocalKey = 0;

// Prototype 02: confidence chip right of each row. Good sits on floret lime
// (stalk-2 text), low sits on amber (amber-ink text) — same thresholds the
// parser prompt uses ("below 0.7" is the check-me zone).
const CONFIDENCE_LOW = 0.7;

// Parser lines below this never reach the review list (a garbled 40% line is
// noise the user would just X out; it's re-addable by hand if it was real).
const CONFIDENCE_FLOOR = 0.75;

type ItemTypeOption = { name: string; category: string };

function ConfidenceChip({ confidence }: { confidence: number }) {
  const theme = useTheme();
  const low = confidence < CONFIDENCE_LOW;
  return (
    <ThemedView
      style={[
        styles.confidenceChip,
        { backgroundColor: low ? `${theme.amber}40` : `${theme.floret}33` },
      ]}
    >
      <ThemedText
        type="small"
        style={{ color: low ? theme.statusWarnInk : theme.statusGood }}
      >
        {Math.round(confidence * 100)}%
      </ThemedText>
    </ThemedView>
  );
}

export function ReceiptReview({
  receipt,
  onSaved,
}: {
  receipt: ParsedReceipt;
  onSaved: (saved: ParsedReceipt) => void;
}) {
  const theme = useTheme();
  // Parser lines under this confidence are dropped before they ever reach the
  // review list — a garbled 40% line is noise the user would just X out, and
  // it's re-addable by hand if it was real. Chips still show for ≥floor rows.
  const droppedCount = receipt.items.filter(
    (i) => i.confidence != null && i.confidence < CONFIDENCE_FLOOR,
  ).length;
  const [items, setItems] = useState<EditableItem[]>(() =>
    receipt.items
      .filter((i) => i.confidence == null || i.confidence >= CONFIDENCE_FLOOR)
      .map((item) => ({
        localKey: item.id,
        id: item.id,
        name: item.name,
        price: item.price != null ? item.price.toFixed(2) : '',
        category: item.category,
        confidence: item.confidence,
      })),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Beta feedback 2026-09-04: with a tall receipt it wasn't clear the list
  // kept going below the fold. Every item row reports its frame; on each
  // scroll we count rows below the visible window and surface that as a
  // floating "N more below" pill that disappears when you reach the bottom.
  const [moreBelow, setMoreBelow] = useState(0);
  const rowFrames = useRef(new Map<string, { y: number; height: number }>());
  const viewport = useRef({ offset: 0, height: 0 });

  const recountBelow = () => {
    const { offset, height } = viewport.current;
    if (!height) return;
    const edge = offset + height - 8; // a row peeking in counts as visible
    let below = 0;
    for (const frame of rowFrames.current.values()) {
      if (frame.y + frame.height > edge) below++;
    }
    setMoreBelow((prev) => (prev === below ? prev : below));
  };

  // Last removed row, so a slip of the X isn't permanent. One level deep —
  // removing another row replaces it — which covers the actual mistake
  // (fat-fingering the X beside the price field) without a full undo stack.
  const [lastRemoved, setLastRemoved] = useState<{
    item: EditableItem;
    index: number;
  } | null>(null);

  // Category quick-pick: tapping a card's category row opens a searchable
  // modal over the ItemType catalog (the same 162 names the parser snaps to,
  // so a picked name always resolves to shelf-life data server-side).
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [typeSearch, setTypeSearch] = useState('');
  const [typeOptions, setTypeOptions] = useState<ItemTypeOption[] | null>(null);
  const [typesError, setTypesError] = useState(false);
  useEffect(() => {
    if (!pickerFor || typeOptions) return;
    let active = true;
    trpc.itemTypes
      .query()
      .then((rows) => active && setTypeOptions(rows))
      .catch(() => active && setTypesError(true));
    return () => {
      active = false;
    };
  }, [pickerFor, typeOptions]);
  const pickerItem = items.find((i) => i.localKey === pickerFor) ?? null;
  const filteredTypes = (typeOptions ?? []).filter((t) =>
    t.name.toLowerCase().includes(typeSearch.trim().toLowerCase()),
  );
  const pickCategory = (name: string) => {
    if (pickerFor) edit(pickerFor, { category: name });
    closePicker();
  };
  // One close path so the next open starts clean, and a failed catalog fetch
  // retries instead of caching the error for the session.
  const closePicker = () => {
    setPickerFor(null);
    setTypeSearch('');
  };
  const closeAndRetry = () => {
    setTypesError(false);
    closePicker();
  };

  const edit = (localKey: string, patch: Partial<EditableItem>) =>
    setItems((prev) =>
      prev.map((i) => (i.localKey === localKey ? { ...i, ...patch } : i)),
    );

  const remove = (localKey: string) =>
    setItems((prev) => {
      const index = prev.findIndex((i) => i.localKey === localKey);
      if (index === -1) return prev;
      setLastRemoved({ item: prev[index], index });
      // Drop the row's frame too — a stale entry would keep being counted as
      // "more below" by the scroll pill.
      rowFrames.current.delete(localKey);
      return prev.filter((i) => i.localKey !== localKey);
    });

  const restoreRemoved = () => {
    if (!lastRemoved) return;
    setItems((prev) => {
      const next = [...prev];
      next.splice(
        Math.min(lastRemoved.index, next.length),
        0,
        lastRemoved.item,
      );
      return next;
    });
    setLastRemoved(null);
  };

  const add = () =>
    setItems((prev) => [
      ...prev,
      {
        localKey: `new-${nextLocalKey++}`,
        name: '',
        price: '',
        category: null,
      },
    ]);

  const prices = items
    .map((i) => parsePrice(i.price))
    .filter((p): p is number => p !== null);
  const total = prices.length ? prices.reduce((a, b) => a + b, 0) : null;

  const save = async () => {
    // Blank leftover rows are ignored; a priced row with no name is a mistake
    // the user should resolve, not something to guess about.
    const kept = items.filter((i) => i.name.trim() || i.price.trim());
    if (kept.some((i) => !i.name.trim())) {
      setError('Every item needs a name.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const saved = await trpc.receipt.confirm.mutate({
        id: receipt.id,
        // Store name is hidden from the UI for now (beta feedback) but the
        // parsed value still saves — it may come back for analytics.
        storeName: receipt.storeName ?? null,
        purchasedAt: receipt.purchasedAt ?? undefined,
        total,
        items: kept.map((i) => ({
          id: i.id,
          name: i.name.trim(),
          price: parsePrice(i.price),
          category: i.category,
          confidence: i.confidence ?? null,
        })),
      });
      onSaved(saved);
    } catch {
      setError("Couldn't save. Check your connection and try again.");
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.flex}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          onScroll={(e) => {
            viewport.current.offset = e.nativeEvent.contentOffset.y;
            recountBelow();
          }}
          scrollEventThrottle={16}
          onLayout={(e) => {
            viewport.current.height = e.nativeEvent.layout.height;
            recountBelow();
          }}
          onContentSizeChange={recountBelow}
        >
          <ThemedText type="title">Check your items</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Fix anything the scan got wrong — tap a name, price, or category to
            edit.
          </ThemedText>
          {droppedCount > 0 && (
            <ThemedText type="small" themeColor="textSecondary">
              {droppedCount} low-confidence{' '}
              {droppedCount === 1 ? 'line' : 'lines'} from the scan were left
              out — add them by hand if they&apos;re real.
            </ThemedText>
          )}

          {items.map((item) => (
            <ThemedView
              key={item.localKey}
              type="backgroundElement"
              style={[styles.itemRow, { borderColor: theme.border }]}
              onLayout={(e) => {
                const { y, height } = e.nativeEvent.layout;
                rowFrames.current.set(item.localKey, { y, height });
              }}
            >
              <ThemedView type="backgroundElement" style={styles.itemFields}>
                {/* Field labels (beta feedback 2026-09-04): a bare "0.00"
                  only makes sense once you know the app — label both
                  columns in the hero-label style. Confidence lives in its
                  own badge in the card's bottom row (below), so Name and
                  Price get the whole top row to themselves. */}
                <ThemedView type="backgroundElement" style={styles.nameColumn}>
                  <ThemedText
                    type="small"
                    themeColor="textSecondary"
                    style={styles.fieldLabel}
                  >
                    Name
                  </ThemedText>
                  <Input
                    style={styles.nameInput}
                    value={item.name}
                    onChangeText={(name) => edit(item.localKey, { name })}
                    placeholder="Item name"
                    accessibilityLabel={
                      item.name ? `Name for ${item.name}` : 'Item name'
                    }
                    autoCapitalize="words"
                    // Beta feedback 2026-09-04: long OCR lines (a whole product
                    // description off the receipt) made rows unreadable. Receipt
                    // names rarely run past this, and the text stays editable.
                    maxLength={60}
                  />
                </ThemedView>
                <ThemedView type="backgroundElement" style={styles.priceColumn}>
                  <ThemedText
                    type="small"
                    themeColor="textSecondary"
                    style={styles.fieldLabel}
                  >
                    Price
                  </ThemedText>
                  <Input
                    style={styles.priceInput}
                    value={item.price}
                    onChangeText={(price) => edit(item.localKey, { price })}
                    placeholder="0.00"
                    accessibilityLabel={
                      item.name ? `Price for ${item.name}` : 'Item price'
                    }
                    keyboardType="decimal-pad"
                  />
                </ThemedView>
                {/* Extra marginLeft (on top of the row's own gap) sets this
                  apart as the destructive action, not just another data
                  field — the fat-finger risk the card's other rows are
                  built to avoid. */}
                <Pressable
                  onPress={() => remove(item.localKey)}
                  hitSlop={Spacing.three}
                  accessibilityRole="button"
                  accessibilityLabel={
                    item.name ? `Remove ${item.name}` : 'Remove item'
                  }
                  style={({ pressed }) => [
                    styles.controlLine,
                    styles.removeButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Feather name="x" size={18} color={theme.textSecondary} />
                </Pressable>
              </ThemedView>
              {/* Hairline + its own padding split the card into two legible
                zones: editable fields above, category + confidence below —
                rather than one dense stack. Category keeps a comfortable
                tap target on the left; confidence is now a compact badge
                tucked into the lower-right corner, clear of the category
                pressable, so Name and Price get the top row to themselves. */}
              <ThemedView
                type="backgroundElement"
                style={[styles.bottomRow, { borderTopColor: theme.border }]}
              >
                <Pressable
                  onPress={() => setPickerFor(item.localKey)}
                  accessibilityRole="button"
                  accessibilityLabel={
                    item.category
                      ? `Change category, currently ${item.category}`
                      : 'Set category'
                  }
                  style={({ pressed }) => [
                    styles.categoryRow,
                    pressed && styles.pressed,
                  ]}
                >
                  <Feather name="tag" size={14} color={theme.textSecondary} />
                  <ThemedText
                    type="small"
                    themeColor="textSecondary"
                    numberOfLines={1}
                    style={styles.categoryText}
                  >
                    {item.category ?? 'Uncategorized'}
                  </ThemedText>
                  <Feather
                    name="chevron-right"
                    size={14}
                    color={theme.textSecondary}
                  />
                </Pressable>
                {item.confidence != null && (
                  <ThemedView
                    type="backgroundElement"
                    style={styles.confidenceBadge}
                  >
                    <ThemedText
                      type="small"
                      themeColor="textSecondary"
                      style={styles.confidenceLabel}
                    >
                      Confidence
                    </ThemedText>
                    <ConfidenceChip confidence={item.confidence} />
                  </ThemedView>
                )}
              </ThemedView>
            </ThemedView>
          ))}

          {lastRemoved && (
            <ThemedView type="backgroundElement" style={styles.removedRow}>
              <ThemedText
                type="small"
                themeColor="textSecondary"
                style={styles.removedText}
                numberOfLines={1}
              >
                Removed {lastRemoved.item.name.trim() || 'item'}
              </ThemedText>
              <Pressable
                onPress={restoreRemoved}
                hitSlop={Spacing.three}
                accessibilityRole="button"
                accessibilityLabel={`Undo removing ${lastRemoved.item.name.trim() || 'item'}`}
                style={({ pressed }) => pressed && styles.pressed}
              >
                <ThemedText type="linkPrimary">Undo</ThemedText>
              </Pressable>
            </ThemedView>
          )}

          <Pressable
            onPress={add}
            hitSlop={Spacing.two}
            accessibilityRole="button"
            style={({ pressed }) => pressed && styles.pressed}
          >
            <ThemedView style={styles.addRow}>
              <Feather name="plus" size={16} color={theme.primary} />
              <ThemedText type="linkPrimary">Add an item</ThemedText>
            </ThemedView>
          </Pressable>
        </ScrollView>

        {/* Beta feedback 2026-09-04: a floating "more below" affordance —
            tells the user how many rows are waiting past the fold without
            making them try to scroll first. pointerEvents="none" so it never
            blocks the last visible row's controls. */}
        {moreBelow > 0 && (
          <View style={styles.moreBelowWrap} pointerEvents="none">
            <ThemedView
              type="backgroundElement"
              style={[styles.moreBelowPill, { borderColor: theme.border }]}
            >
              <Feather name="chevron-down" size={14} color={theme.primary} />
              <ThemedText type="small" style={styles.moreBelowText}>
                {moreBelow} more {moreBelow === 1 ? 'item' : 'items'} below
              </ThemedText>
            </ThemedView>
          </View>
        )}
      </View>

      <ThemedView style={styles.footer}>
        {error && (
          <ThemedText
            type="small"
            accessibilityRole="alert"
            style={[styles.error, { color: theme.destructive }]}
          >
            {error}
          </ThemedText>
        )}
        <ThemedView style={styles.totalRow}>
          <ThemedText type="small" themeColor="textSecondary">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </ThemedText>
          <ThemedText type="smallBold">
            {total != null ? `$${total.toFixed(2)}` : '—'}
          </ThemedText>
        </ThemedView>
        <Button title="Add to kitchen" loading={saving} onPress={save} />
      </ThemedView>

      <Modal
        visible={pickerFor !== null}
        animationType="slide"
        onRequestClose={closeAndRetry}
        accessibilityViewIsModal
      >
        {/* Beta feedback 2026-09-04: the native keyboard slides up over the
            bottom-anchored sheet and blocks the results. Avoiding it keeps the
            search box and list above the keyboard; autoFocus means the layout
            settles once, before results render, instead of jumping mid-pick. */}
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ThemedView style={styles.modalPage}>
            <ThemedView type="backgroundElement" style={styles.modalCard}>
              <ThemedText type="smallBold" numberOfLines={1}>
                Category for {pickerItem?.name.trim() || 'item'}
              </ThemedText>
              <Input
                value={typeSearch}
                onChangeText={setTypeSearch}
                placeholder="Search categories…"
                accessibilityLabel="Search categories"
                autoFocus
              />
              {typesError ? (
                <ThemedText
                  type="small"
                  themeColor="textSecondary"
                  style={styles.modalStatus}
                >
                  Couldn&apos;t load categories. Close and try again.
                </ThemedText>
              ) : !typeOptions ? (
                <ThemedText
                  type="small"
                  themeColor="textSecondary"
                  style={styles.modalStatus}
                >
                  Loading…
                </ThemedText>
              ) : (
                <FlatList
                  data={filteredTypes}
                  keyExtractor={(t) => t.name}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item: t }) => (
                    <Pressable
                      onPress={() => pickCategory(t.name)}
                      accessibilityRole="button"
                      accessibilityLabel={`Set category to ${t.name}`}
                      style={({ pressed }) => [
                        styles.typeRow,
                        pressed && styles.pressed,
                        pickerItem?.category === t.name &&
                          styles.typeRowCurrent,
                      ]}
                    >
                      <ThemedText
                        type="small"
                        numberOfLines={1}
                        style={styles.typeName}
                      >
                        {t.name}
                      </ThemedText>
                      <ThemedText
                        type="small"
                        themeColor="textSecondary"
                        numberOfLines={1}
                      >
                        {t.category}
                      </ThemedText>
                    </Pressable>
                  )}
                  ListEmptyComponent={
                    <ThemedText
                      type="small"
                      themeColor="textSecondary"
                      style={styles.modalStatus}
                    >
                      No match — leave it uncategorized.
                    </ThemedText>
                  }
                />
              )}
              <Button
                title="Done"
                onPress={closeAndRetry}
                style={styles.stretch}
              />
            </ThemedView>
          </ThemedView>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  // Floating "more below" pill (beta feedback 2026-09-04): pinned above the
  // footer, centered over the list, out of the touch path.
  moreBelowWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: Spacing.two,
  },
  moreBelowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  moreBelowText: {
    fontVariant: ['tabular-nums'],
  },
  list: {
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  removedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  removedText: {
    flexShrink: 1,
  },
  // Each item is a card (prototype 02): fields on top, its category tucked
  // inside the card below — the category belongs to this item and nothing
  // else, so it can't be misread against a neighbouring row. Padding bumped
  // from Spacing.two so the card's own border has room to breathe around the
  // bordered inputs it holds — at 8px the two boundaries collided.
  itemRow: {
    borderRadius: Spacing.two,
    borderWidth: 1,
    padding: Spacing.three,
  },
  // Beta feedback 2026-09-04: the three controls had three different natural
  // heights (input ~54, chip ~24, bare icon), so bottom-aligning them left the
  // chip and X hanging low. Everything now shares one 48px control line;
  // single-line text and the chip/X are centered inside it.
  itemFields: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
  },
  controlLine: {
    height: 48,
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  // Tiny uppercase column labels (hero-label style): PRICE / CONFIDENCE.
  fieldLabel: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.half,
  },
  nameColumn: {
    flex: 1,
    // Flex items default their minimum size to their content's natural
    // width, not 0 — without this, a long unwrapped OCR name (e.g.
    // "R-CUCUMBERS PERSIAN 1 LB") refuses to shrink and pushes the whole
    // row, and the card itself, past the right edge of the screen.
    minWidth: 0,
    backgroundColor: 'transparent',
  },
  priceColumn: {
    backgroundColor: 'transparent',
  },
  removeButton: {
    marginLeft: Spacing.one,
  },
  // Divider + its own padding, not the card's shared `gap`, so the two zones
  // read as separate even though they're one card: fields you type into
  // above the line, category + confidence below it.
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    marginTop: Spacing.two,
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  // flexShrink + minWidth: 0 let a long category name truncate instead of
  // fighting the confidence badge for space (the same overflow trap the
  // name field hit — see nameColumn).
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    flexShrink: 1,
    minWidth: 0,
    paddingVertical: Spacing.one,
  },
  categoryText: {
    flexShrink: 1,
  },
  // Confidence, demoted from a full labeled column (beta feedback
  // 2026-09-04) to a compact badge in the card's lower-right corner —
  // freeing the top row for just Name and Price.
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
    flexShrink: 0,
    backgroundColor: 'transparent',
  },
  confidenceLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Category quick-pick modal
  modalPage: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalCard: {
    gap: Spacing.two,
    borderTopLeftRadius: Spacing.three,
    borderTopRightRadius: Spacing.three,
    padding: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  modalStatus: {
    textAlign: 'center',
    paddingVertical: Spacing.four,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.one,
    borderRadius: Spacing.one,
  },
  typeRowCurrent: {
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  typeName: {
    flexShrink: 1,
  },
  stretch: {
    alignSelf: 'stretch',
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  nameInput: {
    height: 48,
    paddingVertical: 0,
    textAlignVertical: 'center',
  },
  priceInput: {
    width: 90,
    height: 48,
    paddingVertical: 0,
    textAlignVertical: 'center',
    textAlign: 'right',
  },
  confidenceChip: {
    borderRadius: 999, // full-round, like the prototype's pills
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  footer: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: BottomTabInset + Spacing.three,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  error: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
});

import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { ParsedReceipt } from '@/hooks/use-receipt-parse';
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
};

// "$12.98" / "1,234.5" -> number, anything unparseable -> null.
function parsePrice(raw: string): number | null {
  const match = raw.replace(/,/g, '').match(/\d+(\.\d+)?/);
  if (!match) return null;
  const value = Number.parseFloat(match[0]);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

let nextLocalKey = 0;

export function ReceiptReview({
  receipt,
  onSaved,
}: {
  receipt: ParsedReceipt;
  onSaved: (saved: ParsedReceipt) => void;
}) {
  const theme = useTheme();
  const [storeName, setStoreName] = useState(receipt.storeName ?? '');
  const [items, setItems] = useState<EditableItem[]>(() =>
    receipt.items.map((item) => ({
      localKey: item.id,
      id: item.id,
      name: item.name,
      price: item.price != null ? item.price.toFixed(2) : '',
      category: item.category,
    }))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const edit = (localKey: string, patch: Partial<EditableItem>) =>
    setItems((prev) => prev.map((i) => (i.localKey === localKey ? { ...i, ...patch } : i)));

  const remove = (localKey: string) => setItems((prev) => prev.filter((i) => i.localKey !== localKey));

  const add = () =>
    setItems((prev) => [
      ...prev,
      { localKey: `new-${nextLocalKey++}`, name: '', price: '', category: null },
    ]);

  const prices = items.map((i) => parsePrice(i.price)).filter((p): p is number => p !== null);
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
        storeName: storeName.trim() || null,
        purchasedAt: receipt.purchasedAt ?? undefined,
        total,
        items: kept.map((i) => ({
          id: i.id,
          name: i.name.trim(),
          price: parsePrice(i.price),
          category: i.category,
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
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled">
        <ThemedText type="subtitle">Check your items</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Fix anything the scan got wrong — tap a name or price to edit.
        </ThemedText>

        <Input value={storeName} onChangeText={setStoreName} placeholder="Store" />

        {items.map((item) => (
          <ThemedView key={item.localKey} style={styles.itemRow}>
            <ThemedView style={styles.itemFields}>
              <Input
                style={styles.nameInput}
                value={item.name}
                onChangeText={(name) => edit(item.localKey, { name })}
                placeholder="Item name"
                autoCapitalize="words"
              />
              <Input
                style={styles.priceInput}
                value={item.price}
                onChangeText={(price) => edit(item.localKey, { price })}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
              <Pressable
                onPress={() => remove(item.localKey)}
                hitSlop={Spacing.three}
                accessibilityRole="button"
                accessibilityLabel={item.name ? `Remove ${item.name}` : 'Remove item'}
                style={({ pressed }) => pressed && styles.pressed}>
                <Feather name="x" size={18} color={theme.textSecondary} />
              </Pressable>
            </ThemedView>
            {item.category && (
              <ThemedText type="small" themeColor="textSecondary">
                {item.category}
              </ThemedText>
            )}
          </ThemedView>
        ))}

        <Pressable
          onPress={add}
          hitSlop={Spacing.two}
          accessibilityRole="button"
          style={({ pressed }) => pressed && styles.pressed}>
          <ThemedView style={styles.addRow}>
            <Feather name="plus" size={16} color={theme.primary} />
            <ThemedText type="linkPrimary">Add an item</ThemedText>
          </ThemedView>
        </Pressable>
      </ScrollView>

      <ThemedView style={styles.footer}>
        {error && (
          <ThemedText type="small" style={[styles.error, { color: theme.destructive }]}>
            {error}
          </ThemedText>
        )}
        <ThemedView style={styles.totalRow}>
          <ThemedText type="small" themeColor="textSecondary">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </ThemedText>
          <ThemedText type="smallBold">{total != null ? `$${total.toFixed(2)}` : '—'}</ThemedText>
        </ThemedView>
        <Button title="Save items" loading={saving} onPress={save} />
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  list: {
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  itemRow: {
    gap: Spacing.one,
  },
  itemFields: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  nameInput: {
    flex: 1,
  },
  priceInput: {
    width: 90,
    textAlign: 'right',
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

import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ReceiptReview } from '@/components/receipt-review';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { ParsedReceipt, useReceiptParse } from '@/hooks/use-receipt-parse';
import { useImageUploader } from '@/lib/uploadthing';

// A receipt as it exists right after upload: stored on UploadThing, not yet
// parsed. `url` + `key` are exactly what receipt.create wants.
type UploadedReceipt = {
  url: string;
  key: string;
};

export default function CaptureScreen() {
  const [uploaded, setUploaded] = useState<UploadedReceipt | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saved, setSaved] = useState<ParsedReceipt | null>(null);
  const parse = useReceiptParse();

  const { openImagePicker, isUploading } = useImageUploader('receiptFile', {
    onClientUploadComplete: (files) => {
      const data = files[0]?.serverData;
      if (!data) return;
      setUploaded({ url: data.url, key: data.key });
      // The parse leg: receipt.create + poll receipt.get until READY/ERROR.
      void parse.start({ url: data.url, key: data.key });
    },
    onUploadError: (e) => setUploadError(e.message),
  });

  const capture = (source: 'camera' | 'library') => {
    setUploadError(null);
    setUploaded(null);
    setSaved(null);
    parse.reset();
    openImagePicker({
      source,
      // Full frame, no crop step — receipts are long and the parser wants the
      // whole thing. Light compression keeps long photos under the 16MB cap.
      allowsEditing: false,
      quality: 0.8,
      onInsufficientPermissions: () =>
        setUploadError(
          source === 'camera'
            ? 'Camera access is off. Enable it for Broccoli in Settings.'
            : 'Photo access is off. Enable it for Broccoli in Settings.'
        ),
    });
  };

  // Parse landed: hand the whole screen over to review (vqy.3/vqy.4).
  if (parse.state.status === 'ready') {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={[styles.safeArea, styles.reviewSafeArea]}>
          <ReceiptReview
            receipt={parse.state.receipt}
            onSaved={(receipt) => {
              setSaved(receipt);
              setUploaded(null);
              parse.reset();
            }}
          />
        </SafeAreaView>
      </ThemedView>
    );
  }

  const error = uploadError ?? (parse.state.status === 'error' ? parse.state.message : null);
  const busy = isUploading || parse.state.status === 'processing';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.heroSection}>
          {saved ? (
            <>
              <ThemedText type="subtitle" style={styles.title}>
                Saved ✓
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.title}>
                {saved.items.length} {saved.items.length === 1 ? 'item' : 'items'}
                {saved.storeName ? ` from ${saved.storeName}` : ''} added to your groceries.
              </ThemedText>
            </>
          ) : uploaded ? (
            <>
              <Image source={{ uri: uploaded.url }} style={styles.preview} contentFit="cover" />
              {parse.state.status === 'processing' && (
                <ThemedView style={styles.statusRow}>
                  <ActivityIndicator size="small" />
                  <ThemedText type="small" themeColor="textSecondary">
                    Reading your receipt…
                  </ThemedText>
                </ThemedView>
              )}
            </>
          ) : (
            <>
              <ThemedText type="title" style={styles.title}>
                Snap a receipt
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.title}>
                Point, shoot, done — Broccoli turns it into your grocery list.
              </ThemedText>
            </>
          )}
        </ThemedView>

        {error && (
          <ThemedText type="small" style={styles.error}>
            {error}
          </ThemedText>
        )}

        <Pressable onPress={() => capture('camera')} disabled={busy} style={styles.stretch}>
          <ThemedView type="backgroundSelected" style={styles.primaryButton}>
            {busy ? (
              <ActivityIndicator />
            ) : (
              <ThemedText type="smallBold">
                {saved !== null || uploaded !== null ? 'Snap another receipt' : 'Open camera'}
              </ThemedText>
            )}
          </ThemedView>
        </Pressable>

        <Pressable onPress={() => capture('library')} disabled={busy}>
          <ThemedText type="linkPrimary">Choose from library</ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },
  reviewSafeArea: {
    paddingHorizontal: 0,
    paddingBottom: 0,
    alignItems: 'stretch',
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  title: {
    textAlign: 'center',
  },
  preview: {
    width: 220,
    aspectRatio: 3 / 4,
    borderRadius: Spacing.three,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  error: {
    color: '#D93025',
    textAlign: 'center',
  },
  stretch: {
    alignSelf: 'stretch',
  },
  primaryButton: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.four,
  },
});

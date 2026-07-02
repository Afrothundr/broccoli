import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useImageUploader } from '@/lib/uploadthing';

// A receipt as it exists right after upload: stored on UploadThing, not yet
// parsed. `url` + `key` are exactly what receipt.create wants (vqy.2).
type UploadedReceipt = {
  url: string;
  key: string;
};

export default function CaptureScreen() {
  const [uploaded, setUploaded] = useState<UploadedReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { openImagePicker, isUploading } = useImageUploader('receiptFile', {
    onClientUploadComplete: (files) => {
      const data = files[0]?.serverData;
      if (data) setUploaded({ url: data.url, key: data.key });
    },
    onUploadError: (e) => setError(e.message),
  });

  const capture = (source: 'camera' | 'library') => {
    setError(null);
    setUploaded(null);
    openImagePicker({
      source,
      // Full frame, no crop step — receipts are long and the parser wants the
      // whole thing. Light compression keeps long photos under the 16MB cap.
      allowsEditing: false,
      quality: 0.8,
      onInsufficientPermissions: () =>
        setError(
          source === 'camera'
            ? 'Camera access is off. Enable it for Broccoli in Settings.'
            : 'Photo access is off. Enable it for Broccoli in Settings.'
        ),
    });
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.heroSection}>
          {uploaded ? (
            <>
              <Image source={{ uri: uploaded.url }} style={styles.preview} contentFit="cover" />
              <ThemedText type="small" themeColor="textSecondary">
                Receipt uploaded. Extraction comes next.
              </ThemedText>
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

        <Pressable onPress={() => capture('camera')} disabled={isUploading} style={styles.stretch}>
          <ThemedView type="backgroundSelected" style={styles.primaryButton}>
            {isUploading ? (
              <ActivityIndicator />
            ) : (
              <ThemedText type="smallBold">
                {uploaded ? 'Snap another receipt' : 'Open camera'}
              </ThemedText>
            )}
          </ThemedView>
        </Pressable>

        <Pressable onPress={() => capture('library')} disabled={isUploading}>
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

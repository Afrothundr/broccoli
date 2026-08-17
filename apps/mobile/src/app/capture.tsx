import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ReceiptReview } from '@/components/receipt-review';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { ParsedReceipt, useReceiptParse } from '@/hooks/use-receipt-parse';
import { useTheme } from '@/hooks/use-theme';
import { trpc } from '@/lib/trpc';
import { useUploadThing } from '@/lib/uploadthing';

// A receipt as it exists right after upload: stored on UploadThing, not yet
// parsed. `url` + `key` are exactly what receipt.create wants. `isPdf` only
// drives the preview — a PDF url can't render through expo-image.
type UploadedReceipt = {
  url: string;
  key: string;
  isPdf: boolean;
};

// The parse wait is the app's longest silence (the poll allows up to 90s), so
// the status line moves with it instead of freezing on one sentence: sets the
// expectation early, then acknowledges the long tail rather than going quiet
// exactly when doubt sets in.
const PARSE_STAGES: { afterMs: number; message: string }[] = [
  { afterMs: 0, message: 'Reading your receipt — usually under a minute…' },
  { afterMs: 15_000, message: 'Finding your items…' },
  { afterMs: 40_000, message: 'Almost there — long receipts take a little longer…' },
];

function useParseStageMessage(active: boolean): string {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (!active) return;
    const timers = PARSE_STAGES.slice(1).map(({ afterMs }, i) =>
      setTimeout(() => setStage(i + 1), afterMs)
    );
    return () => {
      timers.forEach(clearTimeout);
      setStage(0); // reset in cleanup, so the next parse starts at stage one
    };
  }, [active]);

  return PARSE_STAGES[stage].message;
}

export default function CaptureScreen() {
  const theme = useTheme();
  const [uploaded, setUploaded] = useState<UploadedReceipt | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saved, setSaved] = useState<ParsedReceipt | null>(null);
  // Whether the in-flight upload is a PDF. A ref, not state: it's read inside
  // onClientUploadComplete, which closes over the render it was created in.
  const pdfInFlight = useRef(false);
  const parse = useReceiptParse();
  // Called unconditionally (rules of hooks) — the review takeover below
  // returns early, and this must not sit past that branch.
  const parseMessage = useParseStageMessage(parse.state.status === 'processing');

  // Resume card: a receipt parsed but never confirmed (the app was killed or
  // backgrounded mid-review) sits READY server-side — resurface it instead of
  // silently dropping it. Checked on focus, only while this screen is idle.
  const [pending, setPending] = useState<ParsedReceipt | null>(null);
  const idle = parse.state.status === 'idle' && !uploaded && !saved;
  useFocusEffect(
    useCallback(() => {
      if (!idle) return;
      let active = true;
      // Fully untyped boundary, on purpose. This route returns the same
      // serialized payload as receipt.get, but letting TS derive or compare
      // that through the tRPC proxy blows the instantiation-depth limit
      // (TS2589) — two independently-inferred Prisma payloads never compare
      // cheaply. The api pins the shape server-side (ReceiptWithItems | null
      // on receipt.latestUnconfirmed); one cast from unknown re-enters the
      // typed world at ParsedReceipt, which every other call site shares.
      const route = (trpc as unknown as Record<'receipt', Record<string, { query: (i: object) => Promise<unknown> }>>)
        .receipt.latestUnconfirmed;
      route
        .query({})
        .then((receipt) => active && setPending(receipt as ParsedReceipt | null))
        .catch(() => {}); // best-effort: no resume card is the graceful failure
      return () => {
        active = false;
      };
    }, [idle])
  );

  const { startUpload, isUploading } = useUploadThing('receiptFile', {
    onClientUploadComplete: (files) => {
      const data = files[0]?.serverData;
      if (!data) return;
      setUploaded({ url: data.url, key: data.key, isPdf: pdfInFlight.current });
      // The parse leg: receipt.create + poll receipt.get until READY/ERROR.
      void parse.start({ url: data.url, key: data.key });
    },
    onUploadError: (e) => setUploadError(e.message),
  });

  // We drive expo-image-picker ourselves instead of the library's
  // openImagePicker helper: that helper converts the picked asset via
  // fetch(uri) → blob → File, and on Expo's WinterCG fetch that dies with
  // "Creating blobs from 'ArrayBuffer' ... not supported" (RN's Blob can't be
  // built from ArrayBuffers). uploadthing's transport doesn't need a File at
  // all — a {uri, name, type, size} object goes straight into RN's FormData.
  const capture = async (source: 'camera' | 'library') => {
    setUploadError(null);
    setUploaded(null);
    setSaved(null);
    parse.reset();

    if (source === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        setUploadError('Camera access is off. Enable it for Broccoli in Settings.');
        return;
      }
    }

    // Full frame, no crop step — receipts are long and the parser wants the
    // whole thing. Light compression keeps long photos under the 16MB cap.
    const options = { mediaTypes: ['images'] as ImagePicker.MediaType[], quality: 0.8 };
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled) return;

    const asset = result.assets[0];
    pdfInFlight.current = false;
    const file = {
      uri: asset.uri,
      name: asset.fileName ?? asset.uri.split('/').pop() ?? 'receipt.jpg',
      type: asset.mimeType ?? 'image/jpeg',
      size: asset.fileSize ?? 0,
    };
    try {
      await startUpload([file as unknown as File]);
    } catch {
      setUploadError('Upload failed. Please try again.');
    }
  };

  // Email receipts and multi-page scans arrive as PDFs. The whole backend
  // already takes them — the UploadThing route accepts pdf (16MB) and
  // broccoli-model rasterises the first 5 pages via PyMuPDF — this picker was
  // the only thing in the way. The model reads by content-type, so the upload
  // must go up as application/pdf.
  const pickPdf = async () => {
    setUploadError(null);
    setUploaded(null);
    setSaved(null);
    parse.reset();

    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    pdfInFlight.current = true;
    const file = {
      uri: asset.uri,
      name: asset.name || 'receipt.pdf',
      type: asset.mimeType ?? 'application/pdf',
      size: asset.size ?? 0,
    };
    try {
      await startUpload([file as unknown as File]);
    } catch {
      setUploadError('Upload failed. Please try again.');
    }
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

  const cancelParse = () => {
    parse.reset();
    setUploaded(null);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.heroSection}>
          {saved ? (
            <>
              <Feather name="check-circle" size={44} color={theme.statusGood} />
              <ThemedText type="subtitle" style={styles.title}>
                Saved
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.title}>
                {saved.items.length} {saved.items.length === 1 ? 'item' : 'items'} added to your
                kitchen.
              </ThemedText>
              <Pressable
                onPress={() => router.push('/inventory')}
                hitSlop={Spacing.two}
                accessibilityRole="button"
                style={({ pressed }) => pressed && styles.pressed}>
                <ThemedText type="linkPrimary">See your kitchen</ThemedText>
              </Pressable>
            </>
          ) : uploaded ? (
            <>
              {uploaded.isPdf ? (
                <ThemedView style={[styles.preview, styles.pdfPreview, { borderColor: theme.border }]}>
                  <Feather name="file-text" size={44} color={theme.textSecondary} />
                  <ThemedText type="small" themeColor="textSecondary">
                    PDF receipt
                  </ThemedText>
                </ThemedView>
              ) : (
                <Image source={{ uri: uploaded.url }} style={styles.preview} contentFit="cover" />
              )}
              {parse.state.status === 'processing' && (
                <>
                  <ThemedView style={styles.statusRow}>
                    <ActivityIndicator size="small" />
                    <ThemedText type="small" themeColor="textSecondary">
                      {parseMessage}
                    </ThemedText>
                  </ThemedView>
                  <Pressable
                    onPress={cancelParse}
                    hitSlop={Spacing.two}
                    accessibilityRole="button"
                    accessibilityLabel="Cancel reading this receipt"
                    style={({ pressed }) => pressed && styles.pressed}>
                    <ThemedText type="small" themeColor="textSecondary" style={styles.cancelLink}>
                      Cancel
                    </ThemedText>
                  </Pressable>
                </>
              )}
            </>
          ) : (
            <>
              {/* subtitle, not title: Home and Kitchen head with 32px — the
                  top-level screens share one headline scale. */}
              <ThemedText type="subtitle" style={styles.title}>
                Snap a receipt
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.title}>
                Point, shoot, done — everything you bought lands in your kitchen.
              </ThemedText>
            </>
          )}
        </ThemedView>

        {error && (
          <ThemedText
            type="small"
            accessibilityRole="alert"
            style={[styles.error, { color: theme.destructive }]}>
            {error}
          </ThemedText>
        )}

        {idle && pending && pending.items.length > 0 && (
          <ThemedView type="backgroundElement" style={styles.pendingCard}>
            <ThemedView type="backgroundElement" style={styles.pendingText}>
              <ThemedText type="smallBold">A receipt is waiting for review</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {pending.items.length} {pending.items.length === 1 ? 'item' : 'items'} read and
                ready to add.
              </ThemedText>
            </ThemedView>
            <Pressable
              onPress={() => {
                parse.resume(pending);
                setPending(null);
              }}
              hitSlop={Spacing.two}
              accessibilityRole="button"
              accessibilityLabel="Review the waiting receipt"
              style={({ pressed }) => pressed && styles.pressed}>
              <ThemedText type="linkPrimary">Review it</ThemedText>
            </Pressable>
          </ThemedView>
        )}

        <Button
          title={saved !== null || uploaded !== null ? 'Snap another receipt' : 'Open camera'}
          loading={busy}
          onPress={() => capture('camera')}
          style={styles.stretch}
        />

        <Pressable
          onPress={() => capture('library')}
          disabled={busy}
          hitSlop={Spacing.two}
          accessibilityRole="button"
          accessibilityState={{ disabled: busy }}
          style={({ pressed }) => [busy && styles.dim, pressed && styles.pressed]}>
          <ThemedText type="linkPrimary">Choose from your photos</ThemedText>
        </Pressable>

        <Pressable
          onPress={pickPdf}
          disabled={busy}
          hitSlop={Spacing.two}
          accessibilityRole="button"
          accessibilityState={{ disabled: busy }}
          style={({ pressed }) => [busy && styles.dim, pressed && styles.pressed]}>
          <ThemedText type="linkPrimary">Upload a PDF receipt</ThemedText>
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
  pdfPreview: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  cancelLink: {
    textDecorationLine: 'underline',
  },
  pendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    alignSelf: 'stretch',
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  pendingText: {
    flexShrink: 1,
    gap: Spacing.half,
  },
  error: {
    textAlign: 'center',
  },
  stretch: {
    alignSelf: 'stretch',
  },
  pressed: {
    opacity: 0.6,
  },
  dim: {
    opacity: 0.5,
  },
});

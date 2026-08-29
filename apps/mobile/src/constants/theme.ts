/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

// One red per scheme: destructive actions keep the pure red below — the
// Produce Ledger terracotta (`statusBad`) is reserved for expiry/waste chips.
// Defined once so the tokens can't drift.
const RED_LIGHT = '#DC2626';
const RED_DARK = '#F87171';

// Produce Ledger design system (planning/mobile-redesign-2026-08-28.md),
// ported from the design prototype's oklch tokens (styles.css :root).
// Light values are the prototype itself; dark values keep the existing
// dark scheme (light-only first pass) with new tokens approximated.
export const Colors = {
  light: {
    text: '#2B2A24', // ink
    background: '#F6F3EA', // paper
    backgroundElement: '#EFE9D8', // paper-2
    backgroundSelected: '#E6E0CD', // paper-2 pressed
    textSecondary: '#6E6A5C', // ink-2
    primary: '#2F5A39', // stalk-2
    primaryForeground: '#F6F3EA', // paper
    border: '#E0DAC8',
    destructive: RED_LIGHT,
    // Freshness chips: good = brand green, so "fresh" reads as broccoli.
    // Warn/bad use the prototype's amber/terracotta tones.
    statusGood: '#2F5A39', // stalk-2
    statusWarn: '#8A5A17', // amber-ink
    statusBad: '#BE5B38', // danger-broc (terracotta)
    // Ink variants for status CHIPS — the plain status colors drop below
    // 4.5:1 as small text on their tinted chip backgrounds (CVD audit
    // 2026-08-28). Dark enough to pass AA on the chip fill in both themes.
    statusWarnInk: '#7A4E13',
    statusBadInk: '#8F3E22',
    // Extended Produce Ledger tokens — hero surfaces and accents.
    stalk: '#254527',
    floret: '#8FD25A',
    floret2: '#A8DF7E', // floret-2, lime on dark surfaces
    amber: '#DCA23A',
    shell: '#122117',
  },
  dark: {
    text: '#FAFAFA',
    background: '#09090B',
    backgroundElement: '#18181B', // card (zinc-900)
    backgroundSelected: '#27272A', // secondary (zinc-800)
    textSecondary: '#A1A1AA', // zinc-400
    primary: '#5E9943', // brand green, dark variant
    primaryForeground: '#F6F3EA',
    border: '#3F3F46',
    destructive: RED_DARK,
    statusGood: '#5E9943',
    statusWarn: '#E0A83E',
    statusBad: '#E08A6A', // danger-broc, lightened for dark bg
    statusWarnInk: '#E0A83E',
    statusBadInk: '#E08A6A',
    stalk: '#122117',
    floret: '#8FD25A',
    floret2: '#A8DF7E',
    amber: '#DCA23A',
    shell: '#0D1610',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

// Produce Ledger type (planning/mobile-redesign-2026-08-28.md): Inter for UI,
// Fraunces for display figures and section headers. Loaded in the root layout;
// these are the @expo-google-fonts family names.
export const FontFamilies = {
  interRegular: 'Inter_400Regular',
  interMedium: 'Inter_500Medium',
  interSemiBold: 'Inter_600SemiBold',
  interBold: 'Inter_700Bold',
  frauncesSemiBold: 'Fraunces_600SemiBold',
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

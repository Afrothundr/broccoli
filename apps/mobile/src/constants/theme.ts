/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

// Ported from broccoli-dashboard's design tokens (src/styles/globals.css):
// zinc-scale neutrals with the brand green as primary. The dashboard defines
// these in oklch; values here are their hex equivalents.
export const Colors = {
  light: {
    text: '#09090B', // foreground (zinc-950)
    background: '#FFFFFF',
    backgroundElement: '#F4F4F5', // secondary/muted (zinc-100)
    backgroundSelected: '#E4E4E7', // zinc-200
    textSecondary: '#71717A', // muted-foreground (zinc-500)
    primary: '#4A7A34', // brand green
    primaryForeground: '#F3F0FA',
    border: '#E4E4E7',
    destructive: '#DC2626',
    // Freshness chips: good = brand green, so "fresh" reads as broccoli.
    statusGood: '#4A7A34',
    statusWarn: '#B26A00',
    statusBad: '#DC2626',
  },
  dark: {
    text: '#FAFAFA',
    background: '#09090B',
    backgroundElement: '#18181B', // card (zinc-900)
    backgroundSelected: '#27272A', // secondary (zinc-800)
    textSecondary: '#A1A1AA', // zinc-400
    primary: '#5E9943', // brand green, dark variant
    primaryForeground: '#F3F0FA',
    border: '#3F3F46',
    destructive: '#F87171',
    statusGood: '#5E9943',
    statusWarn: '#E0A83E',
    statusBad: '#F87171',
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

import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { FontFamilies, Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?:
    | 'default'
    | 'title'
    | 'small'
    | 'smallBold'
    | 'subtitle'
    | 'display'
    | 'link'
    | 'linkPrimary'
    | 'code';
  themeColor?: ThemeColor;
};

// Produce Ledger type (planning/mobile-redesign-2026-08-28.md): Inter for UI
// text, Fraunces for display figures and titles. Both ship as one file per
// weight, so the family is chosen by the type's weight. Loaded in the root
// layout; RN falls back to the system font if a family isn't registered yet.
const FontByType: Record<NonNullable<ThemedTextProps['type']>, string | undefined> = {
  default: FontFamilies.interMedium,
  small: FontFamilies.interMedium,
  smallBold: FontFamilies.interBold,
  title: FontFamilies.frauncesSemiBold,
  subtitle: FontFamilies.interSemiBold,
  display: FontFamilies.frauncesSemiBold,
  link: FontFamilies.interRegular,
  linkPrimary: FontFamilies.interSemiBold,
  code: undefined, // stays monospace
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();
  // Links default to the brand primary; anything else to the text color.
  const defaultColor = type === 'linkPrimary' ? 'primary' : 'text';
  const fontFamily = FontByType[type];

  return (
    <Text
      style={[
        { color: theme[themeColor ?? defaultColor] },
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'subtitle' && styles.subtitle,
        type === 'display' && styles.display,
        type === 'link' && styles.link,
        type === 'linkPrimary' && styles.linkPrimary,
        type === 'code' && styles.code,
        fontFamily ? { fontFamily } : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 500,
  },
  smallBold: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 700,
  },
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: 500,
  },
  title: {
    // The one page-header style: Fraunces display, aligned across screens
    // (kitchen, capture, review, settings, check-in deck all use this).
    fontSize: 26,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 32,
    lineHeight: 44,
    fontWeight: 600,
  },
  display: {
    fontSize: 36,
    lineHeight: 40,
    fontWeight: 600,
    // Money/hero figures — Fraunces with tabular numerals (Produce Ledger).
    fontVariant: ['tabular-nums'],
  },
  link: {
    lineHeight: 30,
    fontSize: 14,
  },
  linkPrimary: {
    lineHeight: 30,
    fontSize: 14,
    fontWeight: 600,
  },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: 700 }) ?? 500,
    fontSize: 12,
  },
});

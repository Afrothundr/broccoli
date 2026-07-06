import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
};

// Geist (the dashboard's typeface) ships as one file per weight, so the
// family is chosen by the type's weight. Loaded in the root layout; RN falls
// back to the system font if a family isn't registered yet.
const GeistByType: Record<NonNullable<ThemedTextProps['type']>, string | undefined> = {
  default: 'Geist_500Medium',
  small: 'Geist_500Medium',
  smallBold: 'Geist_700Bold',
  title: 'Geist_600SemiBold',
  subtitle: 'Geist_600SemiBold',
  link: 'Geist_400Regular',
  linkPrimary: 'Geist_600SemiBold',
  code: undefined, // stays monospace
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();
  // Links default to the brand primary; anything else to the text color.
  const defaultColor = type === 'linkPrimary' ? 'primary' : 'text';
  const fontFamily = GeistByType[type];

  return (
    <Text
      style={[
        { color: theme[themeColor ?? defaultColor] },
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'subtitle' && styles.subtitle,
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
    fontSize: 48,
    fontWeight: 600,
    lineHeight: 52,
  },
  subtitle: {
    fontSize: 32,
    lineHeight: 44,
    fontWeight: 600,
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

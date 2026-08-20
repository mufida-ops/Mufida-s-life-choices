import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { colors, radii, shadow, spacing } from '../../constants/theme';

interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  /** A domain/brand hue — renders as a left accent stripe with a faint tinted wash. */
  accentColor?: string;
}

export function Card({ children, onPress, style, accentColor }: CardProps) {
  const accentStyle = accentColor
    ? { borderLeftWidth: 4, borderLeftColor: accentColor, backgroundColor: withAlpha(accentColor, 0.05) }
    : null;

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, accentStyle, style, pressed && styles.pressed]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, accentStyle, style]}>{children}</View>;
}

function withAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadow.card,
  },
  pressed: { opacity: 0.7 },
});

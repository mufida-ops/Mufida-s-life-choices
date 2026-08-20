import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radii, spacing } from '../../constants/theme';
import { AppText } from '../ui/AppText';

interface QuickActionsProps {
  onPlan: () => void;
  onCapture: () => void;
  onCreate: () => void;
  onAsk: () => void;
}

export function QuickActions({ onPlan, onCapture, onCreate, onAsk }: QuickActionsProps) {
  const actions: { label: string; icon: keyof typeof Ionicons.glyphMap; color: string; onPress: () => void }[] = [
    { label: 'Capture', icon: 'flash-outline', color: colors.terracotta, onPress: onCapture },
    { label: 'Plan', icon: 'calendar-outline', color: colors.dustyBlue, onPress: onPlan },
    { label: 'Create', icon: 'sparkles-outline', color: colors.plum, onPress: onCreate },
    { label: 'Ask', icon: 'chatbubble-ellipses-outline', color: colors.gold, onPress: onAsk },
  ];

  return (
    <View style={styles.row}>
      {actions.map((action) => (
        <Pressable key={action.label} onPress={action.onPress} hitSlop={8} style={styles.item}>
          <View style={[styles.iconCircle, { backgroundColor: withAlpha(action.color, 0.14) }]}>
            <Ionicons name={action.icon} size={16} color={action.color} />
          </View>
          <AppText variant="smallMedium" color={colors.inkMuted}>
            {action.label}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}

function withAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  item: { alignItems: 'center', gap: 6 },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

import { Pressable, StyleSheet, View } from 'react-native';

import { colors, spacing } from '../../constants/theme';
import { AppText } from '../ui/AppText';

interface QuickActionsProps {
  onPlan: () => void;
  onCapture: () => void;
  onCreate: () => void;
  onAsk: () => void;
}

export function QuickActions({ onPlan, onCapture, onCreate, onAsk }: QuickActionsProps) {
  const actions = [
    { label: 'Capture', onPress: onCapture },
    { label: 'Plan', onPress: onPlan },
    { label: 'Create', onPress: onCreate },
    { label: 'Ask', onPress: onAsk },
  ];

  return (
    <View style={styles.row}>
      {actions.map((action) => (
        <Pressable key={action.label} onPress={action.onPress} hitSlop={8}>
          <AppText variant="smallMedium" color={colors.inkMuted}>
            {action.label}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingHorizontal: spacing.sm,
  },
});

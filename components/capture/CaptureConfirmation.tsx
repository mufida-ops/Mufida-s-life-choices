import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radii, spacing } from '../../constants/theme';
import { AppText } from '../ui/AppText';

export interface CaptureConfirmationData {
  title: string;
  detail: string;
}

export function CaptureConfirmation({ data }: { data: CaptureConfirmationData }) {
  return (
    <View style={styles.container}>
      <Ionicons name="checkmark-circle" size={18} color={colors.gold} />
      <View style={styles.textBlock}>
        <AppText variant="bodyMedium">{data.title}</AppText>
        <AppText variant="small" color={colors.inkMuted}>
          {data.detail}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  textBlock: { flex: 1 },
});

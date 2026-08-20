import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '../../constants/theme';
import { AppText } from './AppText';
import { FloralOrnament } from './FloralOrnament';

export function EmptyState({ text }: { text: string }) {
  return (
    <View style={styles.container}>
      <FloralOrnament size={56} opacity={0.7} rotate={-10} />
      <AppText variant="body" color={colors.inkMuted} style={styles.text}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: spacing.md, gap: spacing.xs },
  text: { textAlign: 'center' },
});

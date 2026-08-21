import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '../../constants/theme';
import { AppText } from '../ui/AppText';
import { FloralOrnament } from '../ui/FloralOrnament';
import { DailyReflection } from './DailyReflection';
import { Greeting } from './Greeting';

export function HomeHero({ name, children }: { name: string; children: ReactNode }) {
  return (
    <View style={styles.hero}>
      <FloralOrnament size={100} opacity={0.5} rotate={15} style={styles.ornament} />
      <Greeting name={name} color={colors.inkMuted} />
      <DailyReflection />
      <AppText variant="greeting" color={colors.ink} style={styles.question}>
        What do you need?
      </AppText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    paddingTop: spacing.lg,
    overflow: 'hidden',
  },
  ornament: { position: 'absolute', top: -14, right: -14 },
  question: { marginTop: spacing.xs, marginBottom: spacing.md },
});

import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { heroGradient, radii, spacing } from '../../constants/theme';
import { AppText } from '../ui/AppText';
import { Greeting } from './Greeting';

export function HomeHero({ name, children }: { name: string; children: ReactNode }) {
  return (
    <LinearGradient
      colors={heroGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.hero}
    >
      <Greeting name={name} color="rgba(255,255,255,0.78)" />
      <AppText variant="greeting" color="#FFFFFF" style={styles.question}>
        What do you need?
      </AppText>
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    paddingTop: spacing.lg,
  },
  question: { marginTop: spacing.xs, marginBottom: spacing.md },
});

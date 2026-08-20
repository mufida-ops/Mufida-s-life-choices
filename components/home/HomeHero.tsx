import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { heroGradient, radii, spacing } from '../../constants/theme';
import { AppText } from '../ui/AppText';
import { FloralOrnament } from '../ui/FloralOrnament';
import { Greeting } from './Greeting';

export function HomeHero({ name, children }: { name: string; children: ReactNode }) {
  return (
    <LinearGradient
      colors={heroGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.hero}
    >
      <FloralOrnament
        size={100}
        lineColor="rgba(255,255,255,0.9)"
        bloomColor="rgba(255,255,255,0.5)"
        opacity={0.3}
        rotate={15}
        style={styles.ornament}
      />
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
    overflow: 'hidden',
  },
  ornament: { position: 'absolute', top: -14, right: -14 },
  question: { marginTop: spacing.xs, marginBottom: spacing.md },
});

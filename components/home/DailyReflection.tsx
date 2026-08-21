import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '../../constants/theme';
import { getDailyReflection } from '../../lib/reflections/getDailyReflection';
import { AppText } from '../ui/AppText';

/** A quiet daily Quran verse or reflection line — see constants/dailyReflections.ts. */
export function DailyReflection({
  textColor = colors.inkMuted,
  referenceColor = colors.inkFaint,
}: {
  textColor?: string;
  referenceColor?: string;
}) {
  const reflection = useMemo(() => getDailyReflection(), []);

  return (
    <View style={styles.container}>
      <AppText variant="reflection" color={textColor}>
        {reflection.text}
      </AppText>
      {reflection.reference ? (
        <AppText variant="small" color={referenceColor} style={styles.reference}>
          {reflection.reference}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: spacing.sm },
  reference: { marginTop: 2 },
});

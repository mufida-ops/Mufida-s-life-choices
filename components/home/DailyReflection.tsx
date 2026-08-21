import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '../../constants/theme';
import { getDailyReflection } from '../../lib/reflections/getDailyReflection';
import { AppText } from '../ui/AppText';

/** A quiet daily Quran verse or reflection line — see constants/dailyReflections.ts. */
export function DailyReflection() {
  const reflection = useMemo(() => getDailyReflection(), []);

  return (
    <View style={styles.container}>
      <AppText variant="reflection" color="rgba(255,255,255,0.92)">
        {reflection.text}
      </AppText>
      {reflection.reference ? (
        <AppText variant="small" color="rgba(255,255,255,0.6)" style={styles.reference}>
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

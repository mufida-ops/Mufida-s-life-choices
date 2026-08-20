import { StyleSheet, View } from 'react-native';

import { DOMAIN_LABEL } from '../../constants/domains';
import { colors, domainColors, domainTints, radii, spacing } from '../../constants/theme';
import type { LifeDomain } from '../../types/models';
import { AppText } from './AppText';

export function DomainTag({ domain }: { domain: LifeDomain }) {
  const hue = domainColors[domain] ?? colors.inkFaint;
  const tint = domainTints[domain] ?? colors.surfaceMuted;
  return (
    <View style={[styles.tag, { backgroundColor: tint }]}>
      <View style={[styles.dot, { backgroundColor: hue }]} />
      <AppText variant="label" color={hue}>
        {DOMAIN_LABEL[domain].toUpperCase()}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radii.pill,
  },
});

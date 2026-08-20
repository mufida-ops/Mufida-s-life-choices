import { StyleSheet, View } from 'react-native';

import { DOMAIN_LABEL } from '../../constants/domains';
import { colors, domainColors, radii, spacing } from '../../constants/theme';
import type { LifeDomain } from '../../types/models';
import { AppText } from './AppText';

export function DomainTag({ domain }: { domain: LifeDomain }) {
  const tint = domainColors[domain] ?? colors.inkFaint;
  return (
    <View style={[styles.tag, { borderColor: tint }]}>
      <AppText variant="label" color={tint}>
        {DOMAIN_LABEL[domain].toUpperCase()}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
});

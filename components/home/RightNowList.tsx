import { StyleSheet, View } from 'react-native';

import { EMPTY_STATES } from '../../constants/emptyStates';
import { colors, spacing, type } from '../../constants/theme';
import type { ResurfacingCandidate } from '../../types/models';
import { AppText } from '../ui/AppText';
import { EmptyState } from '../ui/EmptyState';
import { RightNowItem } from './RightNowItem';

export function RightNowList({ items }: { items: ResurfacingCandidate[] }) {
  return (
    <View style={styles.container}>
      <AppText variant="label" color={colors.inkFaint} style={styles.heading}>
        RIGHT NOW
      </AppText>
      {items.length === 0 ? (
        <EmptyState text={EMPTY_STATES.rightNow} />
      ) : (
        <View style={styles.list}>
          {items.map((item) => (
            <RightNowItem key={item.id} candidate={item} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: spacing.xl },
  heading: { marginBottom: spacing.sm, letterSpacing: type.label.letterSpacing },
  list: { gap: spacing.sm },
});

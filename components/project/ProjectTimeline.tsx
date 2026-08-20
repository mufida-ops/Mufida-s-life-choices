import { ScrollView, StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '../../constants/theme';
import type { Task } from '../../types/models';
import { AppText } from '../ui/AppText';

/**
 * A simple readable horizontal sequence, not a full Gantt (spec section 15): ordered by
 * due date (falling back to creation order), showing dependency order and status at a glance.
 */
export function ProjectTimeline({ tasks, accentColor = colors.gold }: { tasks: Task[]; accentColor?: string }) {
  const ordered = [...tasks].sort((a, b) => {
    if (a.due_at && b.due_at) return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
    if (a.due_at) return -1;
    if (b.due_at) return 1;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  if (ordered.length === 0) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {ordered.map((task, index) => (
        <View key={task.id} style={styles.node}>
          {index > 0 ? <View style={styles.connector} /> : null}
          <View style={styles.nodeContent}>
            <View
              style={[
                styles.dot,
                { borderColor: accentColor },
                task.status === 'done' && { backgroundColor: accentColor },
              ]}
            />
            <AppText variant="smallMedium" style={styles.nodeTitle} numberOfLines={2}>
              {task.title}
            </AppText>
            {task.due_at ? (
              <AppText variant="small" color={colors.inkFaint}>
                {new Date(task.due_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </AppText>
            ) : null}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const NODE_WIDTH = 110;

const styles = StyleSheet.create({
  row: { paddingVertical: spacing.sm, alignItems: 'flex-start' },
  node: { width: NODE_WIDTH, flexDirection: 'row', alignItems: 'flex-start' },
  connector: {
    position: 'absolute',
    top: 5,
    left: -NODE_WIDTH / 2,
    width: NODE_WIDTH,
    height: 1,
    backgroundColor: colors.border,
  },
  nodeContent: { width: NODE_WIDTH, paddingHorizontal: spacing.xs },
  dot: {
    width: 10,
    height: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.gold,
    marginBottom: spacing.xs,
  },
  nodeTitle: { marginBottom: 2 },
});

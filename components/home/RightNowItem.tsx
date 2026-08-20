import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Card } from '../ui/Card';
import { AppText } from '../ui/AppText';
import { DomainTag } from '../ui/DomainTag';
import { colors, spacing } from '../../constants/theme';
import { useAppStore } from '../../store/useAppStore';
import type { ResurfacingCandidate } from '../../types/models';

const KIND_LABEL: Record<ResurfacingCandidate['kind'], string> = {
  task: 'Task',
  reminder: 'Reminder',
  project: 'Project',
  memory: 'Remember',
};

export function RightNowItem({ candidate }: { candidate: ResurfacingCandidate }) {
  const respond = useAppStore((s) => s.respondToCandidate);
  const canComplete = candidate.kind === 'task' || candidate.kind === 'reminder';

  const handlePress = () => {
    if (candidate.kind === 'project') {
      router.push(`/project/${candidate.refId}`);
    }
  };

  return (
    <Card onPress={candidate.kind === 'project' ? handlePress : undefined} style={styles.card}>
      <View style={styles.header}>
        {candidate.domain ? <DomainTag domain={candidate.domain} /> : (
          <AppText variant="label" color={colors.inkFaint}>
            {KIND_LABEL[candidate.kind].toUpperCase()}
          </AppText>
        )}
      </View>
      <AppText variant="h2" style={styles.title}>
        {candidate.title}
      </AppText>
      {candidate.subtitle ? (
        <AppText variant="small" color={colors.inkMuted} style={styles.subtitle}>
          {candidate.subtitle}
        </AppText>
      ) : null}
      <AppText variant="small" color={colors.inkFaint}>
        {candidate.reason}
      </AppText>

      <View style={styles.actions}>
        {canComplete ? (
          <ActionButton icon="checkmark-circle-outline" label="Done" onPress={() => respond(candidate, 'done')} />
        ) : null}
        <ActionButton icon="close-circle-outline" label="Not now" onPress={() => respond(candidate, 'not_now')} />
        <ActionButton icon="time-outline" label="Later" onPress={() => respond(candidate, 'snooze')} />
        <ActionButton icon="eye-off-outline" label="Stop" onPress={() => respond(candidate, 'stop')} />
      </View>
    </Card>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.actionButton} hitSlop={6}>
      <Ionicons name={icon} size={15} color={colors.inkMuted} />
      <AppText variant="small" color={colors.inkMuted}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { gap: 2 },
  header: { flexDirection: 'row', marginBottom: spacing.xs },
  title: { marginTop: 2 },
  subtitle: { marginTop: 2 },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});

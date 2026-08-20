import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Card } from '../ui/Card';
import { AppText } from '../ui/AppText';
import { DomainTag } from '../ui/DomainTag';
import { colors, domainColors, radii, spacing } from '../../constants/theme';
import { useAppStore } from '../../store/useAppStore';
import type { ResurfacingCandidate } from '../../types/models';

const KIND_LABEL: Record<ResurfacingCandidate['kind'], string> = {
  task: 'Task',
  reminder: 'Reminder',
  project: 'Project',
  memory: 'Remember',
};

/** Fallback accent for candidates with no life domain (reminders, memories). */
const KIND_ACCENT: Record<ResurfacingCandidate['kind'], string> = {
  task: colors.dustyBlue,
  reminder: colors.gold,
  project: colors.terracotta,
  memory: colors.plum,
};

export function RightNowItem({ candidate }: { candidate: ResurfacingCandidate }) {
  const respond = useAppStore((s) => s.respondToCandidate);
  const canComplete = candidate.kind === 'task' || candidate.kind === 'reminder';
  const accentColor = (candidate.domain && domainColors[candidate.domain]) || KIND_ACCENT[candidate.kind];

  const handlePress = () => {
    if (candidate.kind === 'project') {
      router.push(`/project/${candidate.refId}`);
    }
  };

  return (
    <Card onPress={candidate.kind === 'project' ? handlePress : undefined} style={styles.card} accentColor={accentColor}>
      <View style={styles.header}>
        {candidate.domain ? (
          <DomainTag domain={candidate.domain} />
        ) : (
          <View style={[styles.kindTag, { backgroundColor: withAlpha(accentColor, 0.14) }]}>
            <AppText variant="label" color={accentColor}>
              {KIND_LABEL[candidate.kind].toUpperCase()}
            </AppText>
          </View>
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

function withAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const styles = StyleSheet.create({
  card: { gap: 2 },
  header: { flexDirection: 'row', marginBottom: spacing.xs },
  kindTag: { alignSelf: 'flex-start', borderRadius: radii.pill, paddingHorizontal: spacing.sm, paddingVertical: 5 },
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

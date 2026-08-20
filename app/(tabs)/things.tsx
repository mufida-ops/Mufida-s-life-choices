import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { AppText } from '../../components/ui/AppText';
import { Card } from '../../components/ui/Card';
import { DomainTag } from '../../components/ui/DomainTag';
import { Screen } from '../../components/ui/Screen';
import { EMPTY_STATES } from '../../constants/emptyStates';
import { colors, radii, spacing } from '../../constants/theme';
import { useAppStore } from '../../store/useAppStore';

type ThingsView = 'projects' | 'todo' | 'saved' | 'captured';
const VIEWS: { key: ThingsView; label: string }[] = [
  { key: 'projects', label: 'Projects' },
  { key: 'todo', label: 'To Do' },
  { key: 'saved', label: 'Saved' },
  { key: 'captured', label: 'Captured' },
];

export default function MyThingsScreen() {
  const [view, setView] = useState<ThingsView>('projects');
  const projects = useAppStore((s) => s.projects);
  const tasks = useAppStore((s) => s.tasks);
  const memories = useAppStore((s) => s.memories);
  const captures = useAppStore((s) => s.captures);
  const completeTask = useAppStore((s) => s.completeTask);

  const openTasks = tasks
    .filter((t) => t.status === 'open' || t.status === 'in_progress')
    .sort((a, b) => (a.due_at && b.due_at ? new Date(a.due_at).getTime() - new Date(b.due_at).getTime() : a.due_at ? -1 : b.due_at ? 1 : 0));

  return (
    <Screen>
      <AppText variant="h1">My Things</AppText>

      <View style={styles.segments}>
        {VIEWS.map((v) => (
          <Pressable key={v.key} onPress={() => setView(v.key)} style={[styles.segment, view === v.key && styles.segmentActive]}>
            <AppText variant="smallMedium" color={view === v.key ? colors.surface : colors.inkMuted}>
              {v.label}
            </AppText>
          </Pressable>
        ))}
      </View>

      <View style={styles.list}>
        {view === 'projects' &&
          (projects.length === 0 ? (
            <EmptyText text={EMPTY_STATES.projects} />
          ) : (
            projects.map((project) => (
              <Card key={project.id} onPress={() => router.push(`/project/${project.id}`)}>
                <DomainTag domain={project.domain} />
                <AppText variant="h2" style={styles.cardTitle}>
                  {project.title}
                </AppText>
                {project.where_left_off ? (
                  <AppText variant="small" color={colors.inkMuted}>
                    {project.where_left_off}
                  </AppText>
                ) : project.next_action ? (
                  <AppText variant="small" color={colors.inkMuted}>
                    Next: {project.next_action}
                  </AppText>
                ) : null}
              </Card>
            ))
          ))}

        {view === 'todo' &&
          (openTasks.length === 0 ? (
            <EmptyText text={EMPTY_STATES.tasks} />
          ) : (
            openTasks.map((task) => (
              <Card key={task.id}>
                <View style={styles.taskRow}>
                  <Pressable onPress={() => completeTask(task.id)} style={styles.checkbox} hitSlop={8} />
                  <View style={styles.taskTextBlock}>
                    <AppText variant="bodyMedium">{task.title}</AppText>
                    {task.due_at ? (
                      <AppText variant="small" color={colors.inkMuted}>
                        Due {new Date(task.due_at).toLocaleDateString()}
                      </AppText>
                    ) : null}
                  </View>
                </View>
              </Card>
            ))
          ))}

        {view === 'saved' &&
          (memories.length === 0 ? (
            <EmptyText text={EMPTY_STATES.memories} />
          ) : (
            memories.map((memory) => (
              <Card key={memory.id}>
                <AppText variant="bodyMedium">{memory.title}</AppText>
                <AppText variant="small" color={colors.inkMuted}>
                  {memory.content}
                </AppText>
              </Card>
            ))
          ))}

        {view === 'captured' &&
          (captures.length === 0 ? (
            <EmptyText text={EMPTY_STATES.captures} />
          ) : (
            captures.map((capture) => (
              <Card key={capture.id}>
                <AppText variant="body">{capture.raw_text}</AppText>
                <AppText variant="small" color={colors.inkFaint}>
                  {new Date(capture.created_at).toLocaleString()}
                </AppText>
              </Card>
            ))
          ))}
      </View>
    </Screen>
  );
}

function EmptyText({ text }: { text: string }) {
  return (
    <AppText variant="body" color={colors.inkMuted}>
      {text}
    </AppText>
  );
}

const styles = StyleSheet.create({
  segments: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, marginBottom: spacing.lg },
  segment: { paddingVertical: 6, paddingHorizontal: spacing.sm, borderRadius: radii.pill, backgroundColor: colors.surfaceMuted },
  segmentActive: { backgroundColor: colors.navy },
  list: { gap: spacing.sm },
  cardTitle: { marginTop: spacing.xs },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: radii.sm,
    borderWidth: 1.5,
    borderColor: colors.inkFaint,
  },
  taskTextBlock: { flex: 1 },
});

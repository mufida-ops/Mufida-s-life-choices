import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { AppText } from '../../components/ui/AppText';
import { Card } from '../../components/ui/Card';
import { DomainTag } from '../../components/ui/DomainTag';
import { Screen } from '../../components/ui/Screen';
import { ProjectTimeline } from '../../components/project/ProjectTimeline';
import { colors, radii, spacing } from '../../constants/theme';
import { useAppStore } from '../../store/useAppStore';

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // Select raw slices (stable references) and derive per-render with useMemo — filtering or
  // finding *inside* a zustand selector returns a new array/object every call, which breaks
  // useSyncExternalStore's snapshot equality and causes an infinite render loop.
  const allProjects = useAppStore((s) => s.projects);
  const allTasks = useAppStore((s) => s.tasks);
  const allProjectUpdates = useAppStore((s) => s.projectUpdates);
  const project = useMemo(() => allProjects.find((p) => p.id === id), [allProjects, id]);
  const tasks = useMemo(() => allTasks.filter((t) => t.project_id === id), [allTasks, id]);
  const projectUpdates = useMemo(
    () => allProjectUpdates.filter((u) => u.project_id === id),
    [allProjectUpdates, id]
  );
  const completeTask = useAppStore((s) => s.completeTask);
  const addProjectUpdate = useAppStore((s) => s.addProjectUpdate);
  const updateProject = useAppStore((s) => s.updateProject);
  const [noteText, setNoteText] = useState('');

  if (!project) {
    return (
      <Screen>
        <AppText variant="body">This project isn&rsquo;t here anymore.</AppText>
      </Screen>
    );
  }

  const handleAddNote = () => {
    const trimmed = noteText.trim();
    if (!trimmed) return;
    addProjectUpdate(project.id, trimmed);
    updateProject(project.id, { where_left_off: trimmed });
    setNoteText('');
  };

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: true, title: project.title }} />

      <DomainTag domain={project.domain} />
      <AppText variant="h1" style={styles.title}>
        {project.title}
      </AppText>
      {project.description ? (
        <AppText variant="body" color={colors.inkMuted} style={styles.description}>
          {project.description}
        </AppText>
      ) : null}

      {project.where_left_off ? (
        <Card style={styles.whereLeftOff}>
          <AppText variant="label" color={colors.inkFaint}>
            WHERE I LEFT OFF
          </AppText>
          <AppText variant="body" style={styles.whereLeftOffText}>
            {project.where_left_off}
          </AppText>
          {project.next_action ? (
            <AppText variant="small" color={colors.inkMuted}>
              Next: {project.next_action}
            </AppText>
          ) : null}
        </Card>
      ) : null}

      {tasks.length > 0 ? (
        <View style={styles.section}>
          <AppText variant="label" color={colors.inkFaint} style={styles.sectionHeading}>
            TIMELINE
          </AppText>
          <ProjectTimeline tasks={tasks} />
        </View>
      ) : null}

      <View style={styles.section}>
        <AppText variant="label" color={colors.inkFaint} style={styles.sectionHeading}>
          TASKS
        </AppText>
        {tasks.length === 0 ? (
          <AppText variant="body" color={colors.inkMuted}>
            No tasks yet for this project.
          </AppText>
        ) : (
          <View style={styles.list}>
            {tasks.map((task) => (
              <Card key={task.id}>
                <View style={styles.taskRow}>
                  <Pressable
                    onPress={() => completeTask(task.id)}
                    style={[styles.checkbox, task.status === 'done' && styles.checkboxDone]}
                    hitSlop={8}
                  >
                    {task.status === 'done' ? <Ionicons name="checkmark" size={13} color={colors.surface} /> : null}
                  </Pressable>
                  <AppText
                    variant="bodyMedium"
                    style={task.status === 'done' ? styles.taskDone : undefined}
                    color={task.status === 'done' ? colors.inkFaint : colors.ink}
                  >
                    {task.title}
                  </AppText>
                </View>
              </Card>
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <AppText variant="label" color={colors.inkFaint} style={styles.sectionHeading}>
          ADD A NOTE
        </AppText>
        <View style={styles.noteInputRow}>
          <TextInput
            value={noteText}
            onChangeText={setNoteText}
            placeholder="Where did you leave off?"
            placeholderTextColor={colors.inkFaint}
            style={styles.noteInput}
            multiline
          />
          <Pressable onPress={handleAddNote} style={styles.noteSubmit} hitSlop={8}>
            <Ionicons name="arrow-up" size={16} color={colors.surface} />
          </Pressable>
        </View>
      </View>

      {projectUpdates.length > 0 ? (
        <View style={styles.section}>
          <AppText variant="label" color={colors.inkFaint} style={styles.sectionHeading}>
            NOTES
          </AppText>
          <View style={styles.list}>
            {projectUpdates.map((update) => (
              <Card key={update.id}>
                <AppText variant="body">{update.content}</AppText>
                <AppText variant="small" color={colors.inkFaint}>
                  {new Date(update.created_at).toLocaleString()}
                </AppText>
              </Card>
            ))}
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.sm },
  description: { marginTop: spacing.xs },
  whereLeftOff: { marginTop: spacing.lg, backgroundColor: colors.surfaceMuted },
  whereLeftOffText: { marginTop: spacing.xs, marginBottom: spacing.xs },
  section: { marginTop: spacing.xl },
  sectionHeading: { marginBottom: spacing.sm },
  list: { gap: spacing.sm },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radii.sm,
    borderWidth: 1.5,
    borderColor: colors.inkFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: colors.sage, borderColor: colors.sage },
  taskDone: { textDecorationLine: 'line-through' },
  noteInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  noteInput: { flex: 1, color: colors.ink, maxHeight: 96 },
  noteSubmit: {
    width: 30,
    height: 30,
    borderRadius: radii.pill,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

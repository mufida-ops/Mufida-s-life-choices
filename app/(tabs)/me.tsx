import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText } from '../../components/ui/AppText';
import { Card } from '../../components/ui/Card';
import { Screen } from '../../components/ui/Screen';
import { DOMAINS, DOMAIN_LABEL } from '../../constants/domains';
import { EMPTY_STATES } from '../../constants/emptyStates';
import { colors, domainColors, radii, spacing } from '../../constants/theme';
import { useAppStore } from '../../store/useAppStore';
import type { Memory } from '../../types/models';

export default function MeScreen() {
  const profile = useAppStore((s) => s.profile);
  const memories = useAppStore((s) => s.memories);
  const projects = useAppStore((s) => s.projects);
  const addMemory = useAppStore((s) => s.addMemory);
  const [newMemory, setNewMemory] = useState('');

  const handleRemember = () => {
    const trimmed = newMemory.trim();
    if (!trimmed) return;
    addMemory({ type: 'general', title: trimmed.slice(0, 60), content: trimmed });
    setNewMemory('');
  };

  return (
    <Screen>
      <AppText variant="h1">Me</AppText>

      <Card style={styles.profileCard}>
        <AppText variant="h2">{profile.name}</AppText>
        <AppText variant="small" color={colors.inkMuted}>
          {profile.timezone}
        </AppText>
      </Card>

      <View style={styles.section}>
        <AppText variant="label" color={colors.inkFaint} style={styles.sectionHeading}>
          LIFE DOMAINS
        </AppText>
        <View style={styles.domainRow}>
          {DOMAINS.map((domain) => {
            const activeCount = projects.filter((p) => p.domain === domain && p.status === 'active').length;
            return (
              <View key={domain} style={[styles.domainChip, { borderColor: domainColors[domain] }]}>
                <AppText variant="smallMedium" color={domainColors[domain]}>
                  {DOMAIN_LABEL[domain]}
                </AppText>
                {activeCount > 0 ? (
                  <AppText variant="small" color={colors.inkFaint}>
                    {' '}
                    · {activeCount}
                  </AppText>
                ) : null}
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <AppText variant="label" color={colors.inkFaint} style={styles.sectionHeading}>
          MEMORY
        </AppText>

        <View style={styles.rememberRow}>
          <TextInput
            value={newMemory}
            onChangeText={setNewMemory}
            placeholder="Remember this…"
            placeholderTextColor={colors.inkFaint}
            style={styles.rememberInput}
            multiline
          />
          <Pressable onPress={handleRemember} style={styles.rememberSubmit} hitSlop={8}>
            <Ionicons name="arrow-up" size={16} color={colors.surface} />
          </Pressable>
        </View>

        {memories.length === 0 ? (
          <AppText variant="body" color={colors.inkMuted} style={styles.emptyMemories}>
            {EMPTY_STATES.memories}
          </AppText>
        ) : (
          <View style={styles.list}>
            {memories.map((memory) => (
              <MemoryRow key={memory.id} memory={memory} />
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}

function MemoryRow({ memory }: { memory: Memory }) {
  const updateMemory = useAppStore((s) => s.updateMemory);
  const forgetMemory = useAppStore((s) => s.forgetMemory);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(memory.content);

  const handleSave = () => {
    updateMemory(memory.id, { content: draft, title: draft.slice(0, 60) });
    setEditing(false);
  };

  return (
    <Card>
      <AppText variant="bodyMedium">{memory.title}</AppText>
      {editing ? (
        <TextInput value={draft} onChangeText={setDraft} style={styles.editInput} multiline autoFocus />
      ) : (
        <AppText variant="small" color={colors.inkMuted}>
          {memory.content}
        </AppText>
      )}

      <View style={styles.memoryActions}>
        {editing ? (
          <ActionLink label="Save" onPress={handleSave} />
        ) : (
          <ActionLink label="Edit" onPress={() => setEditing(true)} />
        )}
        <ActionLink label="Forget" onPress={() => forgetMemory(memory.id)} tone="danger" />
      </View>
    </Card>
  );
}

function ActionLink({ label, onPress, tone }: { label: string; onPress: () => void; tone?: 'danger' }) {
  return (
    <Pressable onPress={onPress} hitSlop={6}>
      <AppText variant="smallMedium" color={tone === 'danger' ? colors.danger : colors.navy}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  profileCard: { marginTop: spacing.md, gap: 2 },
  section: { marginTop: spacing.xl },
  sectionHeading: { marginBottom: spacing.sm },
  domainRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  domainChip: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  rememberInput: { flex: 1, color: colors.ink, maxHeight: 96 },
  rememberSubmit: {
    width: 30,
    height: 30,
    borderRadius: radii.pill,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMemories: {},
  list: { gap: spacing.sm },
  editInput: {
    color: colors.ink,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.sm,
    padding: spacing.xs,
    marginTop: 4,
  },
  memoryActions: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm },
});

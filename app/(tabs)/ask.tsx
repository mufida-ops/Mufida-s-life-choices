import { useCallback, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { CaptureInput } from '../../components/capture/CaptureInput';
import { AppText } from '../../components/ui/AppText';
import { Card } from '../../components/ui/Card';
import { RightNowItem } from '../../components/home/RightNowItem';
import { Screen } from '../../components/ui/Screen';
import { colors, radii, spacing } from '../../constants/theme';
import { respondLocally } from '../../features/assistant/respondLocally';
import { generateId } from '../../lib/id';
import { useAppStore } from '../../store/useAppStore';
import type { ResurfacingCandidate, Project } from '../../types/models';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  rightNowItems?: ResurfacingCandidate[];
  project?: Project;
}

export default function AskScreen() {
  const projects = useAppStore((s) => s.projects);
  const getRightNow = useAppStore((s) => s.getRightNow);
  const addCapture = useAppStore((s) => s.addCapture);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'intro',
      role: 'assistant',
      text: 'Ask me what you might be forgetting, or mention a project to pick it back up.',
    },
  ]);
  const listRef = useRef<ScrollView>(null);

  const handleSubmit = useCallback(
    async (text: string) => {
      const userMessage: ChatMessage = { id: generateId(), role: 'user', text };
      setMessages((prev) => [...prev, userMessage]);

      const reply = respondLocally(text, { projects, getRightNow: () => getRightNow(4) });

      if (reply.kind === 'plain') {
        await addCapture(text);
      }

      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        text: reply.text,
        rightNowItems: reply.kind === 'right_now' ? reply.items : undefined,
        project: reply.kind === 'project' ? reply.project : undefined,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    },
    [projects, getRightNow, addCapture]
  );

  return (
    <Screen scroll={false}>
      <ScrollView
        ref={listRef}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message) => (
          <ChatBubble key={message.id} message={message} />
        ))}
      </ScrollView>
      <View style={styles.inputWrap}>
        <CaptureInput onSubmit={handleSubmit} />
      </View>
    </Screen>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <View style={[styles.bubbleRow, isUser && styles.bubbleRowUser]}>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        <AppText variant="body" color={isUser ? colors.surface : colors.ink}>
          {message.text}
        </AppText>
      </View>

      {message.rightNowItems && message.rightNowItems.length > 0 ? (
        <View style={styles.structuredBlock}>
          {message.rightNowItems.map((item) => (
            <RightNowItem key={item.id} candidate={item} />
          ))}
        </View>
      ) : null}

      {message.project ? (
        <View style={styles.structuredBlock}>
          <Card>
            <AppText variant="h2">{message.project.title}</AppText>
            <View style={styles.projectActions}>
              <ActionLink label="Continue project" onPress={() => router.push(`/project/${message.project!.id}`)} />
              <ActionLink label="Where I left off" onPress={() => router.push(`/project/${message.project!.id}`)} />
            </View>
          </Card>
        </View>
      ) : null}
    </View>
  );
}

function ActionLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.actionLink} hitSlop={6}>
      <AppText variant="smallMedium" color={colors.navy}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, gap: spacing.md },
  bubbleRow: { alignItems: 'flex-start', gap: spacing.sm },
  bubbleRowUser: { alignItems: 'flex-end' },
  bubble: { maxWidth: '85%', borderRadius: radii.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  bubbleUser: { backgroundColor: colors.navy, borderBottomRightRadius: radii.sm },
  bubbleAssistant: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderBottomLeftRadius: radii.sm,
  },
  structuredBlock: { width: '100%', gap: spacing.sm },
  projectActions: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm },
  actionLink: { paddingVertical: 2 },
  inputWrap: { padding: spacing.lg, paddingTop: spacing.sm },
});

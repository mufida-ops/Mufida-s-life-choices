import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { CAPTURE_PLACEHOLDERS } from '../../constants/domains';
import { colors, radii, spacing, type } from '../../constants/theme';
import { useVoiceCapture } from '../../lib/voice/useVoiceCapture';

interface CaptureInputProps {
  onSubmit: (text: string) => void;
  placeholderRotationMs?: number;
}

export function CaptureInput({ onSubmit, placeholderRotationMs = 3200 }: CaptureInputProps) {
  const [text, setText] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  // Live transcript updates are pushed straight from the recognizer's own event via
  // onTranscript, not mirrored from reactive state in an effect — see useVoiceCapture.
  const voice = useVoiceCapture({ onTranscript: (value) => setText(value) });
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (text.length > 0) return;
    const interval = setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % CAPTURE_PLACEHOLDERS.length);
    }, placeholderRotationMs);
    return () => clearInterval(interval);
  }, [text, placeholderRotationMs]);

  const handleMicPress = async () => {
    if (voice.isListening) {
      voice.stop();
      return;
    }
    if (!voice.isAvailable) return;
    await voice.start();
  };

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setText('');
    inputRef.current?.blur();
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handleMicPress}
        style={styles.micButton}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={voice.isListening ? 'Stop voice capture' : 'Start voice capture'}
      >
        <Ionicons
          name={voice.isListening ? 'mic' : 'mic-outline'}
          size={20}
          color={voice.isListening ? colors.gold : voice.isAvailable ? colors.inkMuted : colors.inkFaint}
        />
      </Pressable>
      <TextInput
        ref={inputRef}
        value={text}
        onChangeText={setText}
        placeholder={CAPTURE_PLACEHOLDERS[placeholderIndex]}
        placeholderTextColor={colors.inkFaint}
        style={styles.input}
        multiline
        onSubmitEditing={handleSubmit}
        returnKeyType="send"
        blurOnSubmit
      />
      <Pressable
        onPress={handleSubmit}
        disabled={!text.trim()}
        style={[styles.sendButton, !text.trim() && styles.sendButtonDisabled]}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Send"
      >
        <Ionicons name="arrow-up" size={18} color={colors.surface} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  micButton: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    ...type.body,
    color: colors.ink,
    maxHeight: 96,
    paddingVertical: spacing.xs,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: { backgroundColor: colors.inkFaint },
});

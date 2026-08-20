import { useCallback, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { CaptureConfirmation, type CaptureConfirmationData } from '../../components/capture/CaptureConfirmation';
import { CaptureInput } from '../../components/capture/CaptureInput';
import { HomeHero } from '../../components/home/HomeHero';
import { QuickActions } from '../../components/home/QuickActions';
import { RightNowList } from '../../components/home/RightNowList';
import { Screen } from '../../components/ui/Screen';
import { spacing } from '../../constants/theme';
import { useAppStore, useRightNow } from '../../store/useAppStore';

export default function HomeScreen() {
  const profile = useAppStore((s) => s.profile);
  const addCapture = useAppStore((s) => s.addCapture);
  const rightNow = useRightNow(4);
  const [confirmation, setConfirmation] = useState<CaptureConfirmationData | null>(null);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
  }, []);

  const handleSubmit = useCallback(
    async (text: string) => {
      const result = await addCapture(text);

      let detail = 'Captured just now.';
      if (result.createdKind === 'reminder') {
        detail = result.notificationScheduled
          ? 'Reminder scheduled — captured just now.'
          : "Saved, but I couldn't schedule a notification (check permissions).";
      } else if (result.createdKind === 'idea') {
        detail = 'Saved to Creative — captured just now.';
      }

      setConfirmation({ title: result.createdTitle, detail });
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
      dismissTimer.current = setTimeout(() => setConfirmation(null), 4000);
    },
    [addCapture]
  );

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <HomeHero name={profile.name}>
          <CaptureInput onSubmit={handleSubmit} />
        </HomeHero>

        {confirmation ? <CaptureConfirmation data={confirmation} /> : null}

        <QuickActions
          onCapture={() => {}}
          onPlan={() => router.push('/(tabs)/things')}
          onCreate={() => router.push('/(tabs)/things')}
          onAsk={() => router.push('/(tabs)/ask')}
        />

        <View style={styles.spacer} />

        <RightNowList items={rightNow} />
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  spacer: { height: spacing.xs },
});

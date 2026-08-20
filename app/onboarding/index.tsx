import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { AppText } from '../../components/ui/AppText';
import { Button } from '../../components/ui/Button';
import { Screen } from '../../components/ui/Screen';
import { colors, radii, spacing } from '../../constants/theme';
import { localAuth } from '../../lib/auth/localAuth';
import { useAppStore } from '../../store/useAppStore';

export default function OnboardingScreen() {
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleContinue = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await localAuth.signUp(email.trim(), password);
      completeOnboarding({ name: name.trim() || 'Friend' });
      router.replace('/(tabs)');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.header}>
          <AppText variant="greeting">A calm place for everything you&rsquo;re carrying.</AppText>
          <AppText variant="body" color={colors.inkMuted} style={styles.subtitle}>
            Tell me a little about you to get started.
          </AppText>
        </View>

        <View style={styles.form}>
          <Field label="Your name" value={name} onChangeText={setName} placeholder="Mufida" />
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="At least 6 characters"
            secureTextEntry
          />

          {error ? (
            <AppText variant="small" color={colors.danger}>
              {error}
            </AppText>
          ) : null}

          <Button label={submitting ? 'Getting ready…' : 'Get started'} onPress={handleContinue} disabled={submitting} />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'sentences';
}) {
  return (
    <View style={styles.field}>
      <AppText variant="smallMedium" color={colors.inkMuted}>
        {props.label}
      </AppText>
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor={colors.inkFaint}
        secureTextEntry={props.secureTextEntry}
        keyboardType={props.keyboardType}
        autoCapitalize={props.autoCapitalize}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, justifyContent: 'center' },
  header: { marginBottom: spacing.xl },
  subtitle: { marginTop: spacing.sm },
  form: { gap: spacing.md },
  field: { gap: spacing.xs },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    color: colors.ink,
  },
});

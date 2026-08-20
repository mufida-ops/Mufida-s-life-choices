import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { AppText } from '../../components/ui/AppText';
import { Button } from '../../components/ui/Button';
import { FloralOrnament } from '../../components/ui/FloralOrnament';
import { colors, heroGradient, radii, shadow, spacing } from '../../constants/theme';
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
    <LinearGradient colors={heroGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
      <FloralOrnament
        size={140}
        lineColor="rgba(255,255,255,0.9)"
        bloomColor="rgba(255,255,255,0.55)"
        opacity={0.45}
        rotate={20}
        style={styles.ornamentTopRight}
      />
      <FloralOrnament
        size={110}
        lineColor="rgba(255,255,255,0.9)"
        bloomColor="rgba(255,255,255,0.5)"
        opacity={0.35}
        flip
        style={styles.ornamentBottomLeft}
      />
      <SafeAreaView style={styles.flex} edges={['top', 'left', 'right', 'bottom']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
          <View style={styles.content}>
            <View style={styles.header}>
              <AppText variant="greeting" color="#FFFFFF">
                A calm place for everything you&rsquo;re carrying.
              </AppText>
              <AppText variant="body" color="rgba(255,255,255,0.8)" style={styles.subtitle}>
                Tell me a little about you to get started.
              </AppText>
            </View>

            <View style={styles.formCard}>
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
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
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
  gradient: { flex: 1 },
  ornamentTopRight: { position: 'absolute', top: 0, right: -10 },
  ornamentBottomLeft: { position: 'absolute', bottom: 0, left: -10 },
  flex: { flex: 1, justifyContent: 'center' },
  content: { padding: spacing.lg },
  header: { marginBottom: spacing.xl },
  subtitle: { marginTop: spacing.sm },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadow.card,
  },
  field: { gap: spacing.xs },
  input: {
    backgroundColor: colors.background,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    color: colors.ink,
  },
});

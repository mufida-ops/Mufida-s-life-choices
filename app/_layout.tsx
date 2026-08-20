import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useFonts as useFrauncesFonts, Fraunces_500Medium, Fraunces_600SemiBold, Fraunces_500Medium_Italic } from '@expo-google-fonts/fraunces';
import { useFonts as useInterFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';

import { colors } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [frauncesLoaded] = useFrauncesFonts({
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    Fraunces_500Medium_Italic,
  });
  const [interLoaded] = useInterFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold });

  const hasHydrated = useAppStore((s) => s.hasHydrated);
  const seedIfEmpty = useAppStore((s) => s.seedIfEmpty);
  const onboardingComplete = useAppStore((s) => s.onboardingComplete);
  const router = useRouter();
  const segments = useSegments();

  const ready = frauncesLoaded && interLoaded && hasHydrated;

  useEffect(() => {
    if (!hasHydrated) return;
    if (__DEV__) seedIfEmpty();
  }, [hasHydrated, seedIfEmpty]);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    const inOnboarding = segments[0] === 'onboarding';
    if (!onboardingComplete && !inOnboarding) {
      router.replace('/onboarding');
    } else if (onboardingComplete && inOnboarding) {
      router.replace('/(tabs)');
    }
  }, [ready, onboardingComplete, segments, router]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

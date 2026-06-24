import {
  Fraunces_500Medium,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
  useFonts,
} from '@expo-google-fonts/fraunces';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { Onboarding } from '@/components/onboarding/onboarding';
import { ThemedView } from '@/components/themed-view';
import { CookbookProvider } from '@/lib/cookbook/context';
import { PlanProvider } from '@/lib/plan/context';
import { ProfileProvider, useProfile } from '@/lib/profile/context';
import { RecipeProvider, useRecipes } from '@/lib/recipes/context';

/**
 * Gate the app behind onboarding. While the profile loads we render a blank
 * themed screen (the splash overlay sits on top anyway). Once loaded we show
 * either onboarding or the main Stack — which holds the tab group plus pushable
 * screens like the dish detail page.
 */
function AppGate() {
  const { profile, ready } = useProfile();
  const { ready: recipesReady } = useRecipes();
  const [fontsLoaded] = useFonts({ Fraunces_500Medium, Fraunces_600SemiBold, Fraunces_700Bold });

  if (!ready || !recipesReady || !fontsLoaded) return <ThemedView style={{ flex: 1 }} />;
  if (!profile.onboarded) return <Onboarding />;
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="dish/[id]" />
      <Stack.Screen name="recipe/new" />
      <Stack.Screen name="cooked" />
      <Stack.Screen name="settings/index" />
      <Stack.Screen name="settings/profile" />
      <Stack.Screen name="settings/meal-preferences" />
      <Stack.Screen name="settings/review" />
      <Stack.Screen name="settings/contact" />
      <Stack.Screen name="settings/about" />
      <Stack.Screen name="settings/tos" />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <ProfileProvider>
          <RecipeProvider>
            <CookbookProvider>
              <PlanProvider>
                <AnimatedSplashOverlay />
                <AppGate />
              </PlanProvider>
            </CookbookProvider>
          </RecipeProvider>
        </ProfileProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

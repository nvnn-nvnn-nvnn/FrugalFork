import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Fonts, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth/context';

export default function AuthScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { configured, user, signIn, signUp, signOut } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setNotice(null);
    setBusy(true);
    const fn = mode === 'signin' ? signIn : signUp;
    const { error: err } = await fn(email, password);
    setBusy(false);
    if (err) {
      setError(err);
    } else if (mode === 'signup') {
      setNotice('Check your email to confirm your account, then sign in.');
      setMode('signin');
    }
  };

  return (
    <ThemedView style={styles.root}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.three, paddingBottom: BottomTabInset + Spacing.six },
        ]}>
        <View style={styles.inner}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.back,
              { backgroundColor: theme.backgroundElement },
              pressed && styles.pressed,
            ]}>
            <ThemedText type="smallBold">‹ Back</ThemedText>
          </Pressable>

          <View style={styles.header}>
            <ThemedText type="eyebrow" themeColor="tint">
              Account
            </ThemedText>
            <ThemedText type="title">{user ? 'Your account' : 'Sign in to sync'}</ThemedText>
            <ThemedText themeColor="textSecondary">
              An account backs up your cookbooks and recipes and unlocks reviews across devices. The
              app works fully offline without one.
            </ThemedText>
          </View>

          {!configured && (
            <View style={[styles.banner, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="smallBold">Cloud sync isn’t connected yet</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to a .env file (see
                .env.example), then restart. Until then this is a preview.
              </ThemedText>
            </View>
          )}

          {user ? (
            <View style={styles.field}>
              <View style={[styles.banner, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText type="smallBold">Signed in</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {user.email}
                </ThemedText>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={signOut}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  { borderColor: theme.backgroundSelected },
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="smallBold" themeColor="tint">
                  Sign out
                </ThemedText>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={styles.field}>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  Email
                </ThemedText>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
                />
              </View>

              <View style={styles.field}>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  Password
                </ThemedText>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={theme.textSecondary}
                  secureTextEntry
                  autoCapitalize="none"
                  style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
                />
              </View>

              {error && (
                <ThemedText type="small" themeColor="tint">
                  {error}
                </ThemedText>
              )}
              {notice && (
                <ThemedText type="small" themeColor="textSecondary">
                  {notice}
                </ThemedText>
              )}

              <Pressable
                accessibilityRole="button"
                disabled={busy || !email || !password}
                onPress={submit}
                style={({ pressed }) => [
                  styles.primaryButton,
                  { backgroundColor: busy || !email || !password ? theme.backgroundElement : theme.tint },
                  pressed && styles.pressed,
                ]}>
                <ThemedText
                  type="smallBold"
                  themeColor={busy || !email || !password ? 'textSecondary' : 'onTint'}>
                  {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
                </ThemedText>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
                  setError(null);
                  setNotice(null);
                }}
                style={({ pressed }) => [styles.toggle, pressed && styles.pressed]}>
                <ThemedText type="small" themeColor="textSecondary">
                  {mode === 'signin'
                    ? 'New here? Create an account'
                    : 'Already have an account? Sign in'}
                </ThemedText>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  inner: {
    flex: 1,
    maxWidth: MaxContentWidth,
    gap: Spacing.four,
  },
  back: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.lg,
  },
  header: { gap: Spacing.two },
  banner: {
    borderRadius: Radius.md,
    padding: Spacing.three,
    gap: Spacing.half,
  },
  field: { gap: Spacing.two },
  input: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
    fontSize: 15,
    fontFamily: Fonts?.sans,
  },
  primaryButton: {
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  secondaryButton: {
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  toggle: { alignSelf: 'center', paddingVertical: Spacing.two },
  pressed: { opacity: 0.7 },
});

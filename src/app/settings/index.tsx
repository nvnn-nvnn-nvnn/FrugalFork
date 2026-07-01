import { Href, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Radius, Shadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { usePremium } from '@/lib/premium/context';
import { useProfile } from '@/lib/profile/context';

type MenuItem = {
  icon: string;
  label: string;
  hint: string;
  href: Href;
};

const MENU: MenuItem[] = [
  { icon: '☁️', label: 'Account & Sync', hint: 'Sign in to back up + sync', href: '/auth' },
  { icon: '🍽️', label: 'Meal Preferences', hint: 'Diets, budget, favorites', href: '/settings/meal-preferences' },
  { icon: '🍳', label: 'Cooking History', hint: 'Dishes you’ve made', href: '/cooked' },
  { icon: '⭐', label: 'Review', hint: 'Rate SnackPlan', href: '/settings/review' },
  { icon: '✉️', label: 'Contact', hint: 'Get in touch', href: '/settings/contact' },
  { icon: 'ℹ️', label: 'About', hint: 'What SnackPlan is', href: '/settings/about' },
  { icon: '📄', label: 'Terms of Service', hint: 'The legal bits', href: '/settings/tos' },
];

export default function SettingsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useProfile();
  const { isPlus } = usePremium();

  const hasAccount = profile.name.trim().length > 0 || profile.email.trim().length > 0;
  const initial = (profile.name.trim()[0] ?? '🙂').toUpperCase();

  return (
    <ThemedView style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.three, paddingBottom: BottomTabInset + Spacing.five },
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
            <ThemedText type="smallBold">‹ Done</ThemedText>
          </Pressable>

          <View style={styles.header}>
            <ThemedText type="title">Settings</ThemedText>
          </View>

          {/* Account card */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit your profile"
            onPress={() => router.push('/settings/profile')}
            style={({ pressed }) => [
              styles.account,
              { backgroundColor: theme.backgroundElement },
              pressed && styles.pressed,
            ]}>
            <View style={[styles.avatar, { backgroundColor: theme.tint }]}>
              <ThemedText type="subtitle" themeColor="onTint" style={styles.avatarText}>
                {initial}
              </ThemedText>
            </View>
            <View style={styles.accountBody}>
              <ThemedText type="subtitle" style={styles.accountName}>
                {hasAccount && profile.name.trim() ? profile.name.trim() : 'Your profile'}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {hasAccount && profile.email.trim()
                  ? profile.email.trim()
                  : 'Add your name and email'}
              </ThemedText>
            </View>
            <ThemedText type="subtitle" themeColor="textSecondary" style={styles.chevron}>
              ›
            </ThemedText>
          </Pressable>

          {/* SnackPlan Plus */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isPlus ? 'Manage SnackPlan Plus' : 'Upgrade to SnackPlan Plus'}
            onPress={() => router.push('/paywall')}
            style={({ pressed }) => [
              styles.plus,
              { backgroundColor: isPlus ? theme.backgroundElement : theme.tint },
              pressed && styles.pressed,
            ]}>
            <ThemedText style={styles.plusIcon}>✦</ThemedText>
            <View style={styles.plusBody}>
              <ThemedText type="smallBold" themeColor={isPlus ? 'text' : 'onTint'}>
                {isPlus ? 'SnackPlan Plus — active' : 'Upgrade to SnackPlan Plus'}
              </ThemedText>
              <ThemedText type="small" themeColor={isPlus ? 'textSecondary' : 'onTint'}>
                {isPlus ? 'Manage your subscription' : 'OCR, sync, unlimited cookbooks & more'}
              </ThemedText>
            </View>
            <ThemedText
              type="subtitle"
              themeColor={isPlus ? 'textSecondary' : 'onTint'}
              style={styles.chevron}>
              ›
            </ThemedText>
          </Pressable>

          {/* Menu */}
          <View style={[styles.menu, { backgroundColor: theme.backgroundElement }]}>
            {MENU.map((item, i) => (
              <Pressable
                key={item.label}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                onPress={() => router.push(item.href)}
                style={({ pressed }) => [
                  styles.row,
                  i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.backgroundSelected },
                  pressed && { backgroundColor: theme.backgroundSelected },
                ]}>
                <ThemedText style={styles.rowIcon}>{item.icon}</ThemedText>
                <View style={styles.rowBody}>
                  <ThemedText type="smallBold">{item.label}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {item.hint}
                  </ThemedText>
                </View>
                <ThemedText type="subtitle" themeColor="textSecondary" style={styles.chevron}>
                  ›
                </ThemedText>
              </Pressable>
            ))}
          </View>
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
  account: {
    ...Shadow,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.lg,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { lineHeight: 32 },
  accountBody: { flex: 1, gap: Spacing.half },
  accountName: { fontSize: 18, lineHeight: 24 },
  plus: {
    ...Shadow,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.lg,
  },
  plusIcon: { fontSize: 22, lineHeight: 28, width: 28, textAlign: 'center' },
  plusBody: { flex: 1, gap: Spacing.half },
  menu: {
    ...Shadow,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  rowIcon: { fontSize: 22, lineHeight: 28, width: 28, textAlign: 'center' },
  rowBody: { flex: 1, gap: Spacing.half },
  chevron: { lineHeight: 28 },
  pressed: { opacity: 0.7 },
});

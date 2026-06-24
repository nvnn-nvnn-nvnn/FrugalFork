import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CookbookFab } from '@/components/cookbook/cookbook-fab';
import { CookbookView } from '@/components/cookbook/cookbook-view';
import { NewCookbookSheet } from '@/components/cookbook/new-cookbook-sheet';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { type Cookbook } from '@/lib/cookbook/context';

export default function CookbookScreen() {
  const insets = useSafeAreaInsets();
  const [showNewCookbook, setShowNewCookbook] = useState(false);
  const [openCookbook, setOpenCookbook] = useState<Cookbook | null>(null);

  return (
    <ThemedView style={styles.root}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.four, paddingBottom: BottomTabInset + Spacing.five },
        ]}>
        <View style={styles.inner}>
          <CookbookView onOpenChange={setOpenCookbook} />
        </View>
      </ScrollView>

      {/* Hidden while a cookbook is open (you're a level deeper). */}
      {!openCookbook && <CookbookFab onPress={() => setShowNewCookbook(true)} />}
      <NewCookbookSheet visible={showNewCookbook} onClose={() => setShowNewCookbook(false)} />
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
  },
});

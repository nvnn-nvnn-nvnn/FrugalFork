import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { type Cookbook, useCookbook } from '@/lib/cookbook/context';

const ICONS = ['📕', '🍳', '🥗', '🍜', '🍰', '🌮', '🍕', '🥘', '🍣', '🥑', '☕', '⭐'];

type Props = {
  /** The cookbook being edited, or null when closed. */
  cookbook: Cookbook | null;
  onClose: () => void;
  /** Called after the cookbook is deleted (host should leave the detail view). */
  onDeleted: () => void;
};

/** Settings for a personalized cookbook: rename, pick an icon, or delete. */
export function CookbookSettingsSheet({ cookbook, onClose, onDeleted }: Props) {
  const theme = useTheme();
  const { renameCookbook, setCookbookIcon, deleteCookbook } = useCookbook();
  const [name, setName] = useState(cookbook?.name ?? '');
  const [icon, setIcon] = useState<string | undefined>(cookbook?.icon);

  if (!cookbook) return null;

  const save = () => {
    renameCookbook(cookbook.id, name);
    setCookbookIcon(cookbook.id, icon);
    onClose();
  };

  return (
    <Modal transparent visible animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} accessibilityLabel="Close" onPress={onClose} />
        <ThemedView style={styles.sheet}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sheetBody}>
            <ThemedText type="subtitle">Cookbook settings</ThemedText>

            <View style={styles.field}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            Title
          </ThemedText>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Cookbook name"
            placeholderTextColor={theme.textSecondary}
            onSubmitEditing={save}
            style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
          />
        </View>

        <View style={styles.field}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            Icon
          </ThemedText>
          <View style={styles.iconGrid}>
            {ICONS.map((emoji) => {
              const on = emoji === icon;
              return (
                <Pressable
                  key={emoji}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  onPress={() => setIcon(on ? undefined : emoji)}
                  style={({ pressed }) => [
                    styles.iconTile,
                    {
                      backgroundColor: theme.backgroundElement,
                      borderColor: on ? theme.tint : 'transparent',
                    },
                    pressed && styles.pressed,
                  ]}>
                  <ThemedText style={styles.iconEmoji}>{emoji}</ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={save}
          style={({ pressed }) => [
            styles.saveButton,
            { backgroundColor: theme.tint },
            pressed && styles.pressed,
          ]}>
          <ThemedText type="smallBold" themeColor="onTint">
            Save
          </ThemedText>
        </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => {
                deleteCookbook(cookbook.id);
                onClose();
                onDeleted();
              }}
              style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                Delete cookbook
              </ThemedText>
            </Pressable>
          </ScrollView>
        </ThemedView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    maxHeight: '88%',
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    overflow: 'hidden',
  },
  sheetBody: {
    padding: Spacing.four,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  field: { gap: Spacing.two },
  input: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
    fontSize: 16,
    fontFamily: Fonts?.sans,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  iconTile: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: { fontSize: 24, lineHeight: 30 },
  saveButton: {
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  deleteButton: {
    alignSelf: 'center',
    paddingVertical: Spacing.two,
  },
  pressed: { opacity: 0.7 },
});

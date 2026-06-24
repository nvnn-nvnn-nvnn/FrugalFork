import * as ImagePicker from 'expo-image-picker';

/**
 * Let the user pick a meal photo from their library. Returns a local file URI to
 * store on the planned meal, or null if they cancel or deny access.
 */
export async function pickMealPhoto(): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });

  if (result.canceled) return null;
  return result.assets[0]?.uri ?? null;
}

/** Old stubbed photos used a fake scheme; treat those as "no real photo". */
export function isPlaceholderPhoto(uri: string | null): boolean {
  return !!uri && uri.startsWith('placeholder://');
}

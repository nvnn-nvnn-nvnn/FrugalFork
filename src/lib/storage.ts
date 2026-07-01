import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Thin JSON wrapper over AsyncStorage. Everything SnackPlan persists lives
 * on-device (privacy-first) — the taste model, the week log, the staples.
 */

export async function loadJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function saveJSON<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Best-effort; a failed write shouldn't crash the loop.
  }
}

export const StorageKeys = {
  profile: 'snackplan.profile.v1',
  spend: 'snackplan.spend.v1',
  /** v2 = days are Sunday-first (0=Sun..6=Sat). v1 was Monday-first; migrated once on load. */
  builder: 'snackplan.builder.v2',
  builderLegacy: 'snackplan.builder.v1',
  cookbooks: 'snackplan.cookbooks.v1',
  /** Recipe ids pushed straight to the shopping list (independent of the plan). */
  groceries: 'snackplan.groceries.v1',
  /** Ingredient names crossed off the shopping list. */
  shopChecked: 'snackplan.shopChecked.v1',
  /** Recipes the user created/imported (the curated library lives in code). */
  userRecipes: 'snackplan.userRecipes.v1',
  /** History of cooked/eaten dishes (the finished-dishes log). */
  cookedLog: 'snackplan.cookedLog.v1',
  /**
   * Premium entitlement. Today this only holds the DEV override flag; once real
   * IAP (RevenueCat/StoreKit) is wired, the source of truth becomes the store and
   * this key is just a local cache of the last-known entitlement.
   */
  premium: 'snackplan.premium.v1',
  /** Per-dish thumbnail photos: recipeId → local image URI. */
  dishImages: 'snackplan.dishImages.v1',
} as const;

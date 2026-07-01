import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { StorageKeys, loadJSON, saveJSON } from '@/lib/storage';

/**
 * SnackPlan Plus — the freemium entitlement layer.
 *
 * The paid tier is a single $5/mo subscription that unlocks every gated feature
 * (all-or-nothing today; `has(feature)` exists so we *could* split tiers later
 * without touching call sites). The free tier keeps the core loop — planner,
 * curated library, shopping list, one cookbook, on-device only.
 *
 * NO real payments are wired yet. `isPlus` is driven by a persisted DEV override
 * so we can gate and test the whole UI now. When we add RevenueCat/StoreKit, the
 * source of truth becomes the store's `customerInfo`; see `REAL PAYMENTS SEAM`.
 */

/** The catalog of Plus-only features. Label is shown on the paywall + lock UI. */
export const PLUS_FEATURES = {
  ocr: 'Receipt scanning & spend analytics',
  unlimitedCookbooks: 'Unlimited cookbooks',
  sync: 'Cloud sync across devices',
  recipeImport: 'Recipe import (paste a link)',
  autoFillWeek: 'Auto-fill your week to a budget',
} as const;

export type PlusFeature = keyof typeof PLUS_FEATURES;

/** Free-tier limits, kept here so the paywall copy and the enforcement agree. */
export const FREE_LIMITS = {
  /** Free users get one cookbook; Plus is unlimited. */
  cookbooks: 1,
} as const;

/** What the store sub costs. Single source of truth for the paywall copy. */
export const PLUS_PRICE = { monthly: '$5', period: 'month' } as const;

type PersistedEntitlement = { plus: boolean };
const DEFAULT_ENTITLEMENT: PersistedEntitlement = { plus: false };

type PremiumContextValue = {
  /** False until the persisted entitlement has loaded. */
  ready: boolean;
  /** Whether the user has an active Plus subscription. */
  isPlus: boolean;
  /** Does the user have access to a specific gated feature? (All-or-nothing today.) */
  has: (feature: PlusFeature) => boolean;
  /**
   * DEV ONLY: simulate an active/inactive subscription. Persisted so it survives
   * reloads. Replace with a real `purchase()` once IAP is wired.
   */
  devSetPlus: (active: boolean) => void;
};

const PremiumContext = createContext<PremiumContextValue | null>(null);

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const [isPlus, setIsPlus] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    // REAL PAYMENTS SEAM — when RevenueCat/StoreKit is added, initialize the SDK
    // here and derive `isPlus` from customerInfo.entitlements (and subscribe to
    // updates), instead of reading the local DEV override below.
    loadJSON<PersistedEntitlement>(StorageKeys.premium, DEFAULT_ENTITLEMENT).then((loaded) => {
      if (!active) return;
      setIsPlus(loaded.plus);
      setReady(true);
    });

    return () => {
      active = false;
    };
  }, []);

  const devSetPlus = useCallback((next: boolean) => {
    setIsPlus(next);
    saveJSON<PersistedEntitlement>(StorageKeys.premium, { plus: next });
  }, []);

  const has = useCallback((_feature: PlusFeature) => isPlus, [isPlus]);

  const value = useMemo<PremiumContextValue>(
    () => ({ ready, isPlus, has, devSetPlus }),
    [ready, isPlus, has, devSetPlus],
  );

  return <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>;
}

export function usePremium() {
  const ctx = useContext(PremiumContext);
  if (!ctx) throw new Error('usePremium must be used within a PremiumProvider');
  return ctx;
}

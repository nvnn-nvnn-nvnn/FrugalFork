import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { StorageKeys, loadJSON, saveJSON } from '@/lib/storage';

/** What we learn in onboarding. All on-device, no PII. */
export type UserProfile = {
  onboarded: boolean;
  /** Display name for the account card. On-device only. */
  name: string;
  /** Contact email for the account card. On-device only. */
  email: string;
  /** Meals the user loves — the strongest taste signal we have on day 1. */
  favoriteMeals: string[];
  /** What they usually eat — the everyday baseline. */
  usualMeals: string[];
  /** Rough weekly grocery spend, in whole currency units. */
  weeklyGroceryBudget: number | null;
  /** Dietary lifestyle / restrictions, e.g. ['vegetarian', 'halal']. Empty = no restriction. */
  diets: string[];
  /** Ingredients the user usually keeps on hand. */
  staples: string[];
};

const DEFAULT_PROFILE: UserProfile = {
  onboarded: false,
  name: '',
  email: '',
  favoriteMeals: [],
  usualMeals: [],
  weeklyGroceryBudget: null,
  diets: [],
  staples: [],
};

type ProfileContextValue = {
  profile: UserProfile;
  /** False until the persisted profile has loaded. */
  ready: boolean;
  /** Merge a partial update and persist. */
  update: (patch: Partial<UserProfile>) => void;
  /** Save onboarding answers and mark the user as onboarded. */
  completeOnboarding: (answers: Omit<UserProfile, 'onboarded' | 'staples' | 'name' | 'email'>) => void;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    loadJSON<UserProfile>(StorageKeys.profile, DEFAULT_PROFILE).then((loaded) => {
      if (!active) return;
      setProfile({ ...DEFAULT_PROFILE, ...loaded });
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const persist = useCallback((next: UserProfile) => {
    setProfile(next);
    saveJSON(StorageKeys.profile, next);
  }, []);

  const update = useCallback(
    (patch: Partial<UserProfile>) => persist({ ...profile, ...patch }),
    [persist, profile],
  );

  const completeOnboarding = useCallback(
    (answers: Omit<UserProfile, 'onboarded' | 'staples' | 'name' | 'email'>) =>
      persist({ ...DEFAULT_PROFILE, ...answers, onboarded: true }),
    [persist],
  );

  const value = useMemo(
    () => ({ profile, ready, update, completeOnboarding }),
    [profile, ready, update, completeOnboarding],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within a ProfileProvider');
  return ctx;
}

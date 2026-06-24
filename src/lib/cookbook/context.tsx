import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { StorageKeys, loadJSON, saveJSON } from '@/lib/storage';

/** A user-created collection of saved dishes. */
export type Cookbook = {
  id: string;
  name: string;
  /** Optional emoji icon for the cookbook (set in cookbook settings). */
  icon?: string;
  /** Recipe ids saved into this cookbook. */
  recipeIds: string[];
};

/** Cap on how many cookbooks a user can have (for now). */
export const MAX_COOKBOOKS = 3;

/**
 * The always-present "default folder". Dishes picked from Decide land here first;
 * the user can later move them into their own cookbooks. It can't be deleted, so
 * the `+` on a dish always has somewhere to go.
 */
export const DEFAULT_COOKBOOK_ID = 'cb-default';
const DEFAULT_COOKBOOK_NAME = 'My Cookbook';

const DEFAULT_COOKBOOKS: Cookbook[] = [
  { id: DEFAULT_COOKBOOK_ID, name: DEFAULT_COOKBOOK_NAME, recipeIds: [] },
];

type CookbookContextValue = {
  cookbooks: Cookbook[];
  ready: boolean;
  /** True if `recipeId` is saved in any cookbook. */
  isSaved: (recipeId: string) => boolean;
  /** True if `recipeId` is in the default folder. */
  isInDefault: (recipeId: string) => boolean;
  /** Toggle a dish in the default folder (re-creating the folder if it was removed). */
  saveToDefault: (recipeId: string) => void;
  /** Create a new cookbook (no-op once at the cap). Returns its id, or null. */
  createCookbook: (name: string) => string | null;
  /** Rename a cookbook. */
  renameCookbook: (id: string, name: string) => void;
  /** Set (or clear) a cookbook's emoji icon. */
  setCookbookIcon: (id: string, icon: string | undefined) => void;
  /** Delete a cookbook. */
  deleteCookbook: (id: string) => void;
  /** Add/remove a dish in a cookbook. */
  toggleDish: (cookbookId: string, recipeId: string) => void;
  /** Move a dish from one cookbook to another (remove from `fromId`, add to `toId`). */
  moveDish: (fromId: string, toId: string, recipeId: string) => void;
};

const CookbookContext = createContext<CookbookContextValue | null>(null);

export function CookbookProvider({ children }: { children: React.ReactNode }) {
  const [cookbooks, setCookbooks] = useState<Cookbook[]>(DEFAULT_COOKBOOKS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    loadJSON<Cookbook[]>(StorageKeys.cookbooks, DEFAULT_COOKBOOKS).then((loaded) => {
      if (!active) return;
      setCookbooks(loaded.length > 0 ? loaded : DEFAULT_COOKBOOKS);
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const persist = useCallback((next: Cookbook[]) => {
    setCookbooks(next);
    saveJSON(StorageKeys.cookbooks, next);
  }, []);

  const isSaved = useCallback(
    (recipeId: string) => cookbooks.some((c) => c.recipeIds.includes(recipeId)),
    [cookbooks],
  );

  const isInDefault = useCallback(
    (recipeId: string) =>
      cookbooks.find((c) => c.id === DEFAULT_COOKBOOK_ID)?.recipeIds.includes(recipeId) ?? false,
    [cookbooks],
  );

  const saveToDefault = useCallback((recipeId: string) => {
    setCookbooks((prev) => {
      const hasDefault = prev.some((c) => c.id === DEFAULT_COOKBOOK_ID);
      const next = hasDefault
        ? prev.map((c) =>
            c.id === DEFAULT_COOKBOOK_ID
              ? {
                  ...c,
                  recipeIds: c.recipeIds.includes(recipeId)
                    ? c.recipeIds.filter((r) => r !== recipeId)
                    : [recipeId, ...c.recipeIds],
                }
              : c,
          )
        : [{ id: DEFAULT_COOKBOOK_ID, name: DEFAULT_COOKBOOK_NAME, recipeIds: [recipeId] }, ...prev];
      saveJSON(StorageKeys.cookbooks, next);
      return next;
    });
  }, []);

  const createCookbook = useCallback(
    (name: string): string | null => {
      if (cookbooks.length >= MAX_COOKBOOKS) return null;
      const id = `cb-${Date.now()}`;
      const trimmed = name.trim() || `Cookbook ${cookbooks.length + 1}`;
      persist([...cookbooks, { id, name: trimmed, recipeIds: [] }]);
      return id;
    },
    [cookbooks, persist],
  );

  const renameCookbook = useCallback(
    (id: string, name: string) =>
      persist(cookbooks.map((c) => (c.id === id ? { ...c, name: name.trim() || c.name } : c))),
    [cookbooks, persist],
  );

  const setCookbookIcon = useCallback(
    (id: string, icon: string | undefined) =>
      persist(cookbooks.map((c) => (c.id === id ? { ...c, icon } : c))),
    [cookbooks, persist],
  );

  const deleteCookbook = useCallback(
    (id: string) => persist(cookbooks.filter((c) => c.id !== id)),
    [cookbooks, persist],
  );

  const toggleDish = useCallback(
    (cookbookId: string, recipeId: string) =>
      persist(
        cookbooks.map((c) =>
          c.id === cookbookId
            ? {
                ...c,
                recipeIds: c.recipeIds.includes(recipeId)
                  ? c.recipeIds.filter((r) => r !== recipeId)
                  : [recipeId, ...c.recipeIds],
              }
            : c,
        ),
      ),
    [cookbooks, persist],
  );

  const moveDish = useCallback(
    (fromId: string, toId: string, recipeId: string) => {
      if (fromId === toId) return;
      persist(
        cookbooks.map((c) => {
          if (c.id === fromId) {
            return { ...c, recipeIds: c.recipeIds.filter((r) => r !== recipeId) };
          }
          if (c.id === toId) {
            return c.recipeIds.includes(recipeId)
              ? c
              : { ...c, recipeIds: [recipeId, ...c.recipeIds] };
          }
          return c;
        }),
      );
    },
    [cookbooks, persist],
  );

  const value = useMemo<CookbookContextValue>(
    () => ({
      cookbooks,
      ready,
      isSaved,
      isInDefault,
      saveToDefault,
      createCookbook,
      renameCookbook,
      setCookbookIcon,
      deleteCookbook,
      toggleDish,
      moveDish,
    }),
    [
      cookbooks,
      ready,
      isSaved,
      isInDefault,
      saveToDefault,
      createCookbook,
      renameCookbook,
      setCookbookIcon,
      deleteCookbook,
      toggleDish,
      moveDish,
    ],
  );

  return <CookbookContext.Provider value={value}>{children}</CookbookContext.Provider>;
}

export function useCookbook() {
  const ctx = useContext(CookbookContext);
  if (!ctx) throw new Error('useCookbook must be used within a CookbookProvider');
  return ctx;
}

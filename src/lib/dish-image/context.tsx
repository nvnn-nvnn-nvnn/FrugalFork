import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { StorageKeys, loadJSON, saveJSON } from '@/lib/storage';

/**
 * Per-dish thumbnail photos. A dish's image is keyed by recipe id, so it works
 * for **any** dish — curated library, user-created, or imported — without
 * touching the (immutable) recipe data. Stored on-device as local image URIs.
 *
 * Note: these are local file URIs from the image picker. For multi-device sync
 * you'd upload to Supabase Storage and key by the public URL instead — the
 * `getImage`/`setImage` contract stays the same.
 */

type DishImages = Record<string, string>; // recipeId → image URI

type DishImageContextValue = {
  /** False until persisted images have loaded. */
  ready: boolean;
  /** The thumbnail URI for a dish, or undefined to fall back to its emoji. */
  getImage: (recipeId: string) => string | undefined;
  setImage: (recipeId: string, uri: string) => void;
  clearImage: (recipeId: string) => void;
};

const DishImageContext = createContext<DishImageContextValue | null>(null);

export function DishImageProvider({ children }: { children: React.ReactNode }) {
  const [images, setImages] = useState<DishImages>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    loadJSON<DishImages>(StorageKeys.dishImages, {}).then((loaded) => {
      if (!active) return;
      setImages(loaded);
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const persist = useCallback((next: DishImages) => {
    setImages(next);
    saveJSON(StorageKeys.dishImages, next);
  }, []);

  const getImage = useCallback((recipeId: string) => images[recipeId], [images]);
  const setImage = useCallback(
    (recipeId: string, uri: string) => persist({ ...images, [recipeId]: uri }),
    [images, persist],
  );
  const clearImage = useCallback(
    (recipeId: string) => {
      const next = { ...images };
      delete next[recipeId];
      persist(next);
    },
    [images, persist],
  );

  const value = useMemo(
    () => ({ ready, getImage, setImage, clearImage }),
    [ready, getImage, setImage, clearImage],
  );

  return <DishImageContext.Provider value={value}>{children}</DishImageContext.Provider>;
}

export function useDishImages() {
  const ctx = useContext(DishImageContext);
  if (!ctx) throw new Error('useDishImages must be used within a DishImageProvider');
  return ctx;
}

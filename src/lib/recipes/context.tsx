import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { StorageKeys, loadJSON, saveJSON } from '@/lib/storage';
import { registerUserRecipe } from '@/lib/plan/recipes';
import type { Recipe } from '@/lib/plan/types';

/**
 * Source of truth for **user-created recipes** (the curated library lives in
 * code). Persisted on-device, and registered into `RECIPES_BY_ID` on load + on
 * create so every screen (dish detail, cookbook, plan, shopping) can resolve
 * them by id like any built-in recipe.
 */
type RecipeContextValue = {
  /** False until persisted user recipes have loaded + registered. */
  ready: boolean;
  /** All recipes the user has created. */
  userRecipes: Recipe[];
  /** Persist + register a new user recipe. */
  addRecipe: (recipe: Recipe) => void;
};

const RecipeContext = createContext<RecipeContextValue | null>(null);

export function RecipeProvider({ children }: { children: React.ReactNode }) {
  const [userRecipes, setUserRecipes] = useState<Recipe[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    loadJSON<Recipe[]>(StorageKeys.userRecipes, []).then((loaded) => {
      if (!active) return;
      loaded.forEach(registerUserRecipe); // make them resolvable before screens render
      setUserRecipes(loaded);
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const addRecipe = useCallback((recipe: Recipe) => {
    registerUserRecipe(recipe);
    setUserRecipes((prev) => {
      const next = [recipe, ...prev];
      saveJSON(StorageKeys.userRecipes, next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ ready, userRecipes, addRecipe }), [ready, userRecipes, addRecipe]);

  return <RecipeContext.Provider value={value}>{children}</RecipeContext.Provider>;
}

export function useRecipes() {
  const ctx = useContext(RecipeContext);
  if (!ctx) throw new Error('useRecipes must be used within a RecipeProvider');
  return ctx;
}

import { SLOTS, type Recipe, type Slot } from '@/lib/plan/types';

/**
 * The recipe shape the `extract` function returns (no id/cost/cheap — the app
 * derives those, exactly like the create-recipe form does). Kept in sync with
 * supabase/functions/extract/schemas.ts.
 */
export type ExtractedRecipe = {
  title: string;
  emoji: string;
  slots: Slot[];
  calories: number;
  health: string;
  tags: string[];
  contains: string[];
  ingredients: { name: string; qty: string; cost: number }[];
  steps: string[];
};

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * Turn an extracted (scanned/imported) recipe into a full library `Recipe`:
 * normalize ingredients, derive per-serving cost from them, and mark it as a
 * user recipe. Mirrors the mapping in app/recipe/new.tsx so scanned, imported,
 * and hand-typed recipes are identical downstream.
 */
export function extractedToRecipe(e: ExtractedRecipe): Recipe {
  const ingredients = (e.ingredients ?? [])
    .filter((i) => i.name?.trim())
    .map((i) => ({
      name: i.name.trim().toLowerCase(),
      qty: i.qty?.trim() || '1',
      cost: Number(i.cost) || 0,
    }));
  const cost = round(ingredients.reduce((sum, i) => sum + i.cost, 0));
  const steps = (e.steps ?? []).map((s) => s.trim()).filter(Boolean);

  return {
    id: `user-${Date.now()}`,
    title: e.title?.trim() || 'Imported dish',
    emoji: e.emoji || '🍽️',
    slots: e.slots?.length ? e.slots : [...SLOTS],
    cost,
    calories: Number(e.calories) || 0,
    health: e.health?.trim() || 'imported',
    cheap: cost <= 3,
    tags: e.tags ?? [],
    contains: e.contains ?? [],
    ingredients,
    steps: steps.length ? steps : undefined,
    userCreated: true,
  };
}

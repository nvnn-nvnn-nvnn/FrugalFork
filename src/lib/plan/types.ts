/**
 * Budget-first weekly meal planning, aimed at frugal students.
 *
 * The plan is the heart of the app now: pick what you feel like this week, get a
 * 7-day plan of cheap, good food within your budget, and a curated shopping list.
 * Costs are rough estimates in whole-dollar-ish units — good enough to budget by.
 */

export type Slot = 'breakfast' | 'lunch' | 'dinner';

export const SLOTS: Slot[] = ['breakfast', 'lunch', 'dinner'];

export const SLOT_META: Record<Slot, { label: string; emoji: string }> = {
  breakfast: { label: 'Breakfast', emoji: '🥣' },
  lunch: { label: 'Lunch', emoji: '🥪' },
  dinner: { label: 'Dinner', emoji: '🍝' },
};

/** One line of a recipe's ingredient list, with the cost of the portion used. */
export type Ingredient = {
  name: string;
  qty: string;
  /** Estimated cost of the amount this recipe uses, in dollars. */
  cost: number;
};

/** A frugal recipe in the library. */
export type Recipe = {
  id: string;
  title: string;
  emoji: string;
  /** Which meal slots this fits. */
  slots: Slot[];
  /** Estimated cost per serving, in dollars. */
  cost: number;
  calories: number;
  /** Short health benefit line, e.g. "high fiber · plant protein". */
  health: string;
  /** A standout cheap eat. */
  cheap: boolean;
  /** Craving / cuisine tags used to match "what you feel like this week". */
  tags: string[];
  /**
   * Dietary attributes this recipe contains (meat, dairy, gluten, high-carb, …).
   * Diets filter against these — see `src/lib/plan/diets.ts`.
   */
  contains: string[];
  ingredients: Ingredient[];
  /** Real step-by-step instructions (user-created recipes). Falls back to a generator if absent. */
  steps?: string[];
  /** True for recipes the user created/imported (vs the curated library). */
  userCreated?: boolean;
};

/**
 * The single "planned meal" unit. A dish the user picked for a given weekday
 * (no meal-time bucket — any dish can go on any day), plus its meal-prep / photo
 * / eaten state. The builder (a list of these) is the app's source of truth —
 * the Plan and Shop are both views over it.
 */
export type BuilderItem = {
  /** Stable identity: `${recipeId}:${day}` (also enforces no duplicates per day). */
  id: string;
  recipeId: string;
  /** Which weekday this meal is for: 0 = Sun … 6 = Sat. */
  day: number;
  /** How many servings to make (1–4) — scales ingredient amounts + cost. */
  servings: number;
  /** Epoch ms when added — chronological ordering. */
  addedAt: number;
  /** User confirmed they ate this ("I ate this" on the Plan). */
  eaten: boolean;
  /** User marked this as meal-prepped ahead. */
  prepped: boolean;
  /** Placeholder reference to a meal photo (real capture is stubbed). */
  photo: string | null;
};

/** Build the stable id for a builder item. */
export function builderItemId(recipeId: string, day: number): string {
  return `${recipeId}:${day}`;
}

/** A dish on the shopping list, with how many servings to shop for. */
export type GroceryEntry = { recipeId: string; servings: number };

/** A logged "I cooked/ate this" event — the finished-dishes history. */
export type CookedEntry = { recipeId: string; at: number; servings: number };

/** A consolidated shopping-list line, aggregated across the chosen recipes. */
export type ShoppingItem = {
  name: string;
  /** All the portion descriptions that contributed (e.g. ["2 cups", "1 cup"]). */
  qtys: string[];
  /** Summed estimated cost. */
  cost: number;
  /** Titles of the dishes that need this ingredient. */
  dishes: string[];
};

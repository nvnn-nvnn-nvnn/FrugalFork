import { CATEGORY_ORDER, categoryOf } from './ingredients';
import { RECIPES_BY_ID } from './recipes';
import type { BuilderItem, GroceryEntry, ShoppingItem } from './types';

/** A category group of the shopping list (e.g. "Produce" with its items). */
export type ShoppingSection = { category: string; items: ShoppingItem[]; cost: number };

/** A per-recipe group of the shopping list (every ingredient that dish needs). */
export type RecipeShoppingSection = {
  recipeId: string;
  title: string;
  emoji: string;
  /** Baked-in thumbnail (for the recipe picker), if the dish has one. */
  image?: string;
  items: ShoppingItem[];
  cost: number;
};

/**
 * Helpers over the meal builder (the source of truth). The Plan and Shop screens
 * derive everything — cost, calories, the shopping list — from the builder items.
 * Costs/calories are per-serving on the recipe, so everything scales by `servings`.
 */

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Scale a free-text quantity ("2 cups") by a factor; falls back to a "×N" suffix. */
function scaleQty(qty: string, factor: number): string {
  if (factor === 1) return qty;
  const m = qty.match(/^(\d+(?:\.\d+)?)(.*)$/);
  if (m) {
    const n = parseFloat(m[1]) * factor;
    const num = Number.isInteger(n) ? String(n) : n.toFixed(1);
    return `${num}${m[2]}`;
  }
  return `${qty} ×${factor}`;
}

/** Total estimated cost of the builder, scaled by each meal's servings. */
export function builderCost(items: BuilderItem[]): number {
  return round(
    items.reduce((sum, it) => sum + (RECIPES_BY_ID[it.recipeId]?.cost ?? 0) * it.servings, 0),
  );
}

/** Total calories across the builder, scaled by each meal's servings. */
export function builderCalories(items: BuilderItem[]): number {
  return items.reduce((sum, it) => sum + (RECIPES_BY_ID[it.recipeId]?.calories ?? 0) * it.servings, 0);
}

/**
 * The shopping list for a set of dishes (each with servings), grouped into
 * grocery categories (Produce, Dairy, …). Ingredient amounts + costs scale by
 * servings.
 */
export function buildShoppingSections(entries: GroceryEntry[]): {
  sections: ShoppingSection[];
  total: number;
} {
  const byName = new Map<string, ShoppingItem>();

  for (const { recipeId, servings } of entries) {
    const recipe = RECIPES_BY_ID[recipeId];
    if (!recipe) continue;
    for (const ing of recipe.ingredients) {
      const qty = scaleQty(ing.qty, servings);
      const cost = round(ing.cost * servings);
      const existing = byName.get(ing.name);
      if (existing) {
        existing.qtys.push(qty);
        existing.cost = round(existing.cost + cost);
        if (!existing.dishes.includes(recipe.title)) existing.dishes.push(recipe.title);
      } else {
        byName.set(ing.name, { name: ing.name, qtys: [qty], cost, dishes: [recipe.title] });
      }
    }
  }

  const items = [...byName.values()].sort((a, b) => b.cost - a.cost);
  const total = round(items.reduce((sum, i) => sum + i.cost, 0));

  const byCat = new Map<string, ShoppingItem[]>();
  for (const item of items) {
    const cat = categoryOf(item.name);
    if (!byCat.has(cat)) byCat.set(cat, []);
    byCat.get(cat)!.push(item);
  }
  const sections = [...byCat.entries()]
    .sort((a, b) => CATEGORY_ORDER.indexOf(a[0]) - CATEGORY_ORDER.indexOf(b[0]))
    .map(([category, its]) => ({
      category,
      items: its,
      cost: round(its.reduce((sum, i) => sum + i.cost, 0)),
    }));

  return { sections, total };
}

/**
 * The shopping list grouped **by recipe** instead of by aisle: one section per
 * planned dish, listing exactly the ingredients that dish needs (amounts + costs
 * scaled by its servings). Same dishes/servings as `buildShoppingSections` — just
 * a different cut, so the two views always total the same.
 */
export function buildRecipeSections(entries: GroceryEntry[]): {
  sections: RecipeShoppingSection[];
  total: number;
} {
  const sections: RecipeShoppingSection[] = [];

  for (const { recipeId, servings } of entries) {
    const recipe = RECIPES_BY_ID[recipeId];
    if (!recipe) continue;

    const items: ShoppingItem[] = recipe.ingredients.map((ing) => ({
      name: ing.name,
      qtys: [scaleQty(ing.qty, servings)],
      cost: round(ing.cost * servings),
      dishes: [recipe.title],
    }));
    const cost = round(items.reduce((sum, i) => sum + i.cost, 0));

    sections.push({
      recipeId,
      title: recipe.title,
      emoji: recipe.emoji,
      image: recipe.image,
      items,
      cost,
    });
  }

  const total = round(sections.reduce((sum, s) => sum + s.cost, 0));
  return { sections, total };
}

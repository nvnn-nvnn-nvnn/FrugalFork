import { CATEGORY_ORDER, categoryOf } from './ingredients';
import type { Ingredient, Recipe } from './types';

/**
 * Derives the dish-detail view-model from a recipe.
 *
 * Ingredients are real (grouped by category). Cookware / instructions / reviews
 * are PLACEHOLDER content generated generically per recipe — enough to build and
 * demo the tabbed detail UI before real per-recipe data (or user submissions)
 * exist. Swap these generators for authored/server data later.
 */

export type Section<T> = { title: string; items: T[] };

export type DishReview = { user: string; rating: number; text: string };

/** Rough total prep+cook time, derived from the ingredient count. */
export function dishMinutes(recipe: Recipe): number {
  return 10 + recipe.ingredients.length * 4;
}

/** A short "about" line, synthesized from the recipe's traits. */
export function dishAbout(recipe: Recipe): string {
  const lead = recipe.cheap ? 'A budget-friendly' : 'A simple';
  const vibe = recipe.tags[0] ?? 'everyday';
  return `${lead} ${vibe} dish — ${recipe.health}. About $${recipe.cost.toFixed(2)} per serving.`;
}

/** Ingredients grouped into sections by category. */
export function ingredientSections(recipe: Recipe): Section<Ingredient>[] {
  const byCat = new Map<string, Ingredient[]>();
  for (const ing of recipe.ingredients) {
    const cat = categoryOf(ing.name);
    if (!byCat.has(cat)) byCat.set(cat, []);
    byCat.get(cat)!.push(ing);
  }
  return [...byCat.entries()]
    .sort((a, b) => CATEGORY_ORDER.indexOf(a[0]) - CATEGORY_ORDER.indexOf(b[0]))
    .map(([title, items]) => ({ title, items }));
}

/** PLACEHOLDER cookware, loosely inferred from the recipe. */
export function cookwareSections(recipe: Recipe): Section<string>[] {
  const t = `${recipe.title} ${recipe.tags.join(' ')}`.toLowerCase();
  let vessel = 'frying pan';
  if (/soup|curry|lentil|noodle|pasta|rice|boil/.test(t)) vessel = 'medium pot';
  if (/salad|wrap|yogurt|toast|bowl/.test(t)) vessel = 'mixing bowl';

  return [
    { title: 'Tools', items: ['chopping board', 'knife', 'measuring cup', 'spoon'] },
    { title: 'Cookware', items: [vessel, 'spatula'] },
  ];
}

/** Step-by-step instructions. Uses the recipe's real `steps` when present (user-created). */
export function instructionSections(recipe: Recipe): Section<string>[] {
  if (recipe.steps && recipe.steps.length > 0) {
    return [{ title: 'Steps', items: recipe.steps }];
  }
  const minutes = dishMinutes(recipe);
  return [
    {
      title: 'Prep',
      items: [
        'Gather and measure all ingredients.',
        'Chop and prepare the fresh items.',
      ],
    },
    {
      title: 'Cook',
      items: [
        `Cook over medium heat for about ${Math.max(5, minutes - 10)} minutes.`,
        'Season to taste, plate up, and serve.',
      ],
    },
  ];
}

/** PLACEHOLDER reviews until real user reviews/submissions exist. */
export function dishReviews(recipe: Recipe): DishReview[] {
  return [
    { user: 'Sam', rating: 5, text: `Cheap and filling — made ${recipe.title.toLowerCase()} twice this week.` },
    { user: 'Alex', rating: 4, text: 'Easy on a student budget, came together fast.' },
  ];
}
